import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
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
    </div>
  );
}

export default App;
