import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Learning from './pages/Learning';
import FeedbackForm from './components/FeedbackForm';
import { loadReadingState } from './utils/readingState';

const Home = lazy(() => import('./pages/Home'));
const Propositions = lazy(() => import('./pages/Propositions'));
const MarketDashboard = lazy(() => import('./pages/MarketDashboard'));
const DateIndexPage = lazy(() => import('./pages/DateIndex'));
type MainView = 'learning' | 'graph' | 'propositions' | 'market' | 'dates';
const views: { id: MainView; title: string; description: string }[] = [
  { id: 'learning', title: '학습', description: '질문으로 배우기' },
  { id: 'graph', title: '용어와 관계', description: '개념 연결하기' },
  { id: 'propositions', title: '명제', description: '조건과 반례' },
  { id: 'market', title: '시장 지표', description: '숫자로 확인하기' },
  { id: 'dates', title: '업데이트', description: '새로 더한 지식' },
];

export default function App() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [view, setView] = useState<MainView>('learning');
  const [visited, setVisited] = useState(new Set<MainView>(['learning']));
  const [focusTermId, setFocusTermId] = useState<string | null>(null);
  const [focusPartId, setFocusPartId] = useState<string | null>(null);
  const [focusPropositionId, setFocusPropositionId] = useState<string | null>(null);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);
  const [fromLearning, setFromLearning] = useState(false);
  const scrollPositions = useRef<Partial<Record<MainView, number>>>({});

  function navigate(next: MainView, reset = false) {
    if (next === view) return;
    scrollPositions.current[view] = window.scrollY;
    if (reset) scrollPositions.current[next] = 0;
    setVisited(previous => new Set([...previous, next]));
    setView(next);
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.scrollTo({ top: scrollPositions.current[view] || 0 }));
    return () => cancelAnimationFrame(frame);
  }, [view]);

  function openTermInGraph(id: string) {
    if (view === 'learning') setFromLearning(true);
    setFocusPartId(view === 'learning' ? loadReadingState()?.partId || null : null);
    setFocusTermId(id);
    navigate('graph', true);
  }
  function openProposition(id: string) {
    setFocusPropositionId(id);
    navigate('propositions', true);
  }

  return (
    <div className="wordmap-app">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <header className="site-header">
        <div className="site-header-inner">
          <button className="wordmap-brand" onClick={() => navigate('learning')} aria-label="Wordmap 학습으로">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>wordmap<small>경제를 연결하다</small></span>
          </button>
          <nav className="main-navigation" aria-label="주요 메뉴">
            {views.map(item => <button type="button" key={item.id}
              aria-current={view === item.id ? 'page' : undefined}
              className={view === item.id ? 'is-active' : ''}
              onClick={() => navigate(item.id)} title={item.description}>{item.title}</button>)}
          </nav>
          <button type="button" onClick={() => setIsFeedbackOpen(true)} className="feedback-button">의견 보내기 ↗</button>
        </div>
      </header>
      {fromLearning && view !== 'learning' && <div className="learning-return">
        <span>개념을 확인했나요? 읽던 이야기가 그대로 기다리고 있어요.</span>
        <button type="button" onClick={() => { navigate('learning'); setFromLearning(false); }}>읽던 학습으로 돌아가기 →</button>
      </div>}
      <main id="main-content" tabIndex={-1}>
        <div hidden={view !== 'learning'}>
          <Learning isActive={view === 'learning'} onOpenTerm={openTermInGraph}
            onOpenMarket={() => { setFromLearning(true); navigate('market'); }}
            onOpenAllPropositions={() => { setFromLearning(true); navigate('propositions'); }}
            focusSectionId={focusSectionId} onFocusHandled={() => setFocusSectionId(null)} />
        </div>
        <Suspense fallback={<p className="page-loading" role="status">개념을 연결하고 있어요…</p>}>
          {visited.has('graph') && <div hidden={view !== 'graph'} className="explore-page">
            <Home focusTermId={focusTermId} focusPartId={focusPartId} onFocusHandled={() => setFocusTermId(null)} />
          </div>}
          {visited.has('propositions') && <div hidden={view !== 'propositions'} className="explore-page">
            <Propositions onOpenTerm={openTermInGraph} focusPropositionId={focusPropositionId}
              onFocusHandled={() => setFocusPropositionId(null)} />
          </div>}
          {view === 'market' && <div className="explore-page"><MarketDashboard /></div>}
          {view === 'dates' && <div className="explore-page"><DateIndexPage onOpenTerm={openTermInGraph}
            onOpenProposition={openProposition} onOpenCurriculum={id => { setFocusSectionId(id); navigate('learning', true); }} /></div>}
        </Suspense>
      </main>
      <footer className="site-footer"><span>wordmap</span><p>외우는 경제에서, 연결하는 경제로.</p><span>읽던 위치와 저장한 항목은 이 브라우저에 보관됩니다.</span></footer>
      <FeedbackForm isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
