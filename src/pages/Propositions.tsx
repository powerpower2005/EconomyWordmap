import { useEffect, useMemo, useState } from 'react';
import { loadPropositions, getTermById } from '../utils/dataLoader';
import { Proposition } from '../types';
import PropositionBody from '../components/PropositionBody';
import LearnedToggle from '../components/LearnedToggle';
import LearnedFilterBar from '../components/LearnedFilterBar';
import { useLearnedItems } from '../hooks/useLearnedItems';
import { countLearned, filterByLearned, type LearnedFilter } from '../utils/learnedItems';
import { formatTermDate } from '../utils/termDisplay';

interface PropositionsProps {
  onOpenTerm?: (termId: string) => void;
  focusPropositionId?: string | null;
  onFocusHandled?: () => void;
}

export default function Propositions({
  onOpenTerm,
  focusPropositionId = null,
  onFocusHandled,
}: PropositionsProps) {
  const propositions = loadPropositions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [learnedFilter, setLearnedFilter] = useState<LearnedFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(propositions[0]?.id ?? null);
  const { learned, isLearned, toggleLearned } = useLearnedItems();

  useEffect(() => {
    if (!focusPropositionId) return;
    if (propositions.some((p) => p.id === focusPropositionId)) {
      setExpandedId(focusPropositionId);
      setSelectedCategory(null);
      setLearnedFilter('all');
    }
    onFocusHandled?.();
  }, [focusPropositionId, propositions, onFocusHandled]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    propositions.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [propositions]);

  const byCategory = selectedCategory
    ? propositions.filter(p => p.category === selectedCategory)
    : propositions;

  const visible = filterByLearned(byCategory, learned, learnedFilter);
  const learnedInView = countLearned(
    byCategory.map(p => p.id),
    learned
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">경제 명제</h2>
        <p className="text-sm text-gray-600 mt-1">
          "A이면 B이다" 형태의 경제 명제가 <span className="text-green-700 font-medium">어떤 경우에 성립</span>하고{' '}
          <span className="text-red-700 font-medium">어떤 경우에 깨지는지</span>를 논리와 사례로 정리했습니다.
          체크(✓)로 배운 명제를 표시할 수 있으며, 브라우저에 저장됩니다.
        </p>
      </div>

      <LearnedFilterBar
        filter={learnedFilter}
        onChange={setLearnedFilter}
        learnedCount={learnedInView}
        totalCount={byCategory.length}
        className="mb-4"
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              selectedCategory === null
                ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            전체
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          {learnedFilter === 'learned' ? '배움으로 표시한 명제가 없습니다.' : '표시할 명제가 없습니다.'}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map(prop => (
            <PropositionCard
              key={prop.id}
              proposition={prop}
              expanded={expandedId === prop.id}
              learned={isLearned(prop.id)}
              onToggle={() => setExpandedId(expandedId === prop.id ? null : prop.id)}
              onToggleLearned={() => toggleLearned(prop.id)}
              onOpenTerm={onOpenTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PropositionCardProps {
  proposition: Proposition;
  expanded: boolean;
  learned: boolean;
  onToggle: () => void;
  onToggleLearned: () => void;
  onOpenTerm?: (termId: string) => void;
}

function PropositionCard({
  proposition,
  expanded,
  learned,
  onToggle,
  onToggleLearned,
  onOpenTerm,
}: PropositionCardProps) {
  return (
    <div
      className={`rounded-lg shadow border overflow-hidden ${
        learned ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <LearnedToggle learned={learned} onToggle={onToggleLearned} className="mt-1" />
        <button
          onClick={onToggle}
          className="flex-1 text-left flex items-start justify-between gap-3 hover:opacity-90 transition-opacity min-w-0"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {proposition.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {proposition.category}
                </span>
              )}
              {learned && (
                <span className="text-xs text-emerald-700 font-medium">배움</span>
              )}
              {(proposition.updatedAt || proposition.createdAt) && (
                <span className="text-xs text-gray-400">
                  {proposition.updatedAt
                    ? `수정 ${formatTermDate(proposition.updatedAt)}`
                    : `추가 ${formatTermDate(proposition.createdAt)}`}
                </span>
              )}
              <span
                className={`text-lg font-bold ${learned ? 'text-gray-700' : 'text-gray-900'}`}
              >
                {proposition.statement}
              </span>
            </div>
            {!expanded && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{proposition.verdict}</p>
            )}
          </div>
          <span className="text-gray-400 mt-1 shrink-0">{expanded ? '▼' : '▶'}</span>
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100/80 pt-4 ml-12">
          {proposition.termIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {proposition.termIds.map(termId => {
                const term = getTermById(termId);
                if (!term) return null;
                return (
                  <button
                    key={termId}
                    onClick={() => onOpenTerm?.(termId)}
                    className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors"
                    title="관계도에서 보기"
                  >
                    {term.name}
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
