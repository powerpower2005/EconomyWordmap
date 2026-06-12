import { useMemo, useState } from 'react';
import {
  loadCurriculum,
  getTermById,
  getStarRating,
  getPropositionById,
  getPropositionsByTermId,
} from '../utils/dataLoader';
import { CurriculumExample, CurriculumPart, CurriculumSection } from '../types';
import PropositionBody from '../components/PropositionBody';
import { loadBookmarks, toggleBookmark } from '../utils/learningProgress';

interface LearningProps {
  onOpenTerm: (termId: string) => void;
  onOpenMarket?: () => void;
  onOpenAllPropositions?: () => void;
}

export default function Learning({ onOpenTerm, onOpenMarket, onOpenAllPropositions }: LearningProps) {
  const curriculum = loadCurriculum();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks());

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
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => {
            setSelectedSectionId(null);
            setExpandedTermId(null);
            setExpandedPropId(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          ← 전체 섹션
        </button>

        <div className="mb-6">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
              섹션 {selectedSection.order}
            </span>
            <h2 className="text-2xl font-bold text-gray-900">{selectedSection.title}</h2>
          </div>
          {selectedSection.subtitle && (
            <p className="text-gray-600 mt-1">{selectedSection.subtitle}</p>
          )}
          {selectedSection.hook && (
            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-violet-700 mb-2">시작 — 한 장면으로</p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{selectedSection.hook}</p>
            </div>
          )}
          {selectedSection.overview && (
            <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-line">{selectedSection.overview}</p>
          )}
          {selectedSection.episode && (
            <div className="mt-4">
              <ExampleCard example={selectedSection.episode} variant="episode" />
            </div>
          )}
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            각 파트는 <strong>예시 → 용어·명제</strong> 순입니다. 순서는 권장일 뿐입니다.
          </p>
          {selectedSection.id === 'sec-money-value' && onOpenMarket && (
            <button
              type="button"
              onClick={onOpenMarket}
              className="mt-3 text-sm px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            >
              시장 지표 탭에서 CPI·금리 차트 보기 →
            </button>
          )}
        </div>

        <div className="space-y-10">
          {selectedSection.parts.map(part => (
            <PartBlock
              key={part.id}
              part={part}
              expandedTermId={expandedTermId}
              expandedPropId={expandedPropId}
              bookmarks={bookmarks}
              onToggleTerm={termId => setExpandedTermId(expandedTermId === termId ? null : termId)}
              onToggleProp={propId => setExpandedPropId(expandedPropId === propId ? null : propId)}
              onBookmark={handleBookmark}
              onOpenTerm={onOpenTerm}
            />
          ))}
        </div>

        {onOpenAllPropositions && (
          <button
            type="button"
            onClick={onOpenAllPropositions}
            className="mt-8 text-sm text-indigo-600 hover:text-indigo-800"
          >
            명제 탭에서 전체 보기 →
          </button>
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
      {section.hook && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{section.hook.trim().split('\n')[0]}</p>
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
  expandedTermId,
  expandedPropId,
  bookmarks,
  onToggleTerm,
  onToggleProp,
  onBookmark,
  onOpenTerm,
}: {
  part: CurriculumPart;
  expandedTermId: string | null;
  expandedPropId: string | null;
  bookmarks: Set<string>;
  onToggleTerm: (termId: string) => void;
  onToggleProp: (propId: string) => void;
  onBookmark: (id: string) => void;
  onOpenTerm: (id: string) => void;
}) {
  const terms = part.termIds
    .map(tid => getTermById(tid))
    .filter((t): t is NonNullable<typeof t> => t != null);
  const propositions = (part.propositionIds ?? [])
    .map(pid => getPropositionById(pid))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (terms.length === 0 && propositions.length === 0 && !part.lead && !part.examples?.length) return null;

  let rowIndex = 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{part.title}</h3>
        {part.subtitle && <p className="text-sm text-gray-600 mt-0.5">{part.subtitle}</p>}
        {part.lead && (
          <p className="text-sm text-gray-700 leading-relaxed mt-3 whitespace-pre-line">{part.lead}</p>
        )}
      </div>

      {part.examples && part.examples.length > 0 && (
        <div className="space-y-3 mb-5">
          {part.examples.map(example => (
            <ExampleCard key={example.title} example={example} />
          ))}
        </div>
      )}

      {part.takeaway && (
        <p className="text-sm font-medium text-violet-900 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mb-4">
          ↳ {part.takeaway}
        </p>
      )}

      {part.investorActions && part.investorActions.length > 0 && (
        <InvestorActionsBlock actions={part.investorActions} />
      )}

      {(terms.length > 0 || propositions.length > 0) && (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            더 깊게 — 용어 &amp; 명제
          </p>
          <div className="space-y-2">
            {terms.map(term => {
              const index = rowIndex++;
              return (
                <TermRow
                  key={term.id}
                  index={index}
                  term={term}
                  expanded={expandedTermId === term.id}
                  bookmarked={bookmarks.has(term.id)}
                  onToggle={() => onToggleTerm(term.id)}
                  onBookmark={() => onBookmark(term.id)}
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
                  onToggle={() => onToggleProp(prop.id)}
                  onBookmark={() => onBookmark(prop.id)}
                  onOpenTerm={onOpenTerm}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function ExampleCard({
  example,
  variant = 'default',
}: {
  example: CurriculumExample;
  variant?: 'default' | 'episode';
}) {
  const borderClass =
    variant === 'episode'
      ? 'border-violet-200 bg-violet-50/40'
      : 'border-amber-100 bg-white';
  const label = variant === 'episode' ? '한 편의 이야기' : null;

  return (
    <div className={`rounded-lg border shadow-sm px-4 py-3 ${borderClass}`}>
      {label && <p className="text-xs font-semibold text-violet-700 mb-2">{label}</p>}
      <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
        <h4 className="font-semibold text-gray-900 text-sm">{example.title}</h4>
        {example.period && (
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{example.period}</span>
        )}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{example.body}</p>
    </div>
  );
}

function InvestorActionsBlock({ actions }: { actions: string[] }) {
  return (
    <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
      <p className="text-xs font-semibold text-emerald-800 mb-2">투자자 메모 — 이렇게 행동</p>
      <ul className="space-y-1.5 text-sm text-gray-800 list-disc list-inside leading-relaxed">
        {actions.map(action => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </div>
  );
}

function TermRow({
  index,
  term,
  expanded,
  bookmarked,
  onToggle,
  onBookmark,
  onOpenTerm,
}: {
  index: number;
  term: NonNullable<ReturnType<typeof getTermById>>;
  expanded: boolean;
  bookmarked: boolean;
  onToggle: () => void;
  onBookmark: () => void;
  onOpenTerm: (id: string) => void;
}) {
  const relatedProps = getPropositionsByTermId(term.id);

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-xs text-gray-400 w-6 shrink-0">{index + 1}</span>
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left min-w-0"
        >
          <div className="font-semibold text-gray-900 truncate">{term.name}</div>
          {!expanded && (
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{term.description}</p>
          )}
        </button>
        {term.stockMarketImportance != null && (
          <span className="text-sm shrink-0 hidden sm:inline" title="주식시장 중요도">
            {getStarRating(term.stockMarketImportance)}
          </span>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBookmark();
          }}
          className={`shrink-0 text-lg ${bookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          title="북마크"
          aria-label="북마크"
        >
          ★
        </button>
        <button type="button" onClick={onToggle} className="text-gray-400 shrink-0 px-1">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">{term.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {term.category && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{term.category}</span>
            )}
            {term.stockMarketImportance != null && (
              <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-800">
                중요도 {getStarRating(term.stockMarketImportance)}
              </span>
            )}
          </div>
          {relatedProps.length > 0 && (
            <p className="text-xs text-gray-500">
              관련 명제 {relatedProps.length}개 — 관계도에서 자세히 볼 수 있습니다.
            </p>
          )}
          <button
            type="button"
            onClick={() => onOpenTerm(term.id)}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
  onToggle,
  onBookmark,
  onOpenTerm,
}: {
  index: number;
  proposition: NonNullable<ReturnType<typeof getPropositionById>>;
  expanded: boolean;
  bookmarked: boolean;
  onToggle: () => void;
  onBookmark: () => void;
  onOpenTerm: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden">
      <div className="flex items-start gap-2 px-4 py-3">
        <span className="text-xs text-gray-400 w-6 shrink-0 mt-1">{index + 1}</span>
        <button type="button" onClick={onToggle} className="flex-1 text-left min-w-0">
          <div className="text-xs text-indigo-600 font-medium mb-0.5">명제</div>
          <div className="font-semibold text-gray-900">{proposition.statement}</div>
          {!expanded && (
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{proposition.verdict}</p>
          )}
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBookmark();
          }}
          className={`shrink-0 text-lg ${bookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          aria-label="북마크"
        >
          ★
        </button>
        <button type="button" onClick={onToggle} className="text-gray-400 shrink-0 px-1">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-4">
          {proposition.termIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {proposition.termIds.map(termId => {
                const term = getTermById(termId);
                return (
                  <button
                    key={termId}
                    type="button"
                    onClick={() => onOpenTerm(termId)}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800"
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
