import { useState, useRef, useEffect } from 'react';
import { loadTerms, loadRelations, getKoreanIndex, getEnglishIndex, searchTerms } from '../utils/dataLoader';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Term[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedGuideTab, setExpandedGuideTab] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'guide' | 'search' | 'index'>('search');

  const handleTermClick = (term: Term) => {
    if (graphRef.current) {
      graphRef.current.clickNode(term.id);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = searchTerms(searchQuery);
      setSearchResults(results.slice(0, 10)); // 최대 10개만 표시
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchResultClick = (term: Term) => {
    handleTermClick(term);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 기본 자음만 사용 (쌍자음 제외)
  const koreanInitials = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const englishInitials = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex gap-4 mb-6">
          <div className="bg-white rounded-lg shadow px-4 py-2 flex items-center gap-3">
            <div className="text-lg font-bold text-blue-600">{terms.length}</div>
            <div className="text-sm text-gray-600">등록된 용어</div>
          </div>
          <div className="bg-white rounded-lg shadow px-4 py-2 flex items-center gap-3">
            <div className="text-lg font-bold text-green-600">{relations.length}</div>
            <div className="text-sm text-gray-600">관계 정의</div>
          </div>
        </div>
        {/* 통합 섹션: 사용방법, 검색, 인덱스 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* 상위 탭 */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setMainTab('search')}
              className={`px-4 py-2 font-medium ${
                mainTab === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              용어 검색
            </button>
            <button
              onClick={() => setMainTab('index')}
              className={`px-4 py-2 font-medium ${
                mainTab === 'index'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              용어 인덱스
            </button>
            <button
              onClick={() => setMainTab('guide')}
              className={`px-4 py-2 font-medium ${
                mainTab === 'guide'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              사용 방법
            </button>
          </div>

          {/* 검색 탭 */}
          {mainTab === 'search' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">용어 검색</h2>
              <div className="relative" ref={searchInputRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
                  placeholder="용어 이름, 설명, 카테고리로 검색..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map(term => (
                      <button
                        key={term.id}
                        onClick={() => handleSearchResultClick(term)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{term.name}</div>
                        {term.category && (
                          <div className="text-xs text-gray-500 mt-1">{term.category}</div>
                        )}
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{term.description}</div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 인덱스 탭 */}
          {mainTab === 'index' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">용어 인덱스</h2>
              <div className="flex gap-2 mb-3 border-b">
                <button
                  onClick={() => setActiveTab('korean')}
                  className={`px-3 py-1.5 text-sm font-medium ${
                    activeTab === 'korean'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  한글
                </button>
                <button
                  onClick={() => setActiveTab('english')}
                  className={`px-3 py-1.5 text-sm font-medium ${
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {koreanInitials.map(initial => {
                    const termsInSection = koreanIndex[initial] || [];
                    const isExpanded = expandedSection === `korean-${initial}`;
                    
                    return (
                      <div key={initial} className="border rounded">
                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : `korean-${initial}`)}
                          className="w-full px-3 py-1.5 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                        >
                          <span className="text-base text-gray-900">{initial}</span>
                          <span className="text-xs text-gray-600">({termsInSection.length}개)</span>
                        </button>
                        {isExpanded && termsInSection.length > 0 && (
                          <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                            {termsInSection.map(term => (
                              <button
                                key={term.id}
                                onClick={() => handleTermClick(term)}
                                className="text-left px-2 py-1 text-sm rounded text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                {term.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {isExpanded && termsInSection.length === 0 && (
                          <div className="p-2 text-xs text-gray-400 text-center">
                            등록된 용어가 없습니다.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 영문 인덱스 */}
              {activeTab === 'english' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {englishInitials.map(letter => {
                    const termsInSection = englishIndex[letter] || [];
                    const isExpanded = expandedSection === `english-${letter}`;
                    
                    return (
                      <div key={letter} className="border rounded">
                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : `english-${letter}`)}
                          className="w-full px-3 py-1.5 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                        >
                          <span className="text-base text-gray-900">{letter}</span>
                          <span className="text-xs text-gray-600">({termsInSection.length}개)</span>
                        </button>
                        {isExpanded && termsInSection.length > 0 && (
                          <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                            {termsInSection.map(term => (
                              <button
                                key={term.id}
                                onClick={() => handleTermClick(term)}
                                className="text-left px-2 py-1 text-sm rounded text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                {term.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {isExpanded && termsInSection.length === 0 && (
                          <div className="p-2 text-xs text-gray-400 text-center">
                            등록된 용어가 없습니다.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 사용 방법 탭 */}
          {mainTab === 'guide' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">사용 방법</h2>
              <div className="space-y-4">
              {/* 기본 사용법 */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setExpandedGuideTab(expandedGuideTab === 'basic' ? null : 'basic')}
                  className="w-full px-4 py-3 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                >
                  <span className="text-lg">1. 그래프 탐색하기</span>
                  <span className="text-sm text-gray-500">{expandedGuideTab === 'basic' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideTab === 'basic' && (
                  <div className="p-4 space-y-3 text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">• 노드(원) 클릭</h4>
                      <p className="text-sm text-gray-600 ml-4">그래프의 노드를 클릭하면 해당 용어의 상세 정보가 모달로 표시됩니다. 그래프가 자동으로 해당 노드로 이동하고 확대됩니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 엣지(선) 클릭</h4>
                      <p className="text-sm text-gray-600 ml-4">노드 사이의 연결선을 클릭하면 해당 관계의 정보가 툴팁으로 표시됩니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 그래프 이동 및 확대/축소</h4>
                      <p className="text-sm text-gray-600 ml-4">노드를 드래그하여 그래프를 이동할 수 있고, 마우스 휠을 사용하여 확대/축소할 수 있습니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 추천 단어 활용</h4>
                      <p className="text-sm text-gray-600 ml-4">그래프 위에 표시된 추천 단어(엣지가 많은 상위 5개)를 클릭하면 해당 노드로 바로 이동합니다.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 검색 기능 */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setExpandedGuideTab(expandedGuideTab === 'search' ? null : 'search')}
                  className="w-full px-4 py-3 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                >
                  <span className="text-lg">2. 용어 검색하기</span>
                  <span className="text-sm text-gray-500">{expandedGuideTab === 'search' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideTab === 'search' && (
                  <div className="p-4 space-y-3 text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">• 검색 방법</h4>
                      <p className="text-sm text-gray-600 ml-4">검색창에 용어 이름, 설명, 또는 카테고리 키워드를 입력하면 실시간으로 검색 결과가 드롭다운으로 표시됩니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 검색 결과 선택</h4>
                      <p className="text-sm text-gray-600 ml-4">드롭다운에서 원하는 용어를 클릭하면 그래프에서 해당 노드로 이동하고 상세 정보가 표시됩니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 검색 팁</h4>
                      <p className="text-sm text-gray-600 ml-4">부분 일치 검색이 가능합니다. 예를 들어 "금리"를 검색하면 "금리", "기준금리", "금리정책" 등이 모두 검색됩니다.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 인덱스 사용법 */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setExpandedGuideTab(expandedGuideTab === 'index' ? null : 'index')}
                  className="w-full px-4 py-3 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                >
                  <span className="text-lg">3. 인덱스로 찾기</span>
                  <span className="text-sm text-gray-500">{expandedGuideTab === 'index' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideTab === 'index' && (
                  <div className="p-4 space-y-3 text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">• 인덱스 펼치기</h4>
                      <p className="text-sm text-gray-600 ml-4">"용어 인덱스" 섹션의 "펼치기" 버튼을 클릭하여 인덱스를 열 수 있습니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 한글/영문 탭 선택</h4>
                      <p className="text-sm text-gray-600 ml-4">한글 용어는 "한글" 탭에서, 영문 용어는 "영문" 탭에서 찾을 수 있습니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 자음/알파벳별 탐색</h4>
                      <p className="text-sm text-gray-600 ml-4">한글은 자음(ㄱ, ㄴ, ㄷ...)별로, 영문은 알파벳(A-Z)별로 용어가 분류되어 있습니다. 각 섹션을 클릭하면 해당하는 용어 목록이 표시됩니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 용어 선택</h4>
                      <p className="text-sm text-gray-600 ml-4">인덱스에서 용어를 클릭하면 그래프에서 해당 노드로 이동하고 상세 정보가 표시됩니다.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 관계 탐색 */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setExpandedGuideTab(expandedGuideTab === 'relation' ? null : 'relation')}
                  className="w-full px-4 py-3 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                >
                  <span className="text-lg">4. 관계 탐색하기</span>
                  <span className="text-sm text-gray-500">{expandedGuideTab === 'relation' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideTab === 'relation' && (
                  <div className="p-4 space-y-3 text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">• 관계 정보 확인</h4>
                      <p className="text-sm text-gray-600 ml-4">노드를 클릭하여 열린 모달에서 "영향을 주는 관계"와 "영향을 받는 관계" 섹션을 확인할 수 있습니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 관계 단어 클릭</h4>
                      <p className="text-sm text-gray-600 ml-4">모달에서 관계가 있는 단어(파란색 버튼으로 표시)를 클릭하면 해당 용어의 상세 정보로 이동합니다. 이를 통해 관련 용어들을 연속적으로 탐색할 수 있습니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 관계 타입 이해</h4>
                      <p className="text-sm text-gray-600 ml-4">비례(파란색), 반비례(빨간색), 상관관계(보라색)로 관계가 구분되어 표시됩니다. 그래프 아래의 범례에서 각 색상의 의미를 확인할 수 있습니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 양방향 관계</h4>
                      <p className="text-sm text-gray-600 ml-4">양방향 화살표(⇄)로 표시된 관계는 두 용어가 서로 영향을 주고받는 관계입니다.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 범례 및 카테고리 */}
              <div className="border rounded-lg">
                <button
                  onClick={() => setExpandedGuideTab(expandedGuideTab === 'legend' ? null : 'legend')}
                  className="w-full px-4 py-3 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-gray-900"
                >
                  <span className="text-lg">5. 범례 및 카테고리</span>
                  <span className="text-sm text-gray-500">{expandedGuideTab === 'legend' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideTab === 'legend' && (
                  <div className="p-4 space-y-3 text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">• 관계 타입 색상</h4>
                      <p className="text-sm text-gray-600 ml-4">그래프 아래에 표시된 범례에서 각 관계 타입의 색상을 확인할 수 있습니다. 그래프의 엣지 색상과 일치합니다.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">• 카테고리 색상</h4>
                      <p className="text-sm text-gray-600 ml-4">노드의 테두리 색상은 카테고리를 나타냅니다. 범례에서 각 카테고리별 색상을 확인할 수 있습니다.</p>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <RelationGraph ref={graphRef} />
    </div>
  );
}
