import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { loadCurriculum, loadRelations, loadTerms } from '../utils/dataLoader';
import { createGraphIndex, getConnections, placeConnections } from '../utils/graphExplorer';
import type { Relation } from '../types';
import MarkdownProse from './MarkdownProse';
import TermCard from './TermCard';

export interface RelationGraphHandle { clickNode: (id: string, partId?: string | null) => void }
const groupLabels = { incoming: '영향을 주는 요인', outgoing: '영향을 받는 대상', related: '함께 살펴볼 개념' };
const natureLabels: Record<string, string> = { causal: '인과', policy: '정책 반응', correlational: '상관', definitional: '정의·측정', hierarchical: '분류·구성' };
const typeLabels = { proportional: '같은 방향', inverse: '반대 방향', correlation: '상관관계' };
const short = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '').trim();
const starters = ['interest-rate', 'inflation', 'stock-market', 'gdp', 'exchange-rate', 'government-bond'];

const RelationGraph = forwardRef<RelationGraphHandle>(function RelationGraph(_, ref) {
  const terms = useMemo(loadTerms, []);
  const relations = useMemo(loadRelations, []);
  const curriculum = useMemo(loadCurriculum, []);
  const index = useMemo(() => createGraphIndex(terms, relations), [terms, relations]);
  const [centerId, setCenterId] = useState('interest-rate');
  const [mode, setMode] = useState<'focus' | 'overview' | 'path'>('overview');
  const [trail, setTrail] = useState<string[]>([]);
  const [limit, setLimit] = useState(12);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [catalogLimit, setCatalogLimit] = useState(24);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [partId, setPartId] = useState('');
  const rootRef = useRef<HTMLElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mode !== 'focus') return;
    diagramRef.current?.scrollTo({ top: 0, left: 0 });
    if (window.matchMedia('(max-width: 1100px)').matches) rootRef.current?.scrollIntoView({ block: 'start' });
  }, [centerId, mode]);
  const selectConnection = (id: string | null) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 1100px)').matches) {
      detailRef.current?.scrollIntoView({ block: 'start' });
      detailRef.current?.focus({ preventScroll: true });
    }
  };
  const parts = useMemo(() => (curriculum?.sections || []).flatMap(s => s.parts.map(p => ({ ...p, sectionTitle: s.title }))), [curriculum]);
  const activePart = parts.find(p => p.id === partId);
  const center = index.byId.get(centerId)!;
  const connections = useMemo(() => getConnections(index, centerId, activePart?.termIds), [index, centerId, activePart]);
  const visible = useMemo(() => placeConnections(connections.slice(0, limit)), [connections, limit]);
  const selected = connections.find(c => c.term.id === selectedId);
  const height = Math.max(460, ...visible.map(c => c.y + 110));
  const categories = useMemo(() => [...new Set(terms.map(t => t.category || '기타'))].sort(), [terms]);
  const catalog = useMemo(() => terms.filter(t => (mode !== 'overview' || !category || (t.category || '기타') === category)
    && (!query.trim() || (t.name + ' ' + t.id).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))
    .sort((a, b) => (b.stockMarketImportance || 0) - (a.stockMarketImportance || 0) || a.id.localeCompare(b.id)), [terms, query, category, mode]);

  const visit = useCallback((id: string, linked = false) => {
    if (!index.byId.has(id)) return;
    setTrail(previous => linked ? [...previous, id].slice(-6) : [id]);
    setCenterId(id); setLimit(12); setSelectedId(null); setShowDetail(false); setMode('focus');
    setQuery('');
  }, [index]);
  useImperativeHandle(ref, () => ({ clickNode: (id, sourcePartId) => {
    const source = parts.find(p => p.id === sourcePartId && p.termIds.includes(id));
    setPartId(source?.id || ''); visit(id);
  } }), [visit, parts]);
  const back = () => {
    const next = trail.slice(0, -1);
    if (!next.length) return;
    setTrail(next); setCenterId(next[next.length - 1]); setLimit(12); setSelectedId(null); setShowDetail(false);
  };
  const choosePart = (id: string) => {
    setPartId(id);
    const part = parts.find(p => p.id === id);
    if (part?.termIds[0]) visit(part.termIds[0]);
  };
  const detail = <aside ref={detailRef} tabIndex={-1} className="map-detail" aria-label="선택한 개념과 관계">
    {selected ? <>
      <p className="eyebrow">선택한 연결 · {selected.relations.length}개 관계</p>
      <h3>{short(selected.term.name)}</h3>
      {selected.relations.map(r => <RelationDetail key={r.id} relation={r} name={id => short(index.byId.get(id)?.name || id)} />)}
      <button className="primary-action" onClick={() => visit(selected.term.id, true)}>이 개념을 중심으로 →</button>
      <button className="text-action" onClick={() => setSelectedId(null)}>연결 선택 해제</button>
    </> : <>
      <p className="eyebrow">중심 개념</p><h3>{center.name}</h3>
      <MarkdownProse source={center.description} mode="prose" />
      <p>주변 개념을 선택하면 관계의 방향·조건·시차를 확인할 수 있어요.</p>
      <button className="secondary-action" aria-expanded={showDetail} onClick={() => setShowDetail(!showDetail)}>{showDetail ? '상세 접기' : '명제·변경 이력까지 보기'}</button>
      {showDetail && <TermCard key={centerId} term={center} onOpenTerm={id => visit(id)} />}
    </>}
  </aside>;

  return <section ref={rootRef} className="map-explorer" aria-label="경제 개념 지도">
    <header className="map-heading"><div><p className="eyebrow">작은 연결에서, 큰 이해로</p><h1>경제 개념 지도</h1>
      <p>모든 노드를 한꺼번에 펼치지 않고, 궁금한 개념부터 따라갑니다.</p></div>
      <span>{terms.length}개 용어 · {relations.length}개 관계</span></header>
    <div className="map-controls">
      <div role="group" aria-label="지도 보기 방식">{(['overview', 'focus', 'path'] as const).map((value, i) =>
        <button key={value} aria-pressed={mode === value} onClick={() => { setMode(value); if (value === 'focus' && !trail.length) setTrail([centerId]); }}>{['주제 지도', '개념 탐색', '따라온 경로'][i]}</button>)}</div>
      <label>용어 찾기<input type="search" value={query} placeholder="금리, 인플레이션, GDP…" onChange={e => { setQuery(e.target.value); setCatalogLimit(24); }} /></label>
    </div>
    {query.trim() && <div className="map-search-results" aria-label="지도 검색 결과">
      <p role="status">{catalog.length}개 검색 결과{mode === 'overview' && category && ' · 선택한 분류 안에서'}</p>
      {catalog.slice(0, catalogLimit).map(t => <button key={t.id} onClick={() => visit(t.id)}>{t.name}</button>)}
      {!catalog.length && <p>다른 이름으로 검색하거나 분류를 전체로 바꿔 보세요.</p>}
      {catalog.length > catalogLimit && <button onClick={() => setCatalogLimit(n => n + 24)}>검색 결과 더 보기</button>}
    </div>}
    {mode === 'overview' ? <>
      <div className="map-starters"><h2>어디서 시작할까요?</h2><div>{starters.filter(id => index.byId.has(id)).map(id =>
        <button key={id} onClick={() => visit(id)}>{short(index.byId.get(id)!.name)} <span>→</span></button>)}</div></div>
      <h2 className="map-section-title">전체 지도를 주제별로</h2>
      <p className="map-help">묶음을 펼쳐 용어를 고르세요. 분류는 탐색용이며 인과관계를 뜻하지 않습니다.</p>
      <div className="map-topic-grid">{categories.map(c => {
        const members = terms.filter(t => (t.category || '기타') === c);
        return <button key={c} aria-pressed={category === c} onClick={() => { setCategory(category === c ? '' : c); setCatalogLimit(24); }}>
          <strong>{c}</strong><span>{members.length}개 개념</span></button>;
      })}</div>
      <div className="map-catalog"><h3>{category || '전체'} 용어 <span>{catalog.length}개</span></h3>
        {category && <button className="text-action" onClick={() => { setCategory(''); setCatalogLimit(24); }}>분류 전체로 초기화</button>}
        <div>{catalog.slice(0, catalogLimit).map(t => <button key={t.id} onClick={() => visit(t.id)}>{t.name}</button>)}</div>
        {catalog.length > catalogLimit && <button className="secondary-action" onClick={() => setCatalogLimit(n => n + 24)}>용어 24개 더 보기</button>}
      </div>
    </> : mode === 'path' ? <div className="map-path">
      <h2>내가 따라온 연결</h2><p>최근 6개 개념입니다. 화살표는 탐색 순서이며 인과 사슬을 보장하지 않습니다.</p>
      {!trail.length && <button className="primary-action" onClick={() => visit('interest-rate')}>금리에서 탐색 시작</button>}
      <ol>{trail.map((id, i) => <li key={i}><button onClick={() => { setTrail(trail.slice(0, i + 1)); setCenterId(id); setSelectedId(null); setLimit(12); setMode('focus'); }}>{short(index.byId.get(id)?.name || id)}</button>
        {i > 0 && <div>{(index.adjacency.get(id) || []).filter(r => [r.term1Id, r.term2Id].includes(trail[i - 1])).map(r =>
          <RelationDetail key={r.id} relation={r} name={key => short(index.byId.get(key)?.name || key)} />)}</div>}</li>)}</ol>
    </div> : <>
      <div className="map-focus-tools">
        <button className="secondary-action" disabled={trail.length < 2} onClick={back}>← 이전 개념</button>
        <label>학습 내용과 함께 보기<select value={partId} onChange={e => choosePart(e.target.value)}><option value="">전체 연결에서 탐색</option>
          {parts.map(p => <option key={p.id} value={p.id}>{p.sectionTitle} / {p.title}</option>)}</select></label>
      </div>
      {activePart && <div className="map-learning-context"><p>이 파트의 용어를 우선 표시합니다. 함께 등장했다는 이유만으로 연결선을 만들지 않습니다.</p>
        {activePart.termIds.filter(id => index.byId.has(id)).map(id => <button key={id} onClick={() => visit(id)}>{short(index.byId.get(id)!.name)}</button>)}</div>}
      <div className="map-status" role="status"><strong>{short(center.name)}</strong> · 연결 {Math.min(limit, connections.length)} / {connections.length}개
        <span>학습 연결 → 관계 강도 → 중요도 순 · 분류 불명확한 관계는 별도 표시</span></div>
      <div className="map-workspace">
        <div className="map-diagram-area">
          <p className="map-help">파랑: 같은 방향 · 빨강: 반대 방향 · 보라: 상관관계. 연결을 선택해 설명을 읽으세요.</p>
          <div ref={diagramRef} className="map-diagram-scroll">
            <div className="map-diagram" style={{ height }} data-node-count={visible.length + 1}>
              <div className="map-lane-label" style={{ left: '1.1%' }}>영향을 주는 요인 →</div>
              <div className="map-lane-label" style={{ left: '36.26%' }}>지금 살펴보는 개념</div>
              <div className="map-lane-label" style={{ left: '71.43%' }}>→ 영향을 받는 대상</div>
              <svg viewBox={`0 0 910 ${height}`} preserveAspectRatio="none" aria-hidden="true">
                {visible.map(c => {
                  const related = c.group === 'related';
                  const x1 = related ? 460 : c.group === 'incoming' ? 330 : 590;
                  const y1 = related ? 160 : 110;
                  const x2 = related ? 460 : c.group === 'incoming' ? 270 : 650;
                  const y2 = c.y + (related ? 0 : 40);
                  return <path key={c.term.id} d={`M ${x1} ${y1} C ${x1} ${y2}, ${x2} ${y1}, ${x2} ${y2}`}
                    fill="none" stroke={selectedId === c.term.id ? '#21624f' : '#cbd6cf'} strokeWidth={selectedId === c.term.id ? 3 : 1.5} strokeDasharray={related ? '5 5' : undefined} />;
                })}
              </svg>
              <button className="map-node map-center" style={{ left: '36.26%', top: 60 }} onClick={() => selectConnection(null)}><small>중심 개념</small><strong>{short(center.name)}</strong></button>
              <div className="map-lane-label" style={{ left: '36.26%', top: 234 }}>상관·정의·분류·양방향·미분류</div>
              {visible.map(c => <button key={c.term.id} className={`map-node ${selectedId === c.term.id ? 'is-selected' : ''}`}
                title={c.term.name} style={{ left: `${c.x / 910 * 100}%`, top: c.y }} aria-pressed={selectedId === c.term.id} onClick={() => selectConnection(c.term.id)}>
                <small>{c.group === 'incoming' ? '→ 중심 개념' : c.group === 'outgoing' ? '중심 개념 →' : '인과 단정 없이 연결'}</small>
                <strong>{short(c.term.name)}</strong><span className={`map-type type-${c.relations[0].type}`}>{typeLabels[c.relations[0].type]}</span>
              </button>)}
            </div>
          </div>
          <div className="map-mobile-connections">
            <h2>{short(center.name)}</h2>
            {(['incoming', 'outgoing', 'related'] as const).map(group => <section key={group}><h3>{groupLabels[group]}</h3>
              {visible.filter(c => c.group === group).map(c => <button key={c.term.id} aria-pressed={selectedId === c.term.id} onClick={() => selectConnection(c.term.id)}>{short(c.term.name)} <span>{typeLabels[c.relations[0].type]}</span></button>)}
              {!visible.some(c => c.group === group) && <p>표시 중인 연결 없음</p>}</section>)}
          </div>
          {!connections.length && <p className="map-help">아직 연결된 관계가 없습니다. 다른 용어를 검색해 보세요.</p>}
          {limit < connections.length && <button className="secondary-action map-more" onClick={() => setLimit(n => n + 12)}>연결 12개 더 보기 ({connections.length - limit}개 남음)</button>}
        </div>
        {detail}
      </div>
    </>}
  </section>;
});

function RelationDetail({ relation: r, name }: { relation: Relation; name: (id: string) => string }) {
  return <div className="map-relation-detail">
    <p><strong>{name(r.term1Id)} → {name(r.term2Id)}</strong></p>
    <small>{r.id} · {natureLabels[r.nature || ''] || '성격 미분류'} · {typeLabels[r.type]}</small>
    <MarkdownProse source={r.description || '관계 설명이 아직 없습니다.'} mode="prose" />
    {r.mechanism && <><h4>작동 경로</h4><MarkdownProse source={r.mechanism} mode="prose" /></>}
    {r.conditions && <p><strong>조건</strong> {r.conditions}</p>}
    {r.lag && <p><strong>시차</strong> {r.lag}</p>}
    {r.bidirectional && <><h4>{name(r.term2Id)} → {name(r.term1Id)} · {typeLabels[r.reverseType || r.type]}</h4>
      <MarkdownProse source={r.reverseDescription || '역방향 설명이 아직 없습니다.'} mode="prose" /></>}
  </div>;
}
export default RelationGraph;
