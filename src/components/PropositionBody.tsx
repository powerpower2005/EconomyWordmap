import { Proposition } from '../types';
import MarkdownProse from './MarkdownProse';

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
        <MarkdownProse source={proposition.premise || ''} mode="prose" className="text-sm text-gray-700" />
      </div>

      <div className="proposition-cases">
        <CaseList title="이럴 때 성립해요" accent="green" cases={proposition.holds} />
        <CaseList title="이럴 때 달라져요" accent="red" cases={proposition.fails} />
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <h4 className="text-sm font-semibold text-amber-800 mb-1">결론</h4>
        <MarkdownProse source={proposition.verdict || ''} mode="prose" className="text-sm text-amber-900" />
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
            <MarkdownProse source={c.detail} mode="prose" className="text-sm text-gray-700 mt-1" />
            {c.example && (
              <div className="text-xs text-gray-500 mt-2"><span className="font-medium">사례</span><MarkdownProse source={c.example} mode="prose" /></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
