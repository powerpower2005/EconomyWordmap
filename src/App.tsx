import { useState } from 'react';
import Home from './pages/Home';
import FeedbackForm from './components/FeedbackForm';

function App() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
            경제 용어 간의 비례, 반비례, 상관관계를 시각화하여 탐색하세요
          </p>
        </div>
      </header>
      <main>
        <Home />
      </main>
      <FeedbackForm 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
}

export default App;
