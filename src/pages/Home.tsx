import { useState, useRef } from 'react';
import { loadTerms, loadRelations, getKoreanIndex, getEnglishIndex } from '../utils/dataLoader';
import RelationGraph, { RelationGraphHandle } from '../components/RelationGraph';
import { Term } from '../types';

export default function Home() {
  const terms = loadTerms();
  const relations = loadRelations();
  const koreanIndex = getKoreanIndex();
  const englishIndex = getEnglishIndex();
  const graphRef = useRef<RelationGraphHandle>(null);
  const [activeTab, setActiveTab] = useState<'korean' | 'english'>('korean');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleTermClick = (term: Term) => {
    if (graphRef.current) {
      graphRef.current.clickNode(term.id);
    }
  };

  const koreanInitials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const englishInitials = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{terms.length}</div>
            <div className="text-gray-600 mt-1">등록된 용어</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{relations.length}</div>
            <div className="text-gray-600 mt-1">관계 정의</div>
          </div>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <p className="text-sm text-gray-700">
            <strong>사용 방법:</strong> 그래프에서 노드(원)를 클릭하면 용어 정보를, 엣지(선)를 클릭하면 관계 정보를 확인할 수 있습니다. 
            드래그하여 그래프를 이동하고, 마우스 휠로 확대/축소할 수 있습니다.
          </p>
        </div>

        {/* 인덱스 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">용어 인덱스</h2>
          
          {/* 탭 */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab('korean')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'korean'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              한글
            </button>
            <button
              onClick={() => setActiveTab('english')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'english'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              영문
            </button>
          </div>

          {/* 한글 인덱스 */}
          {activeTab === 'korean' && (
            <div className="space-y-4">
              {koreanInitials.map(initial => {
                const termsInSection = koreanIndex[initial] || [];
                if (termsInSection.length === 0) return null;
                
                const isExpanded = expandedSection === `korean-${initial}`;
                
                return (
                  <div key={initial} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : `korean-${initial}`)}
                      className="w-full px-4 py-2 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span className="text-lg">{initial}</span>
                      <span className="text-sm text-gray-500">({termsInSection.length}개)</span>
                    </button>
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {termsInSection.map(term => (
                          <button
                            key={term.id}
                            onClick={() => handleTermClick(term)}
                            className="text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            {term.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 영문 인덱스 */}
          {activeTab === 'english' && (
            <div className="space-y-4">
              {englishInitials.map(letter => {
                const termsInSection = englishIndex[letter] || [];
                if (termsInSection.length === 0) return null;
                
                const isExpanded = expandedSection === `english-${letter}`;
                
                return (
                  <div key={letter} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : `english-${letter}`)}
                      className="w-full px-4 py-2 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span className="text-lg">{letter}</span>
                      <span className="text-sm text-gray-500">({termsInSection.length}개)</span>
                    </button>
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {termsInSection.map(term => (
                          <button
                            key={term.id}
                            onClick={() => handleTermClick(term)}
                            className="text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            {term.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <RelationGraph ref={graphRef} />
    </div>
  );
}
