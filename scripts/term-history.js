import { execSync } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const TERMS_FILE = 'src/data/terms-all.yaml';
const RELATIONS_FILE = 'src/data/relations.yaml';
const MAX_CHANGELOG_ENTRIES = 15;
const MAX_TEXT_LENGTH = 600;

const TERM_FIELD_LABELS = {
  name: '이름',
  description: '설명',
  category: '카테고리',
  stockMarketImportance: '주식시장 중요도',
};

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

function loadCurrentTermNames() {
  const path = join(REPO_ROOT, TERMS_FILE);
  if (!fs.existsSync(path)) return new Map();
  const data = yaml.load(fs.readFileSync(path, 'utf8'));
  return new Map((data?.terms || []).map((t) => [t.id, t.name || t.id]));
}

function getCommitMeta(commit) {
  const dateLine = runGit(`git log -1 --format=%ci ${commit}`);
  const date = dateLine ? dateLine.split(' ')[0] : '';
  const message = runGit(`git log -1 --format=%s ${commit}`) || '';
  return { date, message, shortHash: commit.slice(0, 7) };
}

function pushEntry(historyById, termId, entry) {
  if (!historyById[termId]) historyById[termId] = [];
  historyById[termId].push(entry);
}

function normalizeTerm(term) {
  return {
    id: term.id,
    name: term.name || '',
    description: term.description || '',
    category: term.category || '',
    stockMarketImportance:
      term.stockMarketImportance === undefined || term.stockMarketImportance === null
        ? null
        : Number(term.stockMarketImportance),
  };
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

function loadTermsMapFromCommit(commit) {
  const content = runGit(`git show ${commit}:${TERMS_FILE}`);
  if (!content) return null;
  try {
    const data = yaml.load(content);
    if (!data?.terms) return null;
    return new Map(data.terms.map((t) => [t.id, normalizeTerm(t)]));
  } catch {
    return null;
  }
}

function loadRelationsMapFromCommit(commit) {
  const content = runGit(`git show ${commit}:${RELATIONS_FILE}`);
  if (!content) return null;
  try {
    const data = yaml.load(content);
    if (!data?.relations) return null;
    return new Map(data.relations.map((r) => [r.id, normalizeRelation(r)]));
  } catch {
    return null;
  }
}

function truncateText(text) {
  if (!text || text.length <= MAX_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TEXT_LENGTH)}…`;
}

function formatRelationType(type) {
  if (!type) return '';
  return RELATION_TYPE_LABELS[type] || type;
}

function formatRelationValue(field, value) {
  if (field === 'type' || field === 'reverseType') return formatRelationType(value);
  if (field === 'bidirectional') return value === 'true' ? '양방향' : '단방향';
  return String(value ?? '');
}

function getOtherTermId(relation, perspectiveTermId) {
  if (relation.term1Id === perspectiveTermId) return relation.term2Id;
  if (relation.term2Id === perspectiveTermId) return relation.term1Id;
  return relation.term2Id;
}

function getRelationDirectionArrow(relation, perspectiveTermId) {
  return relation.term1Id === perspectiveTermId ? '→' : '←';
}

function formatRelationSnapshot(relation, perspectiveTermId, termNames) {
  const otherId = getOtherTermId(relation, perspectiveTermId);
  const otherName = termNames.get(otherId) || otherId;
  const arrow = getRelationDirectionArrow(relation, perspectiveTermId);
  const parts = [`${otherName} ${arrow}`, formatRelationType(relation.type)];
  if (relation.strength) parts.push(`강도 ${relation.strength}`);
  if (relation.bidirectional === 'true') parts.push('양방향');
  if (relation.description) parts.push(truncateText(relation.description));
  if (relation.reverseDescription && relation.bidirectional === 'true') {
    parts.push(`(역) ${truncateText(relation.reverseDescription)}`);
  }
  return parts.filter(Boolean).join(' · ');
}

function relationChangeLabel(relation, perspectiveTermId, termNames) {
  const otherId = getOtherTermId(relation, perspectiveTermId);
  const otherName = termNames.get(otherId) || otherId;
  const arrow = getRelationDirectionArrow(relation, perspectiveTermId);
  return `관계 ${arrow} ${otherName}`;
}

function compareFields(oldObj, newObj, fieldLabels) {
  const changes = [];
  for (const field of Object.keys(fieldLabels)) {
    const before = oldObj[field];
    const after = newObj[field];
    if (before !== after) {
      const isRelation = fieldLabels === RELATION_FIELD_LABELS;
      changes.push({
        field: isRelation ? 'relation' : field,
        label: fieldLabels[field],
        before: truncateText(
          isRelation ? formatRelationValue(field, before) : String(before ?? '')
        ),
        after: truncateText(
          isRelation ? formatRelationValue(field, after) : String(after ?? '')
        ),
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

function collectTermFileHistory(historyById) {
  const commitsRaw = runGit(`git log --format=%H -- "${TERMS_FILE}"`);
  if (!commitsRaw) return;

  const commits = commitsRaw.split('\n').filter(Boolean);

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const parent = i < commits.length - 1 ? commits[i + 1] : null;
    const newMap = loadTermsMapFromCommit(commit);
    if (!newMap) continue;

    const { date, message, shortHash } = getCommitMeta(commit);
    const oldMap = parent ? loadTermsMapFromCommit(parent) ?? new Map() : new Map();

    for (const [id, newTerm] of newMap) {
      const oldTerm = oldMap.get(id);

      if (!oldTerm) {
        pushEntry(historyById, id, {
          date,
          commit: shortHash,
          message,
          summary: '신규 등록',
          changes: [
            {
              field: 'description',
              label: TERM_FIELD_LABELS.description,
              before: '',
              after: truncateText(newTerm.description),
            },
          ],
        });
        continue;
      }

      const changes = compareFields(oldTerm, newTerm, TERM_FIELD_LABELS);
      if (changes.length === 0) continue;

      pushEntry(historyById, id, {
        date,
        commit: shortHash,
        message,
        summary: buildFieldSummary(changes, false, false, '', ''),
        changes,
      });
    }
  }
}

function collectRelationFileHistory(historyById, termNames) {
  const commitsRaw = runGit(`git log --format=%H -- "${RELATIONS_FILE}"`);
  if (!commitsRaw) return;

  const commits = commitsRaw.split('\n').filter(Boolean);

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const parent = i < commits.length - 1 ? commits[i + 1] : null;
    const newMap = loadRelationsMapFromCommit(commit);
    if (!newMap) continue;

    const { date, message, shortHash } = getCommitMeta(commit);
    const oldMap = parent ? loadRelationsMapFromCommit(parent) ?? new Map() : new Map();

    for (const [relationId, newRel] of newMap) {
      const oldRel = oldMap.get(relationId);
      const affectedTermIds = new Set([newRel.term1Id, newRel.term2Id].filter(Boolean));

      if (!oldRel) {
        for (const termId of affectedTermIds) {
          pushEntry(historyById, termId, {
            date,
            commit: shortHash,
            message,
            summary: '관계 추가',
            changes: [
              {
                field: 'relation',
                label: relationChangeLabel(newRel, termId, termNames),
                before: '',
                after: formatRelationSnapshot(newRel, termId, termNames),
              },
            ],
          });
        }
        continue;
      }

      const changes = compareFields(oldRel, newRel, RELATION_FIELD_LABELS);
      if (changes.length === 0) continue;

      const relForLabel = newRel;
      const summary = buildFieldSummary(changes, false, false, '관계 추가', '관계 삭제');

      for (const termId of affectedTermIds) {
        const labeledChanges = changes.map((c) => ({
          ...c,
          label: `${relationChangeLabel(relForLabel, termId, termNames)} · ${c.label}`,
        }));
        pushEntry(historyById, termId, {
          date,
          commit: shortHash,
          message,
          summary: summary.startsWith('관계') ? summary : `관계 ${summary}`,
          changes: labeledChanges,
        });
      }
    }

    for (const [relationId, oldRel] of oldMap) {
      if (newMap.has(relationId)) continue;
      const { date, message, shortHash } = getCommitMeta(commit);
      const affectedTermIds = new Set([oldRel.term1Id, oldRel.term2Id].filter(Boolean));

      for (const termId of affectedTermIds) {
        pushEntry(historyById, termId, {
          date,
          commit: shortHash,
          message,
          summary: '관계 삭제',
          changes: [
            {
              field: 'relation',
              label: relationChangeLabel(oldRel, termId, termNames),
              before: formatRelationSnapshot(oldRel, termId, termNames),
              after: '',
            },
          ],
        });
      }
    }
  }
}

function finalizeHistory(historyById) {
  const meta = {};

  for (const [id, entries] of Object.entries(historyById)) {
    entries.sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return (b.commit || '').localeCompare(a.commit || '');
    });

    const changelog = entries.slice(0, MAX_CHANGELOG_ENTRIES);
    meta[id] = {
      updatedAt: changelog[0]?.date || undefined,
      changelog,
    };
  }

  return meta;
}

/**
 * Git history for terms-all.yaml + relations.yaml → per-term updatedAt + changelog.
 * @returns {Record<string, { updatedAt: string, changelog: object[] }>}
 */
export function generateTermHistory() {
  if (!isGitRepo()) {
    console.warn('⚠️ Git 저장소가 아니어서 용어 변경 이력을 건너뜁니다.');
    return {};
  }

  const historyById = {};
  const termNames = loadCurrentTermNames();

  collectTermFileHistory(historyById);
  collectRelationFileHistory(historyById, termNames);

  return finalizeHistory(historyById);
}

export function applyTermHistoryToTerms(terms, historyMeta) {
  return terms.map((term) => {
    const meta = historyMeta[term.id];
    if (!meta) return term;
    return {
      ...term,
      updatedAt: meta.updatedAt,
      changelog: meta.changelog,
    };
  });
}
