/**
 * Git history → per-entity dates + global dateIndex.
 * Tracks: terms, relations, propositions, curriculum sections.
 * YAML에 날짜를 수동으로 넣지 않음 — 커밋 후 빌드 시 주입.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  generateTermHistory,
  applyTermHistoryToTerms,
} from './term-history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

const RELATIONS_FILE = 'src/data/relations.yaml';
const PROPOSITIONS_FILE = 'src/data/propositions.yaml';
const CURRICULUM_FILE = 'src/data/curriculum.yaml';
const MAX_CHANGELOG_ENTRIES = 15;
const MAX_TEXT_LENGTH = 600;

const RELATION_FIELD_LABELS = {
  type: '관계 유형',
  description: '관계 설명',
  strength: '관계 강도',
  bidirectional: '양방향 여부',
  reverseType: '역방향 유형',
  reverseDescription: '역방향 설명',
  reverseStrength: '역방향 강도',
  term1Id: '연결 출발 용어',
  term2Id: '연결 대상 용어',
};

const PROPOSITION_FIELD_LABELS = {
  statement: '명제',
  category: '카테고리',
  premise: '전제',
  verdict: '결론',
  termIds: '관련 용어',
  relationIds: '관련 관계',
  holds: '성립 사례',
  fails: '한계·반례',
};

const CURRICULUM_FIELD_LABELS = {
  title: '제목',
  subtitle: '부제',
  learnerQuestion: '학습 질문',
  order: '순서',
  bodyDialogue: '대화 본문',
  bodyProse: '설명 본문',
  body: '본문',
  parts: '파트 구성',
};

const RELATION_TYPE_LABELS = {
  proportional: '비례',
  inverse: '반비례',
  correlation: '상관관계',
};

function runGit(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function isGitRepo() {
  return runGit('git rev-parse --is-inside-work-tree') === 'true';
}

function getCommitMeta(commit) {
  const dateLine = runGit(`git log -1 --format=%ci ${commit}`);
  const date = dateLine ? dateLine.split(' ')[0] : '';
  const message = runGit(`git log -1 --format=%s ${commit}`) || '';
  return { date, message, shortHash: commit.slice(0, 7) };
}

function truncateText(text) {
  if (!text || text.length <= MAX_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TEXT_LENGTH)}…`;
}

function stableJson(value) {
  if (value === undefined || value === null) return '';
  return JSON.stringify(value);
}

function normalizeRelation(relation) {
  return {
    id: relation.id,
    term1Id: relation.term1Id || '',
    term2Id: relation.term2Id || '',
    type: relation.type || '',
    description: relation.description || '',
    strength: relation.strength || '',
    bidirectional: relation.bidirectional ? 'true' : 'false',
    reverseType: relation.reverseType || '',
    reverseDescription: relation.reverseDescription || '',
    reverseStrength: relation.reverseStrength || '',
  };
}

function normalizeProposition(p) {
  return {
    id: p.id,
    statement: p.statement || '',
    category: p.category || '',
    premise: p.premise || '',
    verdict: p.verdict || '',
    termIds: stableJson(p.termIds || []),
    relationIds: stableJson(p.relationIds || []),
    holds: stableJson(p.holds || []),
    fails: stableJson(p.fails || []),
  };
}

function normalizeCurriculumSection(section) {
  return {
    id: section.id,
    title: section.title || '',
    subtitle: section.subtitle || '',
    learnerQuestion: section.learnerQuestion || '',
    order: section.order === undefined || section.order === null ? '' : String(section.order),
    bodyDialogue: section.bodyDialogue || '',
    bodyProse: section.bodyProse || '',
    body: section.body || '',
    parts: stableJson(
      (section.parts || []).map((part) => ({
        id: part.id,
        title: part.title || '',
        subtitle: part.subtitle || '',
        bodyDialogue: part.bodyDialogue || '',
        bodyProse: part.bodyProse || '',
        body: part.body || '',
        termIds: part.termIds || [],
        propositionIds: part.propositionIds || [],
      }))
    ),
  };
}

function loadMapFromCommit(commit, filePath, key, normalize) {
  const content = runGit(`git show ${commit}:${filePath}`);
  if (!content) return null;
  try {
    const data = yaml.load(content);
    const list = key ? data?.[key] : null;
    if (!Array.isArray(list)) return null;
    return new Map(list.map((item) => [item.id, normalize(item)]));
  } catch {
    return null;
  }
}

function loadCurriculumSectionsFromCommit(commit) {
  const content = runGit(`git show ${commit}:${CURRICULUM_FILE}`);
  if (!content) return null;
  try {
    const data = yaml.load(content);
    const sections = data?.curriculum?.sections;
    if (!Array.isArray(sections)) return null;
    return new Map(sections.map((s) => [s.id, normalizeCurriculumSection(s)]));
  } catch {
    return null;
  }
}

function compareFields(oldObj, newObj, fieldLabels) {
  const changes = [];
  for (const field of Object.keys(fieldLabels)) {
    const before = oldObj[field];
    const after = newObj[field];
    if (before !== after) {
      changes.push({
        field,
        label: fieldLabels[field],
        before: truncateText(String(before ?? '')),
        after: truncateText(String(after ?? '')),
      });
    }
  }
  return changes;
}

function buildFieldSummary(changes, isNew, isDeleted, newLabel, deleteLabel) {
  if (isNew) return newLabel;
  if (isDeleted) return deleteLabel;
  const labels = changes.map((c) => c.label);
  if (labels.length === 1) return `${labels[0]} 수정`;
  return `${labels.join('·')} 수정`;
}

function pushEntry(historyById, id, entry) {
  if (!historyById[id]) historyById[id] = [];
  historyById[id].push(entry);
}

function collectEntityFileHistory({
  historyById,
  filePath,
  loadMap,
  fieldLabels,
  kind,
  newLabel,
  deleteLabel,
  labelFor,
  primaryField,
}) {
  const commitsRaw = runGit(`git log --format=%H -- "${filePath}"`);
  if (!commitsRaw) return;

  const commits = commitsRaw.split('\n').filter(Boolean);

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const parent = i < commits.length - 1 ? commits[i + 1] : null;
    const newMap = loadMap(commit);
    if (!newMap) continue;

    const { date, message, shortHash } = getCommitMeta(commit);
    const oldMap = parent ? loadMap(parent) ?? new Map() : new Map();

    for (const [id, newItem] of newMap) {
      const oldItem = oldMap.get(id);

      if (!oldItem) {
        pushEntry(historyById, id, {
          date,
          commit: shortHash,
          message,
          kind,
          summary: newLabel,
          changes: [
            {
              field: primaryField,
              label: fieldLabels[primaryField] || '내용',
              before: '',
              after: truncateText(String(newItem[primaryField] ?? labelFor?.(newItem) ?? id)),
            },
          ],
        });
        continue;
      }

      const changes = compareFields(oldItem, newItem, fieldLabels);
      if (changes.length === 0) continue;

      pushEntry(historyById, id, {
        date,
        commit: shortHash,
        message,
        kind,
        summary: buildFieldSummary(changes, false, false, newLabel, deleteLabel),
        changes,
      });
    }

    for (const [id, oldItem] of oldMap) {
      if (newMap.has(id)) continue;
      pushEntry(historyById, id, {
        date,
        commit: shortHash,
        message,
        kind,
        summary: deleteLabel,
        changes: [
          {
            field: primaryField,
            label: fieldLabels[primaryField] || '내용',
            before: truncateText(String(oldItem[primaryField] ?? labelFor?.(oldItem) ?? id)),
            after: '',
          },
        ],
      });
    }
  }
}

function finalizeEntityHistory(historyById) {
  const meta = {};

  for (const [id, entries] of Object.entries(historyById)) {
    entries.sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return (b.commit || '').localeCompare(a.commit || '');
    });

    const changelog = entries.slice(0, MAX_CHANGELOG_ENTRIES);
    const createdEntry = [...entries]
      .reverse()
      .find((e) => e.summary === '신규 등록' || e.summary.endsWith('추가'));
    const latest = entries[0];

    meta[id] = {
      createdAt: createdEntry?.date || undefined,
      updatedAt: latest?.date || undefined,
      changelog,
    };
  }

  return meta;
}

function formatRelationType(type) {
  return RELATION_TYPE_LABELS[type] || type || '';
}

function relationLabel(rel, termNames) {
  const a = termNames.get(rel.term1Id) || rel.term1Id;
  const b = termNames.get(rel.term2Id) || rel.term2Id;
  const type = formatRelationType(rel.type);
  return type ? `${a} ↔ ${b} (${type})` : `${a} ↔ ${b}`;
}

function loadCurrentTermNames() {
  const path = join(REPO_ROOT, 'src/data/terms-all.yaml');
  if (!fs.existsSync(path)) return new Map();
  const data = yaml.load(fs.readFileSync(path, 'utf8'));
  return new Map((data?.terms || []).map((t) => [t.id, t.name || t.id]));
}

function generateRelationEntityHistory(termNames) {
  const historyById = {};
  collectEntityFileHistory({
    historyById,
    filePath: RELATIONS_FILE,
    loadMap: (commit) =>
      loadMapFromCommit(commit, RELATIONS_FILE, 'relations', normalizeRelation),
    fieldLabels: RELATION_FIELD_LABELS,
    kind: 'relation',
    newLabel: '신규 등록',
    deleteLabel: '관계 삭제',
    primaryField: 'description',
    labelFor: (rel) => relationLabel(rel, termNames),
  });
  return finalizeEntityHistory(historyById);
}

function generatePropositionHistory() {
  const historyById = {};
  collectEntityFileHistory({
    historyById,
    filePath: PROPOSITIONS_FILE,
    loadMap: (commit) =>
      loadMapFromCommit(commit, PROPOSITIONS_FILE, 'propositions', normalizeProposition),
    fieldLabels: PROPOSITION_FIELD_LABELS,
    kind: 'proposition',
    newLabel: '신규 등록',
    deleteLabel: '명제 삭제',
    primaryField: 'statement',
  });
  return finalizeEntityHistory(historyById);
}

function generateCurriculumHistory() {
  const historyById = {};
  collectEntityFileHistory({
    historyById,
    filePath: CURRICULUM_FILE,
    loadMap: loadCurriculumSectionsFromCommit,
    fieldLabels: CURRICULUM_FIELD_LABELS,
    kind: 'curriculum',
    newLabel: '신규 등록',
    deleteLabel: '섹션 삭제',
    primaryField: 'title',
  });
  return finalizeEntityHistory(historyById);
}

function applyMeta(items, historyMeta, extra = {}) {
  return (items || []).map((item) => {
    const meta = historyMeta[item.id];
    if (!meta) return item;
    return {
      ...item,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      changelog: meta.changelog,
      ...Object.fromEntries(
        Object.entries(extra).map(([key, fn]) => [key, fn(item, meta)])
      ),
    };
  });
}

function pushDateItem(byDate, date, item) {
  if (!date) return;
  if (!byDate[date]) byDate[date] = [];
  byDate[date].push(item);
}

function actionFromSummary(summary) {
  if (!summary) return 'updated';
  if (summary === '신규 등록') return 'added';
  if (summary.includes('삭제')) return 'deleted';
  // "관계 추가" 등은 용어 신규이 아님
  if (summary === '관계 추가' || summary.startsWith('관계 ')) return 'updated';
  if (summary.endsWith('추가')) return 'added';
  return 'updated';
}

/**
 * Build a date → items index from entity changelogs.
 * One row per entity per date (latest entry that day), kind-tagged.
 * Terms: only kind==='term' (관계 변경은 relation 항목으로만 표시).
 */
function buildDateIndex({
  terms,
  relations,
  propositions,
  curriculumSections,
  termNames,
}) {
  const byDate = {};

  for (const term of terms || []) {
    const byDay = new Map();
    for (const entry of term.changelog || []) {
      if (!entry.date) continue;
      if (entry.kind && entry.kind !== 'term') continue;
      const prev = byDay.get(entry.date);
      if (!prev) byDay.set(entry.date, entry);
    }
    for (const [date, entry] of byDay) {
      pushDateItem(byDate, date, {
        kind: 'term',
        id: term.id,
        label: term.name || term.id,
        action: actionFromSummary(entry.summary),
        summary: entry.summary,
        commit: entry.commit,
      });
    }
  }

  for (const rel of relations || []) {
    for (const entry of rel.changelog || []) {
      if (!entry.date) continue;
      pushDateItem(byDate, entry.date, {
        kind: 'relation',
        id: rel.id,
        label: relationLabel(rel, termNames),
        action: actionFromSummary(entry.summary),
        summary: entry.summary,
        commit: entry.commit,
        term1Id: rel.term1Id,
        term2Id: rel.term2Id,
      });
    }
  }

  for (const prop of propositions || []) {
    for (const entry of prop.changelog || []) {
      if (!entry.date) continue;
      pushDateItem(byDate, entry.date, {
        kind: 'proposition',
        id: prop.id,
        label: prop.statement || prop.id,
        action: actionFromSummary(entry.summary),
        summary: entry.summary,
        commit: entry.commit,
      });
    }
  }

  for (const section of curriculumSections || []) {
    for (const entry of section.changelog || []) {
      if (!entry.date) continue;
      pushDateItem(byDate, entry.date, {
        kind: 'curriculum',
        id: section.id,
        label: section.title || section.id,
        action: actionFromSummary(entry.summary),
        summary: entry.summary,
        commit: entry.commit,
      });
    }
  }

  // Deduplicate relation rows that also appear via term changelog noise:
  // keep one item per kind+id+date (last wins — already unique per entity loop above for props/curriculum;
  // for relations we may push multiple changelog entries same day — collapse)
  const days = Object.keys(byDate)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const seen = new Set();
      const items = [];
      for (const item of byDate[date]) {
        const key = `${item.kind}:${item.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(item);
      }
      const kindOrder = { term: 0, relation: 1, proposition: 2, curriculum: 3 };
      items.sort((a, b) => {
        const ko = (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9);
        if (ko !== 0) return ko;
        return a.label.localeCompare(b.label, 'ko');
      });
      return {
        date,
        counts: {
          term: items.filter((i) => i.kind === 'term').length,
          relation: items.filter((i) => i.kind === 'relation').length,
          proposition: items.filter((i) => i.kind === 'proposition').length,
          curriculum: items.filter((i) => i.kind === 'curriculum').length,
          total: items.length,
        },
        items,
      };
    });

  return days;
}

/**
 * Apply Git-derived dates/changelogs and build dateIndex into termsData.
 * @returns {{ termCount: number, relationCount: number, propositionCount: number, curriculumCount: number, dateCount: number }}
 */
export function applyContentHistory(termsData) {
  if (!isGitRepo()) {
    console.warn('⚠️ Git 저장소가 아니어서 콘텐츠 변경 이력을 건너뜁니다.');
    return { termCount: 0, relationCount: 0, propositionCount: 0, curriculumCount: 0, dateCount: 0 };
  }

  const termNames = loadCurrentTermNames();

  // Terms (existing pipeline — also embeds relation changes on term.changelog)
  const termHistoryMeta = generateTermHistory();
  const termCount = Object.keys(termHistoryMeta).length;
  if (termCount > 0) {
    termsData.terms = applyTermHistoryToTerms(termsData.terms || [], termHistoryMeta);
    // createdAt from oldest 신규 등록 in changelog
    termsData.terms = termsData.terms.map((term) => {
      if (term.createdAt) return term;
      const created = [...(term.changelog || [])]
        .reverse()
        .find((e) => e.kind === 'term' && e.summary === '신규 등록');
      return created?.date ? { ...term, createdAt: created.date } : term;
    });
  }

  const relationMeta = generateRelationEntityHistory(termNames);
  const relationCount = Object.keys(relationMeta).length;
  if (relationCount > 0) {
    termsData.relations = applyMeta(termsData.relations || [], relationMeta);
  }

  const propositionMeta = generatePropositionHistory();
  const propositionCount = Object.keys(propositionMeta).length;
  if (propositionCount > 0) {
    termsData.propositions = applyMeta(termsData.propositions || [], propositionMeta);
  }

  const curriculumMeta = generateCurriculumHistory();
  const curriculumCount = Object.keys(curriculumMeta).length;
  if (curriculumCount > 0 && termsData.curriculum?.sections) {
    termsData.curriculum = {
      ...termsData.curriculum,
      sections: applyMeta(termsData.curriculum.sections, curriculumMeta),
    };
  }

  termsData.dateIndex = buildDateIndex({
    terms: termsData.terms,
    relations: termsData.relations,
    propositions: termsData.propositions,
    curriculumSections: termsData.curriculum?.sections,
    termNames,
  });

  return {
    termCount,
    relationCount,
    propositionCount,
    curriculumCount,
    dateCount: termsData.dateIndex.length,
  };
}

export { generateTermHistory, applyTermHistoryToTerms };
