import { Proposition } from '../types';

interface PropositionBodyProps {
  proposition: Proposition;
}

// 명제의 본문(전제 / 성립·한계 / 결론)을 렌더링하는 공용 컴포넌트.
// 명제 탭(Propositions)과 용어 답 카드(TermCard) 양쪽에서 동일 UI로 재사용.
export default function PropositionBody({ proposition }: PropositionBodyProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">왜 이렇게 보는가 (논리)</h4>
        <p className="text-sm text-gray-700 leading-relaxed">{proposition.premise}</p>
      </div>

      <CaseList title="성립하는 경우" accent="green" cases={proposition.holds} />

      <CaseList title="성립하지 않는 경우 · 한계" accent="red" cases={proposition.fails} />

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <h4 className="text-sm font-semibold text-amber-800 mb-1">결론</h4>
        <p className="text-sm text-amber-900 leading-relaxed">{proposition.verdict}</p>
      </div>
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
