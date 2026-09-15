import { useId, useRef, useState } from 'react';
import { getTermById } from '../utils/dataLoader';
import MarkdownProse from './MarkdownProse';
import LearnedToggle from './LearnedToggle';
import { useLearnedItems } from '../hooks/useLearnedItems';

interface Props {
  termIds: string[];
  context: string;
  onOpenTerm?: (id: string) => void;
}

/** An inline detour: keep the parent claim, its scroll position and open state intact. */
export default function ConceptGlossary({ termIds, context, onOpenTerm }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelId = useId();
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const { isLearned, toggleLearned } = useLearnedItems();
  const terms = [...new Set(termIds)].map(getTermById).filter(term => term != null);
  const selected = terms.find(term => term.id === selectedId);
  const close = () => {
    const id = selectedId;
    setSelectedId(null);
    if (id) triggers.current.get(id)?.focus({ preventScroll: true });
  };
  if (!terms.length) return null;
  return <section className="concept-glossary" aria-label="명제를 이해하는 데 필요한 용어">
    <div className="concept-glossary-heading"><h4>먼저, 이 용어를 이해해요</h4><span>{terms.length}개 용어</span></div>
    <p>낯선 용어를 눌러 뜻을 확인하세요. 명제를 떠나지 않고 읽을 수 있어요.</p>
    <div className="concept-glossary-terms">{terms.map(term => <button key={term.id} type="button"
      ref={element => { if (element) triggers.current.set(term.id, element); else triggers.current.delete(term.id); }}
      aria-expanded={selectedId === term.id} aria-controls={panelId}
      onClick={() => setSelectedId(selectedId === term.id ? null : term.id)}>
      {term.name}<span aria-hidden="true">{selectedId === term.id ? ' −' : ' +'}</span>
    </button>)}</div>
    {selected && <div id={panelId} className="concept-definition" role="region" aria-label={`${selected.name} 뜻`} onKeyDown={e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }}>
      <p className="concept-breadcrumb">명제 <span aria-hidden="true">›</span> 용어 이해</p>
      <p className="concept-parent">읽던 명제: {context}</p>
      <div className="concept-definition-title"><h5>{selected.name}</h5>
        <LearnedToggle learned={isLearned(selected.id)} onToggle={() => toggleLearned(selected.id)} />
      </div>
      <MarkdownProse source={selected.description} mode="prose" />
      <div className="concept-definition-actions">
        <button type="button" className="secondary-action" onClick={close}>용어 접고 명제 계속 읽기</button>
        {onOpenTerm && <button type="button" className="text-action" onClick={() => onOpenTerm(selected.id)}>이 용어의 관계도까지 보기 ↗</button>}
      </div>
    </div>}
  </section>;
}
