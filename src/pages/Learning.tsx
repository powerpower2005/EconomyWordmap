import { useMemo, useState } from 'react';
import {
  loadCurriculum,
  getTermById,
  getStarRating,
  getPropositionById,
  getPropositionsByTermId,
} from '../utils/dataLoader';
import { CurriculumPart, CurriculumSection } from '../types';
import MarkdownProse from '../components/MarkdownProse';
import PropositionBody from '../components/PropositionBody';
import { stripMarkdownInline } from '../utils/termDisplay';
import { loadBookmarks, toggleBookmark } from '../utils/learningProgress';
import { useLearnedItems } from '../hooks/useLearnedItems';
import LearnedToggle from '../components/LearnedToggle';

export type LearnBodyFormat = 'dialogue' | 'prose';

interface LearningProps {
  onOpenTerm: (termId: string) => void;
  onOpenMarket?: () => void;
  onOpenAllPropositions?: () => void;
}

export default function Learning({ onOpenTerm, onOpenMarket, onOpenAllPropositions }: LearningProps) {
  const curriculum = loadCurriculum();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [learnFormat, setLearnFormat] = useState<LearnBodyFormat>('dialogue');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks());
  const { isLearned, toggleLearned } = useLearnedItems();

  const selectedSection = useMemo(
    () => curriculum?.sections.find(s => s.id === selectedSectionId) ?? null,
    [curriculum, selectedSectionId]
  );

  if (!curriculum) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-600">
        학습 경로 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const handleBookmark = (id: string) => {
    setBookmarks(toggleBookmark(id, bookmarks));
  };

  if (selectedSection) {
    const showDialogue = sectionHasFormat(selectedSection, 'dialogue');
    const showProse = sectionHasFormat(selectedSection, 'prose');
    const activeFormat: LearnBodyFormat =
      learnFormat === 'prose' && showProse ? 'prose' : showDialogue ? 'dialogue' : 'prose';
    const sectionBody = resolveSectionBody(selectedSection, activeFormat);
    const markdownMode = activeFormat;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => {
            setSelectedSectionId(null);
            setExpandedTermId(null);
            setExpandedPropId(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          ← 전체 섹션
        </button>

        <article>
          <header className="mb-8 border-b border-gray-200 pb-6">
            <p className="text-xs font-semibold text-violet-600 mb-2">섹션 {selectedSection.order}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
              {selectedSection.title}
            </h1>
            {selectedSection.subtitle && (
              <p className="text-gray-500 mt-2">{selectedSection.subtitle}</p>
            )}
          </header>

          {(showDialogue && showProse) && (
            <LearnFormatToggle format={activeFormat} onChange={setLearnFormat} className="mb-8" />
          )}

          {sectionBody && (
            <MarkdownProse source={sectionBody} className="mb-10" mode={markdownMode} />
          )}

          {selectedSection.id === 'sec-money-value' && onOpenMarket && (
            <p className="mb-10 text-sm">
              <button
                type="button"
                onClick={onOpenMarket}
                className="text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
              >
                시장 지표 탭에서 CPI·금리 차트 보기
              </button>
            </p>
          )}

          <div className="space-y-12">
            {selectedSection.parts.map(part => (
              <PartBlock
                key={part.id}
                part={part}
                format={activeFormat}
                markdownMode={markdownMode}
                expandedTermId={expandedTermId}
                expandedPropId={expandedPropId}
                bookmarks={bookmarks}
                isLearned={isLearned}
                onToggleLearned={toggleLearned}
                onToggleTerm={termId => setExpandedTermId(expandedTermId === termId ? null : termId)}
                onToggleProp={propId => setExpandedPropId(expandedPropId === propId ? null : propId)}
                onBookmark={handleBookmark}
                onOpenTerm={onOpenTerm}
              />
            ))}
          </div>
        </article>

        {onOpenAllPropositions && (
          <p className="mt-10 text-sm">
            <button
              type="button"
              onClick={onOpenAllPropositions}
              className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              명제 탭에서 전체 보기
            </button>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">투자자 학습</h2>
        <p className="text-sm text-gray-600 mt-1">
          주제별 <span className="font-medium">섹션</span>으로 묶었습니다. 순서는 권장일 뿐이며 자유롭게 선택하세요.
        </p>
        {curriculum.intro && (
          <p className="text-sm text-gray-500 mt-2">{curriculum.intro}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {curriculum.sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            bookmarkCount={countSectionBookmarks(section, bookmarks)}
            onSelect={() => setSelectedSectionId(section.id)}
          />
        ))}
      </div>
    </div>
  );
}

function resolveSectionBody(section: CurriculumSection, format: LearnBodyFormat): string {
  if (format === 'dialogue') {
    if (section.bodyDialogue?.trim()) return section.bodyDialogue.trim();
  } else if (section.bodyProse?.trim()) {
    return section.bodyProse.trim();
  }
  if (section.body?.trim()) return section.body.trim();

  const chunks: string[] = [];
  if (section.hook?.trim()) chunks.push(section.hook.trim());
  if (section.overview?.trim()) chunks.push(section.overview.trim());
  if (section.episode?.body?.trim()) {
    const ep = section.episode;
    const head = [ep.title, ep.period].filter(Boolean).join(' · ');
    chunks.push(head ? `### ${head}\n\n${ep.body.trim()}` : ep.body.trim());
  }
  return chunks.join('\n\n');
}

function resolvePartBody(part: CurriculumPart, format: LearnBodyFormat): string {
  if (format === 'dialogue') {
    if (part.bodyDialogue?.trim()) return part.bodyDialogue.trim();
  } else if (part.bodyProse?.trim()) {
    return part.bodyProse.trim();
  }
  if (part.body?.trim()) return part.body.trim();

  const chunks: string[] = [];
  if (part.lead?.trim()) chunks.push(part.lead.trim());

  for (const ex of part.examples ?? []) {
    const head = [ex.title, ex.period].filter(Boolean).join(' · ');
    chunks.push(head ? `### ${head}\n\n${ex.body.trim()}` : ex.body.trim());
  }

  if (part.takeaway?.trim()) chunks.push(`**정리:** ${part.takeaway.trim()}`);

  if (part.investorActions?.length) {
    const bullets = part.investorActions.map(a => `- ${a}`).join('\n');
    chunks.push(bullets);
  }

  return chunks.join('\n\n');
}

function sectionHasFormat(section: CurriculumSection, format: LearnBodyFormat): boolean {
  if (format === 'dialogue') {
    if (section.bodyDialogue?.trim()) return true;
    return section.parts.some(
      p => !!(p.bodyDialogue?.trim() || (p.body?.trim() && !p.bodyProse?.trim()))
    );
  }
  if (section.bodyProse?.trim()) return true;
  return section.parts.some(p => !!p.bodyProse?.trim());
}

function LearnFormatToggle({
  format,
  onChange,
  className = '',
}: {
  format: LearnBodyFormat;
  onChange: (format: LearnBodyFormat) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm ${className}`}
      role="tablist"
      aria-label="읽기 방식"
    >
      <button
        type="button"
        role="tab"
        aria-selected={format === 'dialogue'}
        onClick={() => onChange('dialogue')}
        className={`rounded-md px-4 py-2 font-medium transition-colors ${
          format === 'dialogue'
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        대화로
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={format === 'prose'}
        onClick={() => onChange('prose')}
        className={`rounded-md px-4 py-2 font-medium transition-colors ${
          format === 'prose'
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        설명으로
      </button>
    </div>
  );
}

function countSectionBookmarks(section: CurriculumSection, bookmarks: Set<string>): number {
  const ids = section.parts.flatMap(part => [...part.termIds, ...(part.propositionIds ?? [])]);
  return ids.filter(id => bookmarks.has(id)).length;
}

function countPartItems(part: CurriculumPart): number {
  return part.termIds.length + (part.propositionIds?.length ?? 0);
}

function SectionCard({
  section,
  bookmarkCount,
  onSelect,
}: {
  section: CurriculumSection;
  bookmarkCount: number;
  onSelect: () => void;
}) {
  const partCount = section.parts.length;
  const itemCount = section.parts.reduce((sum, part) => sum + countPartItems(part), 0);
  const preview = resolveSectionBody(section, 'dialogue').split('\n').find(line => line.trim()) ?? '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left bg-white rounded-xl shadow border border-gray-100 p-5 hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="text-xs font-bold text-violet-600 mb-1">섹션 {section.order}</div>
      <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
      {section.subtitle && (
        <p className="text-sm text-gray-600 mt-1">{section.subtitle}</p>
      )}
      {preview && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{preview.replace(/\*\*/g, '')}</p>
      )}
      <div className="flex gap-3 mt-3 text-xs text-gray-500">
        <span>{partCount}개 파트</span>
        <span>{itemCount}개 항목</span>
        {bookmarkCount > 0 && (
          <span className="text-amber-600">★ {bookmarkCount} 북마크</span>
        )}
      </div>
    </button>
  );
}

function PartBlock({
  part,
  format,
  markdownMode,
  expandedTermId,
  expandedPropId,
  bookmarks,
  isLearned,
  onToggleLearned,
  onToggleTerm,
  onToggleProp,
  onBookmark,
  onOpenTerm,
}: {
  part: CurriculumPart;
  format: LearnBodyFormat;
  markdownMode: LearnBodyFormat;
  expandedTermId: string | null;
  expandedPropId: string | null;
  bookmarks: Set<string>;
  isLearned: (id: string) => boolean;
  onToggleLearned: (id: string) => void;
  onToggleTerm: (termId: string) => void;
  onToggleProp: (propId: string) => void;
  onBookmark: (id: string) => void;
  onOpenTerm: (id: string) => void;
}) {
  const body = resolvePartBody(part, format);
  const terms = part.termIds
    .map(tid => getTermById(tid))
    .filter((t): t is NonNullable<typeof t> => t != null);
  const propositions = (part.propositionIds ?? [])
    .map(pid => getPropositionById(pid))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (!body && terms.length === 0 && propositions.length === 0) return null;

  let rowIndex = 0;
  const refCount = terms.length + propositions.length;

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900">{part.title}</h2>
      {part.subtitle && <p className="text-sm text-gray-500 mt-1">{part.subtitle}</p>}

      {body && <MarkdownProse source={body} className="mt-4" mode={markdownMode} />}

      {refCount > 0 && (
        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 select-none list-none flex items-center gap-1.5">
            <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block">▶</span>
            용어·명제 {refCount}개
          </summary>
          <div className="mt-3 space-y-2 border-l-2 border-gray-100 pl-4">
            {terms.map(term => {
              const index = rowIndex++;
              return (
                <TermRow
                  key={term.id}
                  index={index}
                  term={term}
                  expanded={expandedTermId === term.id}
                  bookmarked={bookmarks.has(term.id)}
                  learned={isLearned(term.id)}
                  onToggle={() => onToggleTerm(term.id)}
                  onBookmark={() => onBookmark(term.id)}
                  onToggleLearned={() => onToggleLearned(term.id)}
                  onOpenTerm={onOpenTerm}
                />
              );
            })}
            {propositions.map(prop => {
              const index = rowIndex++;
              return (
                <PropositionRow
                  key={prop.id}
                  index={index}
                  proposition={prop}
                  expanded={expandedPropId === prop.id}
                  bookmarked={bookmarks.has(prop.id)}
                  learned={isLearned(prop.id)}
                  onToggle={() => onToggleProp(prop.id)}
                  onBookmark={() => onBookmark(prop.id)}
                  onToggleLearned={() => onToggleLearned(prop.id)}
                  onOpenTerm={onOpenTerm}
                />
              );
            })}
          </div>
        </details>
      )}
    </section>
  );
}

function TermRow({
  index,
  term,
  expanded,
  bookmarked,
  learned,
  onToggle,
  onBookmark,
  onToggleLearned,
  onOpenTerm,
}: {
  index: number;
  term: NonNullable<ReturnType<typeof getTermById>>;
  expanded: boolean;
  bookmarked: boolean;
  learned: boolean;
  onToggle: () => void;
  onBookmark: () => void;
  onToggleLearned: () => void;
  onOpenTerm: (id: string) => void;
}) {
  const relatedProps = getPropositionsByTermId(term.id);

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        learned ? 'bg-emerald-50/60 border-emerald-100' : 'bg-gray-50/80 border-gray-100'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <LearnedToggle learned={learned} onToggle={onToggleLearned} size="sm" />
        <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}</span>
        <button type="button" onClick={onToggle} className="flex-1 text-left min-w-0">
          <div
            className={`text-sm font-medium truncate ${learned ? 'text-gray-600' : 'text-gray-900'}`}
          >
            {term.name}
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{stripMarkdownInline(term.description)}</p>
          )}
        </button>
        {term.stockMarketImportance != null && (
          <span className="text-xs shrink-0 hidden sm:inline" title="주식시장 중요도">
            {getStarRating(term.stockMarketImportance)}
          </span>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBookmark();
          }}
          className={`shrink-0 text-base ${bookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          aria-label="북마크"
        >
          ★
        </button>
        <button type="button" onClick={onToggle} className="text-gray-400 shrink-0 text-xs px-1">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
          <MarkdownProse source={term.description} mode="prose" className="text-sm text-gray-700" />
          {relatedProps.length > 0 && (
            <p className="text-xs text-gray-500">관련 명제 {relatedProps.length}개</p>
          )}
          <button
            type="button"
            onClick={() => onOpenTerm(term.id)}
            className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            관계도에서 보기
          </button>
        </div>
      )}
    </div>
  );
}

function PropositionRow({
  index,
  proposition,
  expanded,
  bookmarked,
  learned,
  onToggle,
  onBookmark,
  onToggleLearned,
  onOpenTerm,
}: {
  index: number;
  proposition: NonNullable<ReturnType<typeof getPropositionById>>;
  expanded: boolean;
  bookmarked: boolean;
  learned: boolean;
  onToggle: () => void;
  onBookmark: () => void;
  onToggleLearned: () => void;
  onOpenTerm: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        learned ? 'bg-emerald-50/50 border-emerald-100' : 'bg-indigo-50/40 border-indigo-100/80'
      }`}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <LearnedToggle learned={learned} onToggle={onToggleLearned} size="sm" className="mt-0.5" />
        <span className="text-xs text-gray-400 w-5 shrink-0 mt-0.5">{index + 1}</span>
        <button type="button" onClick={onToggle} className="flex-1 text-left min-w-0">
          <div className="text-[10px] text-indigo-600 font-medium mb-0.5">명제</div>
          <div className={`text-sm font-medium ${learned ? 'text-gray-600' : 'text-gray-900'}`}>
            {proposition.statement}
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{proposition.verdict}</p>
          )}
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBookmark();
          }}
          className={`shrink-0 text-base ${bookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          aria-label="북마크"
        >
          ★
        </button>
        <button type="button" onClick={onToggle} className="text-gray-400 shrink-0 text-xs px-1">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-indigo-100/60 pt-2 space-y-3">
          {proposition.termIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {proposition.termIds.map(termId => {
                const term = getTermById(termId);
                return (
                  <button
                    key={termId}
                    type="button"
                    onClick={() => onOpenTerm(termId)}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-800 border border-gray-100"
                  >
                    {term?.name ?? termId}
                  </button>
                );
              })}
            </div>
          )}
          <PropositionBody proposition={proposition} />
        </div>
      )}
    </div>
  );
}
