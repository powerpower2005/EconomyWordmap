import { useMemo, useState } from 'react';
import { loadPropositions, getTermById } from '../utils/dataLoader';
import { Proposition } from '../types';

interface PropositionsProps {
  onOpenTerm?: (termId: string) => void;
}

export default function Propositions({ onOpenTerm }: PropositionsProps) {
  const propositions = loadPropositions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(propositions[0]?.id ?? null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    propositions.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [propositions]);

  const visible = selectedCategory
    ? propositions.filter(p => p.category === selectedCategory)
    : propositions;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">경제 명제</h2>
        <p className="text-sm text-gray-600 mt-1">
          "A이면 B이다" 형태의 경제 명제가 <span className="text-green-700 font-medium">어떤 경우에 성립</span>하고{' '}
          <span className="text-red-700 font-medium">어떤 경우에 깨지는지</span>를 논리와 사례로 정리했습니다.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="bg-white rounded-lg shadow px-4 py-2 flex items-center gap-3">
          <div className="text-lg font-bold text-indigo-600">{propositions.length}</div>
          <div className="text-sm text-gray-600">등록된 명제</div>
        </div>
      </div>

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

      <div className="space-y-4">
        {visible.map(prop => (
          <PropositionCard
            key={prop.id}
            proposition={prop}
            expanded={expandedId === prop.id}
            onToggle={() => setExpandedId(expandedId === prop.id ? null : prop.id)}
            onOpenTerm={onOpenTerm}
          />
        ))}
      </div>
    </div>
  );
}

interface PropositionCardProps {
  proposition: Proposition;
  expanded: boolean;
  onToggle: () => void;
  onOpenTerm?: (termId: string) => void;
}

function PropositionCard({ proposition, expanded, onToggle, onOpenTerm }: PropositionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 text-left flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {proposition.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {proposition.category}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">{proposition.statement}</span>
          </div>
          {!expanded && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{proposition.verdict}</p>
          )}
        </div>
        <span className="text-gray-400 mt-1 shrink-0">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* 관련 용어 */}
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

          {/* 전제·논리 */}
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">왜 이렇게 보는가 (논리)</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{proposition.premise}</p>
          </div>

          {/* 성립하는 경우 */}
          <CaseList
            title="성립하는 경우"
            accent="green"
            cases={proposition.holds}
          />

          {/* 성립하지 않는 경우 */}
          <CaseList
            title="성립하지 않는 경우 · 한계"
            accent="red"
            cases={proposition.fails}
          />

          {/* 결론 */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">결론</h4>
            <p className="text-sm text-amber-900 leading-relaxed">{proposition.verdict}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface CaseListProps {
  title: string;
  accent: 'green' | 'red';
  cases: Proposition['holds'];
}

function CaseList({ title, accent, cases }: CaseListProps) {
  if (!cases || cases.length === 0) return null;

  const styles =
    accent === 'green'
      ? { dot: 'bg-green-500', title: 'text-green-800', border: 'border-green-100', bg: 'bg-green-50' }
      : { dot: 'bg-red-500', title: 'text-red-800', border: 'border-red-100', bg: 'bg-red-50' };

  return (
    <div>
      <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${styles.title}`}>
        <span className={`inline-block w-2 h-2 rounded-full ${styles.dot}`} />
        {title}
      </h4>
      <div className="space-y-2">
        {cases.map((c, idx) => (
          <div key={idx} className={`rounded-lg border ${styles.border} ${styles.bg} p-3`}>
            <div className="text-sm font-medium text-gray-900">{c.label}</div>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{c.detail}</p>
            {c.example && (
              <p className="text-xs text-gray-500 mt-1.5">사례: {c.example}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
