import { useMemo, useState } from 'react';
import { Relation, RelationType, Term } from '../types';
import { loadRelations, getTermById, getStarRating, getPropositionsByTermId } from '../utils/dataLoader';
import PropositionBody from './PropositionBody';
import TermChangelog from './TermChangelog';
import LearnedToggle from './LearnedToggle';
import { useLearnedItems } from '../hooks/useLearnedItems';

interface TermCardProps {
  term: Term;
  onOpenTerm: (termId: string) => void;
}

// 괄호 안 영문 표기를 제거한 짧은 이름 (방향 문구를 간결하게)
function shortName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// 관계 타입을 색상으로 (그래프 범례와 일치)
const typeColor: Record<RelationType, string> = {
  proportional: '#3b82f6',
  inverse: '#ef4444',
  correlation: '#a855f7'
};

const strengthRank = (s?: string): number => (s === 'strong' ? 3 : s === 'weak' ? 1 : 2);

const strengthLabel = (s?: string): string =>
  s === 'strong' ? '영향 큼' : s === 'weak' ? '영향 작음' : '보통';

// "A가 움직이면 B가 어떻게 되는가"를 방향 라벨/화살표/문구로 표현
function describeDirection(type: RelationType, fromName: string, toName: string) {
  const f = shortName(fromName);
  const t = shortName(toName);
  if (type === 'proportional') {
    return { label: '같은 방향', phrase: `${f} 상승 → ${t} 상승 (반대도 동일)` };
  }
  if (type === 'inverse') {
    return { label: '반대 방향', phrase: `${f} 상승 → ${t} 하락 (반대도 동일)` };
  }
  return { label: '함께 움직임', phrase: `${f} 와(과) ${t} 동행 (방향은 조건부)` };
}

interface ImpactItem {
  relation: Relation;
  otherId: string;
  otherName: string;
  otherImportance: number;
  description: string;
}

export default function TermCard({ term, onOpenTerm }: TermCardProps) {
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const { isLearned, toggleLearned } = useLearnedItems();
  const termLearned = isLearned(term.id);

  const { gives, receives, mutual } = useMemo(() => {
    const relations = loadRelations();
    const gives: ImpactItem[] = [];
    const receives: ImpactItem[] = [];
    const mutual: ImpactItem[] = [];

    relations.forEach(relation => {
      const isSource = relation.term1Id === term.id;
      const isTarget = relation.term2Id === term.id;
      if (!isSource && !isTarget) return;

      const otherId = isSource ? relation.term2Id : relation.term1Id;
      const other = getTermById(otherId);
      if (!other) return;

      const item: ImpactItem = {
        relation,
        otherId,
        otherName: other.name,
        otherImportance: other.stockMarketImportance || 0,
        description: isSource
          ? relation.description || ''
          : relation.description || ''
      };

      if (relation.bidirectional) {
        mutual.push(item);
      } else if (isSource) {
        gives.push(item);
      } else {
        receives.push(item);
      }
    });

    const byImpact = (a: ImpactItem, b: ImpactItem) => {
      const sr = strengthRank(b.relation.strength) - strengthRank(a.relation.strength);
      if (sr !== 0) return sr;
      return b.otherImportance - a.otherImportance;
    };
    gives.sort(byImpact);
    receives.sort(byImpact);
    mutual.sort(byImpact);

    return { gives, receives, mutual };
  }, [term.id]);

  const relatedPropositions = useMemo(() => getPropositionsByTermId(term.id), [term.id]);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 flex gap-3 items-center flex-wrap">
        <LearnedToggle
          learned={termLearned}
          onToggle={() => toggleLearned(term.id)}
        />
        <span className={`text-sm ${termLearned ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
          {termLearned ? '배움' : '미배움'}
        </span>
        {term.category && (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {term.category}
          </span>
        )}
        {term.stockMarketImportance && (
          <span className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm border border-yellow-200">
            주식시장 중요도: <span className="text-lg">{getStarRating(term.stockMarketImportance)}</span>
          </span>
        )}
      </div>

      <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-line mb-6">
        {term.description}
      </div>

      <div className="space-y-6">
        {mutual.length > 0 && (
          <ImpactSection
            title={`${shortName(term.name)} 와(과) 서로 영향`}
            perspective="mutual"
            thisName={term.name}
            items={mutual}
            onOpenTerm={onOpenTerm}
          />
        )}

        {gives.length > 0 && (
          <ImpactSection
            title={`${shortName(term.name)} 이(가) 움직이면`}
            perspective="gives"
            thisName={term.name}
            items={gives}
            onOpenTerm={onOpenTerm}
          />
        )}

        {receives.length > 0 && (
          <ImpactSection
            title={`${shortName(term.name)} 을(를) 움직이는 것`}
            perspective="receives"
            thisName={term.name}
            items={receives}
            onOpenTerm={onOpenTerm}
          />
        )}

        {gives.length === 0 && receives.length === 0 && mutual.length === 0 && (
          <p className="text-sm text-gray-500">아직 연결된 관계가 없습니다.</p>
        )}

        {/* 관련 명제 (조건부 결론) */}
        {relatedPropositions.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              이 용어가 등장하는 명제
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              "언제 성립하고 언제 깨지는가" — 조건부 결론으로 한 단계 더 깊이 보기
            </p>
            <div className="space-y-3">
              {relatedPropositions.map(prop => {
                const isOpen = expandedPropId === prop.id;
                const propLearned = isLearned(prop.id);
                return (
                  <div
                    key={prop.id}
                    className={`rounded-lg border overflow-hidden ${
                      propLearned ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 px-4 py-3">
                      <LearnedToggle
                        learned={propLearned}
                        onToggle={() => toggleLearned(prop.id)}
                        size="sm"
                        className="mt-1"
                      />
                      <button
                        onClick={() => setExpandedPropId(isOpen ? null : prop.id)}
                        className="flex-1 text-left flex items-start justify-between gap-3 hover:opacity-90 min-w-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {prop.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {prop.category}
                              </span>
                            )}
                            <span className={`font-bold ${propLearned ? 'text-gray-700' : 'text-gray-900'}`}>
                              {prop.statement}
                            </span>
                          </div>
                          {!isOpen && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{prop.verdict}</p>
                          )}
                        </div>
                        <span className="text-gray-400 mt-1 shrink-0">{isOpen ? '▼' : '▶'}</span>
                      </button>
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-4 ml-8">
                        <PropositionBody proposition={prop} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {(term.updatedAt || (term.changelog && term.changelog.length > 0)) && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-base font-bold text-gray-700 mb-2">최근 변경</h3>
          <TermChangelog term={term} latestOnly compact />
        </div>
      )}
    </div>
  );
}

interface ImpactSectionProps {
  title: string;
  perspective: 'gives' | 'receives' | 'mutual';
  thisName: string;
  items: ImpactItem[];
  onOpenTerm: (termId: string) => void;
}

function ImpactSection({ title, perspective, thisName, items, onOpenTerm }: ImpactSectionProps) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map(item => {
          const type = item.relation.type;
          const color = typeColor[type];
          // 방향 문구의 출발/도착은 관점에 따라 다름
          // gives: 이 용어 -> 상대 / receives: 상대 -> 이 용어 / mutual: 서로
          const dir =
            perspective === 'receives'
              ? describeDirection(type, item.otherName, thisName)
              : describeDirection(type, thisName, item.otherName);
          const arrow = perspective === 'mutual' ? '⇄' : '→';

          return (
            <div key={item.relation.id} className="border-l-4 pl-4 py-2" style={{ borderColor: color }}>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm" style={{ color }}>
                  {dir.label}
                </span>
                <span className="text-gray-400 text-sm">{arrow}</span>
                <button
                  onClick={() => onOpenTerm(item.otherId)}
                  className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 font-semibold transition-colors cursor-pointer border border-blue-200 hover:border-blue-300 text-sm"
                >
                  {item.otherName}
                </button>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {strengthLabel(item.relation.strength)}
                </span>
                {item.relation.lag && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                    시차 {item.relation.lag}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-1">{dir.phrase}</div>
              {item.description && (
                <div className="text-sm text-gray-600">{item.description}</div>
              )}
              {perspective === 'mutual' && item.relation.reverseDescription && (
                <div className="text-sm text-gray-500 mt-1 pl-3 border-l-2 border-gray-200">
                  {item.relation.reverseDescription}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
