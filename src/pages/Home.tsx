import { loadTerms, loadRelations } from '../utils/dataLoader';
import RelationGraph from '../components/RelationGraph';

export default function Home() {
  const terms = loadTerms();
  const relations = loadRelations();

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
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>사용 방법:</strong> 그래프에서 노드(원)를 클릭하면 용어 정보를, 엣지(선)를 클릭하면 관계 정보를 확인할 수 있습니다. 
            드래그하여 그래프를 이동하고, 마우스 휠로 확대/축소할 수 있습니다.
          </p>
        </div>
      </div>

      <RelationGraph />
    </div>
  );
}
