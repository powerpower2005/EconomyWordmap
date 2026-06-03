import { useState } from 'react';
import Home from './pages/Home';
import Propositions from './pages/Propositions';
import FeedbackForm from './components/FeedbackForm';

type MainView = 'graph' | 'propositions';

function App() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [view, setView] = useState<MainView>('graph');
  const [focusTermId, setFocusTermId] = useState<string | null>(null);

  const openTermInGraph = (termId: string) => {
    setView('graph');
    setFocusTermId(termId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 최상단 우측 고정 피드백 버튼 */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed top-2 right-2 md:top-4 md:right-4 z-50 px-3 py-1.5 md:px-6 md:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-sm md:text-base font-semibold transform hover:scale-105"
      >
        💬 피드백 (GitHub 이슈)
      </button>

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            경제 용어 관계 사전
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            경제 용어 간의 관계를 시각화하고, 경제 명제의 성립 조건과 한계를 탐색하세요
          </p>
          {/* 최상위 탭 */}
          <nav className="flex gap-2 mt-4">
            <button
              onClick={() => setView('graph')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                view === 'graph'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              관계도
            </button>
            <button
              onClick={() => setView('propositions')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                view === 'propositions'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              명제
            </button>
          </nav>
        </div>
      </header>
      <main>
        {/* 관계도와 명제 탭을 모두 마운트해 두고 CSS로 전환 (그래프 상태 유지) */}
        <div className={view === 'graph' ? '' : 'hidden'}>
          <Home focusTermId={focusTermId} onFocusHandled={() => setFocusTermId(null)} />
        </div>
        <div className={view === 'propositions' ? '' : 'hidden'}>
          <Propositions onOpenTerm={openTermInGraph} />
        </div>
      </main>
      <FeedbackForm
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}

export default App;
