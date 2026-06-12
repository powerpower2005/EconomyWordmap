import { useMemo, useState } from 'react';
import {
  loadCurriculum,
  getTermById,
  getStarRating,
  getPropositionById,
  getPropositionsByTermId,
} from '../utils/dataLoader';
import { CurriculumStage } from '../types';
import PropositionBody from '../components/PropositionBody';
import { loadBookmarks, toggleBookmark } from '../utils/learningProgress';

interface LearningProps {
  onOpenTerm: (termId: string) => void;
  onOpenMarket?: () => void;
  onOpenAllPropositions?: () => void;
}

export default function Learning({ onOpenTerm, onOpenMarket, onOpenAllPropositions }: LearningProps) {
  const curriculum = loadCurriculum();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks());

  const selectedStage = useMemo(
    () => curriculum?.stages.find(s => s.id === selectedStageId) ?? null,
    [curriculum, selectedStageId]
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

  if (selectedStage) {
    const isPropositionStage = (selectedStage.propositionIds?.length ?? 0) > 0;
    const stageTerms = selectedStage.termIds
      .map(tid => getTermById(tid))
      .filter((t): t is NonNullable<typeof t> => t != null);
    const stagePropositions = (selectedStage.propositionIds ?? [])
      .map(pid => getPropositionById(pid))
      .filter((p): p is NonNullable<typeof p> => p != null);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => {
            setSelectedStageId(null);
            setExpandedTermId(null);
            setExpandedPropId(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          ← 전체 단계
        </button>

        <div className="mb-6">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
              {selectedStage.order}단계
            </span>
            <h2 className="text-2xl font-bold text-gray-900">{selectedStage.title}</h2>
          </div>
          {selectedStage.subtitle && (
            <p className="text-gray-600 mt-1">{selectedStage.subtitle}</p>
          )}
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            아래 순서는 <strong>권장</strong>입니다. 원하는 항목부터 열어도 됩니다.
          </p>
          {selectedStage.order === 2 && onOpenMarket && (
            <button
              type="button"
              onClick={onOpenMarket}
              className="mt-3 text-sm px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            >
              시장 지표 탭에서 차트 보기 →
            </button>
          )}
        </div>

        <div className="space-y-2">
          {isPropositionStage
            ? stagePropositions.map((prop, index) => (
                <PropositionRow
                  key={prop.id}
                  index={index}
                  proposition={prop}
                  expanded={expandedPropId === prop.id}
                  bookmarked={bookmarks.has(prop.id)}
                  onToggle={() => setExpandedPropId(expandedPropId === prop.id ? null : prop.id)}
                  onBookmark={() => handleBookmark(prop.id)}
                  onOpenTerm={onOpenTerm}
                />
              ))
            : stageTerms.map((term, index) => (
                <TermRow
                  key={term.id}
                  index={index}
                  term={term}
                  expanded={expandedTermId === term.id}
                  bookmarked={bookmarks.has(term.id)}
                  onToggle={() => setExpandedTermId(expandedTermId === term.id ? null : term.id)}
                  onBookmark={() => handleBookmark(term.id)}
                  onOpenTerm={onOpenTerm}
                />
              ))}
        </div>

        {isPropositionStage && onOpenAllPropositions && (
          <button
            type="button"
            onClick={onOpenAllPropositions}
            className="mt-6 text-sm text-indigo-600 hover:text-indigo-800"
          >
            명제 탭에서 전체 보기 →
          </button>
        )}

        {!isPropositionStage && selectedStage.order === 5 && (
          <p className="mt-6 text-sm text-gray-500">
            이론·미시·역사 용어는 관계도에서 카테고리(경제이론, 미시경제)로 더 탐색할 수 있습니다.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">투자자 학습 경로</h2>
        <p className="text-sm text-gray-600 mt-1">
          시장 → 매크로 → 금리 → 리스크 → 이론 → 명제 순으로 <span className="font-medium">권장</span>합니다.
          단계와 항목은 자유롭게 선택하세요.
        </p>
        {curriculum.intro && (
          <p className="text-sm text-gray-500 mt-2">{curriculum.intro}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {curriculum.stages.map(stage => (
          <StageCard
            key={stage.id}
            stage={stage}
            bookmarkCount={countStageBookmarks(stage, bookmarks)}
            onSelect={() => setSelectedStageId(stage.id)}
          />
        ))}
      </div>
    </div>
  );
}

function countStageBookmarks(stage: CurriculumStage, bookmarks: Set<string>): number {
  const ids = [
    ...stage.termIds,
    ...(stage.propositionIds ?? []),
  ];
  return ids.filter(id => bookmarks.has(id)).length;
}

function StageCard({
  stage,
  bookmarkCount,
  onSelect,
}: {
  stage: CurriculumStage;
  bookmarkCount: number;
  onSelect: () => void;
}) {
  const itemCount =
    stage.propositionIds?.length ?? stage.termIds.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left bg-white rounded-xl shadow border border-gray-100 p-5 hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="text-xs font-bold text-violet-600 mb-1">{stage.order}단계</div>
      <h3 className="text-lg font-bold text-gray-900">{stage.title}</h3>
      {stage.subtitle && (
        <p className="text-sm text-gray-600 mt-1">{stage.subtitle}</p>
      )}
      <div className="flex gap-3 mt-3 text-xs text-gray-500">
        <span>{itemCount}개 항목</span>
        {bookmarkCount > 0 && (
          <span className="text-amber-600">★ {bookmarkCount} 북마크</span>
        )}
      </div>
    </button>
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
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="flex items-start gap-2 px-4 py-3">
        <span className="text-xs text-gray-400 w-6 shrink-0 mt-1">{index + 1}</span>
        <button type="button" onClick={onToggle} className="flex-1 text-left min-w-0">
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
