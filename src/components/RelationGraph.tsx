import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';
import { loadTerms, loadRelations, getStarRating } from '../utils/dataLoader';
import { RelationType, Term } from '../types';
import TermChangelog from './TermChangelog';

export interface RelationGraphHandle {
  clickNode: (termId: string) => void;
}

const relationTypeColors: Record<RelationType, string> = {
  proportional: '#3b82f6',
  inverse: '#ef4444',
  correlation: '#a855f7'
};

const relationTypeLabels: Record<RelationType, string> = {
  proportional: '비례',
  inverse: '반비례',
  correlation: '상관관계'
};

// 사이드바 ABC 정렬용: "한글 (English)"에서 괄호 안 영문을 추출
function getEnglishName(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  return (m ? m[1] : name).trim();
}

const relationNatureLabels: Record<string, string> = {
  causal: '인과',
  correlational: '상관',
  definitional: '정의·측정',
  hierarchical: '계층',
  policy: '정책 반응'
};

// 관계의 성격(nature)과 메커니즘·조건·시차를 모달에서 보조 정보로 렌더링
function renderRelationMeta(edgeData: any) {
  const nature = edgeData.nature as string;
  const items: Array<{ label: string; value: string }> = [];
  if (edgeData.mechanism) items.push({ label: '메커니즘', value: edgeData.mechanism });
  if (edgeData.conditions) items.push({ label: '조건', value: edgeData.conditions });
  if (edgeData.lag) items.push({ label: '시차', value: edgeData.lag });
  if ((!nature || !relationNatureLabels[nature]) && items.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      {nature && relationNatureLabels[nature] && (
        <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
          {relationNatureLabels[nature]}
        </span>
      )}
      {items.map((it) => (
        <div key={it.label} className="text-xs text-gray-500">
          <span className="font-semibold text-gray-600">{it.label}:</span> {it.value}
        </div>
      ))}
    </div>
  );
}

// 카테고리 색상 정의
const categoryColors: Record<string, string> = {
  '거시경제': '#3b82f6',
  '국제경제': '#14b8a6',
  '금융': '#10b981',
  '통화': '#f59e0b',
  '통화정책': '#8b5cf6',
  '정부': '#64748b',
  '원자재': '#d97706'
};

const RelationGraph = forwardRef<RelationGraphHandle>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const layoutConfigRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<Term | null>(null);
  const [recommendedTerms, setRecommendedTerms] = useState<Term[]>([]);
  const [randomTerms, setRandomTerms] = useState<Term[]>([]);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sidebarSort, setSidebarSort] = useState<'korean' | 'english'>('korean');
  const termsRef = useRef<Term[]>([]);

  const handleNodeClick = (termId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    
    const node = cy.getElementById(termId);
    if (node.length === 0) return;
    
    const clickedTerm = termsRef.current.find(t => t.id === termId);
    if (!clickedTerm) return;
    
    // 노드 확대
    cy.animate({
      center: { eles: node },
      zoom: 1.2
    }, {
      duration: 500
    });
    
    if (selectedNode && selectedNode.id === clickedTerm.id) {
      setSelectedNode(null);
      // 원래 위치로 복귀
      cy.fit();
    } else {
      setSelectedNode(clickedTerm);
    }
  };

  // 사이드바에서 단어 클릭 시: 모달은 열지 않고 해당 노드로 이동·하이라이트만
  const focusNode = (termId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(termId);
    if (node.length === 0) return;
    cy.elements().unselect();
    node.select();
    cy.animate({
      center: { eles: node },
      zoom: 1.5
    }, {
      duration: 500
    });
  };

  // 외부에서 노드 클릭할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    clickNode: handleNodeClick
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const terms = loadTerms();
    termsRef.current = terms;
    setAllTerms(terms);
    const relations = loadRelations();

    // 추천 단어 계산 (엣지가 많은 노드 상위 5개)
    const termEdgeCounts = new Map<string, number>();
    terms.forEach(term => termEdgeCounts.set(term.id, 0));
    relations.forEach(relation => {
      const count1 = termEdgeCounts.get(relation.term1Id) || 0;
      const count2 = termEdgeCounts.get(relation.term2Id) || 0;
      termEdgeCounts.set(relation.term1Id, count1 + 1);
      termEdgeCounts.set(relation.term2Id, count2 + 1);
    });

    const sortedTerms = [...terms].sort((a, b) => {
      const countA = termEdgeCounts.get(a.id) || 0;
      const countB = termEdgeCounts.get(b.id) || 0;
      return countB - countA;
    });

    // 추천 단어 TOP 10개
    const top10Terms = sortedTerms.slice(0, 10);
    setRecommendedTerms(top10Terms);

    // 랜덤 단어 10개 (추천 단어 제외)
    const recommendedIds = new Set(top10Terms.map(t => t.id));
    const availableTerms = terms.filter(t => !recommendedIds.has(t.id));
    const shuffled = [...availableTerms].sort(() => Math.random() - 0.5);
    setRandomTerms(shuffled.slice(0, 10));

    // 관계 수의 최소값과 최대값 구하기
    const edgeCounts = Array.from(termEdgeCounts.values());
    const minEdges = Math.min(...edgeCounts);
    const maxEdges = Math.max(...edgeCounts);
    const edgeRange = maxEdges - minEdges;

    // 5단계로 나누는 함수
    const getNodeSizeLevel = (edgeCount: number): number => {
      if (edgeRange === 0) return 3; // 모든 노드가 같은 관계 수면 중간 단계
      
      // 관계 수를 0-1 범위로 정규화
      const normalized = (edgeCount - minEdges) / edgeRange;
      
      // 5단계로 분할 (0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
      if (normalized < 0.2) return 1;
      if (normalized < 0.4) return 2;
      if (normalized < 0.6) return 3;
      if (normalized < 0.8) return 4;
      return 5;
    };

    // 단계별 크기 정의 (width, height, font-size)
    const sizeByLevel: Record<number, { size: number; fontSize: number }> = {
      1: { size: 120, fontSize: 13 },
      2: { size: 150, fontSize: 14 },
      3: { size: 180, fontSize: 16 },
      4: { size: 210, fontSize: 18 },
      5: { size: 240, fontSize: 20 }
    };

    const nodes = terms.map(term => {
      const category = term.category || '기타';
      const edgeCount = termEdgeCounts.get(term.id) || 0;
      const sizeLevel = getNodeSizeLevel(edgeCount);
      
      return {
        data: {
          id: term.id,
          label: term.name,
          description: term.description,
          category: category,
          edgeCount: edgeCount,
          sizeLevel: sizeLevel
        }
      };
    });

    // 노드 수에 따라 엣지 길이를 비례하게 조정
    const nodeCount = terms.length;
    // 기본 엣지 길이를 노드 수에 비례하여 조정 (노드가 많을수록 더 길게)
    // 노드 수가 50개일 때 1200을 기준으로 비례 계산 (더 짧게)
    const baseEdgeLength = 1200;
    const baseNodeCount = 50;
    const dynamicEdgeLength = Math.max(baseEdgeLength, baseEdgeLength * (nodeCount / baseNodeCount));
    
    // 노드 간 이격을 위한 설정 (노드 수에 비례)
    const nodeOverlap = Math.max(400, 200 * (nodeCount / 50)); // 노드가 많을수록 더 큰 이격
    const componentSpacing = Math.max(400, 200 * (nodeCount / 50)); // 컴포넌트 간 간격도 증가

    // 엣지 생성 (양방향이면 하나의 엣지로, 단방향이면 한쪽 화살표만)
    const edges = relations.map(relation => {
      const term1 = terms.find(t => t.id === relation.term1Id);
      const term2 = terms.find(t => t.id === relation.term2Id);
      
      if (!term1 || !term2) return null;

      const isBidirectional = relation.bidirectional === true;
      const reverseType = relation.reverseType || relation.type;
      const reverseDescription = relation.reverseDescription || '';
      const reverseStrength = relation.reverseStrength || relation.strength || 'medium';

      return {
        data: {
          id: relation.id,
          source: relation.term1Id,
          target: relation.term2Id,
          label: relationTypeLabels[relation.type],
          type: relation.type,
          description: relation.description || '',
          strength: relation.strength || 'medium',
          // 의미론적 성격·맥락 (선택)
          nature: relation.nature || '',
          mechanism: relation.mechanism || '',
          conditions: relation.conditions || '',
          lag: relation.lag || '',
          // 양방향 정보
          bidirectional: isBidirectional,
          reverseType: reverseType,
          reverseDescription: reverseDescription,
          reverseStrength: reverseStrength,
          fromTerm: term1.name,
          toTerm: term2.name
        }
      };
    }).filter(edge => edge !== null);

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1',
            'label': 'data(label)',
            'width': function(node: any) {
              const level = node.data('sizeLevel') || 3;
              return sizeByLevel[level]?.size || 120;
            },
            'height': function(node: any) {
              const level = node.data('sizeLevel') || 3;
              return sizeByLevel[level]?.size || 120;
            },
            'font-size': function(node: any) {
              const level = node.data('sizeLevel') || 3;
              return `${sizeByLevel[level]?.fontSize || 16}px`;
            },
            'font-weight': 'bold',
            'color': '#ffffff',
            'text-outline-color': '#000000',
            'text-outline-width': 2,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': function(node: any) {
              const level = node.data('sizeLevel') || 3;
              // 타원 내부에 글자가 들어오도록 지름의 약 80%로 제한
              return `${Math.round((sizeByLevel[level]?.size || 180) * 0.8)}px`;
            },
            'border-width': function(node: any) {
              const level = node.data('sizeLevel') || 3;
              // 단계가 높을수록 두꺼운 테두리
              return level >= 4 ? 6 : level >= 3 ? 5 : 4;
            },
            'border-color': function(node: any) {
              const category = node.data('category');
              return categoryColors[category] || '#6366f1';
            },
            'border-style': 'solid',
            'shape': 'ellipse'
          }
        },
        {
          selector: 'edge',
          style: {
            // 관계 강도(strength)에 따라 선 두께를 다르게: 강함=굵게, 보통, 약함=얇게
            'width': function(edge: any) {
              const s = edge.data('strength') || 'medium';
              return s === 'strong' ? 7 : s === 'weak' ? 2.5 : 4.5;
            },
            // 강도에 따라 진하기(투명도)도 조절: 강함=진하게, 약함=흐리게
            'line-opacity': function(edge: any) {
              const s = edge.data('strength') || 'medium';
              return s === 'strong' ? 1 : s === 'weak' ? 0.55 : 0.85;
            },
            // nature가 correlational이면 점선, 그 외(인과·정책·정의·계층) 또는 미지정이면 실선
            'line-style': function(edge: any) {
              return edge.data('nature') === 'correlational' ? 'dashed' : 'solid';
            },
            'line-color': function(edge: any) {
              return relationTypeColors[edge.data('type') as RelationType] || '#94a3b8';
            },
            'target-arrow-color': function(edge: any) {
              return relationTypeColors[edge.data('type') as RelationType] || '#94a3b8';
            },
            'target-arrow-shape': 'triangle',
            'source-arrow-shape': function(edge: any) {
              return edge.data('bidirectional') ? 'triangle' : 'none';
            },
            'source-arrow-color': function(edge: any) {
              return edge.data('bidirectional') 
                ? (relationTypeColors[edge.data('type') as RelationType] || '#94a3b8')
                : 'transparent';
            },
            'curve-style': 'bezier',
            'color': function(edge: any) {
              return relationTypeColors[edge.data('type') as RelationType] || '#94a3b8';
            },
            'text-outline-color': '#000000',
            'text-outline-width': 3,
            'font-weight': 'bold'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#fbbf24'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            // 선택 시 강조: 강도별 두께에 가산하고 완전 불투명
            'width': function(edge: any) {
              const s = edge.data('strength') || 'medium';
              return (s === 'strong' ? 7 : s === 'weak' ? 2.5 : 4.5) + 3;
            },
            'line-opacity': 1,
            'opacity': 1
          }
        }
      ],
      layout: (() => {
        const layoutConfig = {
          name: 'cose',
          idealEdgeLength: dynamicEdgeLength, // 노드 수에 비례한 엣지 길이
          nodeOverlap: nodeOverlap, // 노드 수에 비례한 이격
          refresh: 1,
          fit: false, // fit을 비활성화하여 줌 레벨을 직접 제어
          padding: 5, // padding을 최소화하여 더 가깝게 배치
          randomize: false,
          componentSpacing: componentSpacing, // 노드 수에 비례한 컴포넌트 간격
          nodeRepulsion: 2000000,
          edgeElasticity: 150,
          nestingFactor: 5,
          gravity: 0.2,
          numIter: 200,
          initialTemp: 100,
          coolingFactor: 0.95,
          minTemp: 1.0,
          animate: false
        };
        layoutConfigRef.current = layoutConfig;
        return layoutConfig;
      })()
    });

    cyRef.current = cy;

    // 노드를 드래그 가능하게 설정
    cy.nodes().grabify();

    // 물리 시뮬레이션용 정적 데이터 사전 계산 (매 프레임 Cytoscape 그래프 쿼리 제거)
    // 노드 크기는 sizeLevel 기반으로 고정이므로 radius/mass는 1회만 계산하면 충분
    const nodeList = cy.nodes().toArray() as any[];
    const nodeInfo = new Map<string, { node: any; radius: number; mass: number }>();
    nodeList.forEach((node: any) => {
      const radius = Math.max(node.width(), node.height()) / 2;
      nodeInfo.set(node.id(), { node, radius, mass: radius * radius });
    });

    // 인접 노드 맵 (스프링 힘 계산용) + 연결 쌍 강도 맵 (충돌 처리용)
    const adjacency = new Map<string, Array<{ otherId: string }>>();
    const pairStrength = new Map<string, string>();
    const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    nodeList.forEach((node: any) => adjacency.set(node.id(), []));
    cy.edges().forEach((edge: any) => {
      const s = edge.source().id();
      const t = edge.target().id();
      if (s === t) return;
      const strength = edge.data('strength') || 'medium';
      adjacency.get(s)?.push({ otherId: t });
      adjacency.get(t)?.push({ otherId: s });
      pairStrength.set(pairKey(s, t), strength);
    });

    // 최대 엣지 길이 설정 (노드 수에 비례)
    // idealEdgeLength의 5.625배 (2000 * 5.625 = 11250, 18750 * 0.6 = 11250)
    const maxEdgeLength = dynamicEdgeLength * 5.625;
    const idealEdgeLength = dynamicEdgeLength; // 노드 수에 비례한 엣지 길이
    const springConstant = 0.001;
    const damping = 0.99;

    // 각 노드의 속도 저장
    const nodeVelocities = new Map<string, { vx: number; vy: number }>();
    // 드래그 중인 노드의 이전 위치 저장 (속도 계산용)
    const dragPreviousPositions = new Map<string, { x: number; y: number; time: number }>();

    // 물에 떠다니듯 부드럽게 움직이는 애니메이션
    let isDragging = false;
    let physicsActive = false; // 초기에는 레이아웃이 완료될 때까지 비활성화
    let stableFrames = 0;
    // 안정 상태가 이만큼 지속되면 rAF 루프를 멈춰 idle CPU 소모 제거
    const STABLE_LIMIT = 60;
    
    const updatePhysics = () => {
      if (!cyRef.current || isDragging || !physicsActive) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      let hasMovement = false;
      
      // 먼저 충돌 감지 및 처리 (구슬치기처럼)
      for (let i = 0; i < nodeList.length; i++) {
        const node1 = nodeList[i];
        const node1Id = node1.id();
        const pos1 = node1.position();
        const info1 = nodeInfo.get(node1Id)!;
        const radius1 = info1.radius;
        // 질량 계산: radius^2에 비례 (면적에 비례)
        const mass1 = info1.mass;
        
        if (!nodeVelocities.has(node1Id)) {
          nodeVelocities.set(node1Id, { vx: 0, vy: 0 });
        }
        const vel1 = nodeVelocities.get(node1Id)!;
        
        for (let j = i + 1; j < nodeList.length; j++) {
          const node2 = nodeList[j];
          const node2Id = node2.id();
          const pos2 = node2.position();
          const info2 = nodeInfo.get(node2Id)!;
          const radius2 = info2.radius;
          // 질량 계산: radius^2에 비례 (면적에 비례)
          const mass2 = info2.mass;
          
          if (!nodeVelocities.has(node2Id)) {
            nodeVelocities.set(node2Id, { vx: 0, vy: 0 });
          }
          const vel2 = nodeVelocities.get(node2Id)!;
          
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = radius1 + radius2;
          
          // 충돌 감지
          if (distance > 0 && distance < minDistance) {
            // 충돌 방향 벡터 정규화
            const nx = dx / distance;
            const ny = dy / distance;
            
            // 상대 속도
            const relativeVx = vel2.vx - vel1.vx;
            const relativeVy = vel2.vy - vel1.vy;
            
            // 충돌 방향으로의 상대 속도
            const relativeSpeed = relativeVx * nx + relativeVy * ny;
            
            // 충돌이 발생하는 경우만 처리 (서로 가까워지는 경우)
            if (relativeSpeed < 0) {
              // 엣지 연결 여부 확인 (사전 계산된 맵 조회)
              const connStrength = pairStrength.get(pairKey(node1Id, node2Id));
              const isConnected = connStrength !== undefined;
              
              // 엣지 장력 강도 계산 (연결된 경우)
              let edgeTensionFactor = 1.0;
              if (isConnected) {
                const strength = connStrength || 'medium';
                // 장력 강도에 따라 충돌 반응 조정
                // strong: 더 강한 반발력 (1.2배), medium: 기본 (1.0배), weak: 더 약한 반발력 (0.8배)
                if (strength === 'strong') {
                  edgeTensionFactor = 1.2;
                } else if (strength === 'weak') {
                  edgeTensionFactor = 0.8;
                }
              }
              
              // 탄성 충돌 계수 (0.8 = 약간의 에너지 손실)
              const restitution = 0.8 * edgeTensionFactor;
              
              // 질량을 고려한 충돌 계산 (구슬치기처럼)
              // v1' = v1 - (2 * m2 / (m1 + m2)) * (v1 - v2) · n * n
              // v2' = v2 - (2 * m1 / (m1 + m2)) * (v2 - v1) · n * n
              const totalMass = mass1 + mass2;
              const massRatio1 = (2 * mass2) / totalMass;
              const massRatio2 = (2 * mass1) / totalMass;
              
              // 충돌 방향으로의 상대 속도 성분
              const relativeSpeedNormal = relativeSpeed;
              
              // 질량을 고려한 속도 변화
              const deltaV1 = massRatio1 * relativeSpeedNormal * restitution;
              const deltaV2 = massRatio2 * relativeSpeedNormal * restitution;
              
              // 속도 업데이트 (질량 기반)
              vel1.vx += deltaV1 * nx;
              vel1.vy += deltaV1 * ny;
              vel2.vx -= deltaV2 * nx;
              vel2.vy -= deltaV2 * ny;
              
              // 노드 위치 분리 (겹침 방지)
              const overlap = minDistance - distance;
              // 질량에 비례하여 분리 (무거운 노드가 덜 움직임)
              const massRatio = mass1 / totalMass;
              const separationX = nx * overlap;
              const separationY = ny * overlap;
              
              node1.position({
                x: pos1.x - separationX * (1 - massRatio),
                y: pos1.y - separationY * (1 - massRatio)
              });
              node2.position({
                x: pos2.x + separationX * massRatio,
                y: pos2.y + separationY * massRatio
              });
              
              hasMovement = true;
            }
          }
        }
      }
      
      // 힘 계산 및 속도 업데이트
      nodeList.forEach((node: any) => {
        const nodeId = node.id();
        const pos = node.position();
        
        const velocity = nodeVelocities.get(nodeId)!;
        let fx = 0;
        let fy = 0;

        // 모든 노드와의 반발력 계산 (노드 지름의 1.5배 이내에서만)
        const nodeRadius = nodeInfo.get(nodeId)!.radius;
        const repulsionDistance = nodeRadius * 2.5; // 반발력 작용 거리
        const repulsionStrength = 0.15; // 반발력 강도
        
        nodeList.forEach((otherNode: any) => {
          const otherId = otherNode.id();
          if (otherId === nodeId) return; // 자기 자신은 제외
          
          const otherPos = otherNode.position();
          const otherRadius = nodeInfo.get(otherId)!.radius;
          const minDistance = nodeRadius + otherRadius;
          
          const dx = otherPos.x - pos.x;
          const dy = otherPos.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 반발력 작용 거리 이내에서만 힘 적용 (충돌하지 않는 경우)
          if (distance > minDistance && distance < repulsionDistance) {
            // 거리가 가까울수록 강한 반발력
            const repulsionForce = repulsionStrength * (1 - (distance - minDistance) / (repulsionDistance - minDistance));
            const angle = Math.atan2(dy, dx);
            // 반대 방향으로 밀어냄
            fx -= Math.cos(angle) * repulsionForce;
            fy -= Math.sin(angle) * repulsionForce;
          }
        });

        // 연결된 노드들과의 스프링 힘 계산 (사전 계산된 인접 맵 사용)
        const neighbors = adjacency.get(nodeId) || [];
        neighbors.forEach(({ otherId }) => {
          const connectedNode = nodeInfo.get(otherId)?.node;
          if (!connectedNode) return;
          const connectedPos = connectedNode.position();
          const dx = connectedPos.x - pos.x;
          const dy = connectedPos.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            // 최대 길이 제한
            const clampedDistance = Math.min(distance, maxEdgeLength);
            const targetDistance = idealEdgeLength;
            const distanceDiff = clampedDistance - targetDistance;
            
            // 거리 차이가 클수록 더 부드럽게 반응
            const force = distanceDiff * springConstant;
            
            const angle = Math.atan2(dy, dx);
            fx += Math.cos(angle) * force;
            fy += Math.sin(angle) * force;
          }
        });

        // 속도 업데이트 (댐핑 적용, 더 부드럽게 - 힘을 더 약하게 적용)
        velocity.vx = (velocity.vx * 0.98 + fx * 0.5) * damping;
        velocity.vy = (velocity.vy * 0.98 + fy * 0.5) * damping;
        
        // 최대 속도 제한 (너무 빠르게 움직이지 않도록)
        const maxSpeed = 50;
        const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
        if (speed > maxSpeed) {
          velocity.vx = (velocity.vx / speed) * maxSpeed;
          velocity.vy = (velocity.vy / speed) * maxSpeed;
        }

        // 위치 업데이트 (부드러운 움직임)
        const newX = pos.x + velocity.vx;
        const newY = pos.y + velocity.vy;

        // 움직임이 있는지 확인
        if (Math.abs(velocity.vx) > 0.05 || Math.abs(velocity.vy) > 0.05 || Math.abs(fx) > 0.01 || Math.abs(fy) > 0.01) {
          hasMovement = true;
          node.position({ x: newX, y: newY });
        } else {
          // 속도가 너무 작으면 점진적으로 감소
          velocity.vx *= 0.9;
          velocity.vy *= 0.9;
          if (Math.abs(velocity.vx) < 0.01) velocity.vx = 0;
          if (Math.abs(velocity.vy) < 0.01) velocity.vy = 0;
        }
      });

      // 안정화 확인 - 움직임이 있으면 카운터 리셋, 충분히 안정되면 루프 정지
      if (hasMovement) {
        stableFrames = 0;
      } else {
        stableFrames++;
        // 안정 상태가 STABLE_LIMIT 프레임 지속되면 루프를 멈춰 idle CPU 소모 제거
        // (드래그/노드 클릭/정렬/전체보기 시 ensurePhysicsRunning으로 재시작)
        if (stableFrames >= STABLE_LIMIT) {
          physicsActive = false;
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    // 물리 시뮬레이션 재시작 헬퍼 (정지 상태에서만 다시 가동)
    const ensurePhysicsRunning = () => {
      physicsActive = true;
      stableFrames = 0;
      if (animationFrameRef.current === null) {
        updatePhysics();
      }
    };

    // 드래그 중일 때는 물리 시뮬레이션 중지
    cy.on('drag', 'node', function(evt) {
      isDragging = true;
      const draggedNode = evt.target;
      const nodeId = draggedNode.id();
      const currentPos = draggedNode.position();
      const currentTime = Date.now();
      
      // 이전 위치가 있으면 속도 계산
      const prevPos = dragPreviousPositions.get(nodeId);
      if (prevPos) {
        const dt = (currentTime - prevPos.time) / 1000; // 초 단위
        // 더 넓은 시간 범위 허용 (0.01초 ~ 0.2초)
        if (dt > 0.001 && dt < 0.2) {
          const vx = (currentPos.x - prevPos.x) / dt;
          const vy = (currentPos.y - prevPos.y) / dt;
          
          // 최소 속도 임계값 설정 (너무 작은 움직임은 무시)
          const minSpeed = 5; // 픽셀/초
          const speed = Math.sqrt(vx * vx + vy * vy);
          
          if (speed > minSpeed) {
            // 속도 저장 (드래그 종료 시 사용)
            // 드래그 속도를 더 부드럽게 전달하기 위해 약간 감쇠
            nodeVelocities.set(nodeId, { 
              vx: vx * 0.9, 
              vy: vy * 0.9 
            });
          } else {
            // 속도가 너무 작으면 0으로 설정
            nodeVelocities.set(nodeId, { vx: 0, vy: 0 });
          }
        }
      }
      
      // 현재 위치 저장
      dragPreviousPositions.set(nodeId, {
        x: currentPos.x,
        y: currentPos.y,
        time: currentTime
      });
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    });

    cy.on('dragfree', 'node', function(evt) {
      isDragging = false;
      const draggedNode = evt.target;
      const nodeId = draggedNode.id();
      
      // 드래그 종료 시 저장된 속도 사용 (드래그 속도가 전달됨)
      // 마지막 드래그 속도를 확인하고 적용
      const currentVelocity = nodeVelocities.get(nodeId);
      if (!currentVelocity) {
        nodeVelocities.set(nodeId, { vx: 0, vy: 0 });
      } else {
        // 드래그 속도가 충돌에 제대로 반영되도록 보장
        // 최소 속도 확인 (너무 작으면 0으로)
        const speed = Math.sqrt(currentVelocity.vx * currentVelocity.vx + currentVelocity.vy * currentVelocity.vy);
        if (speed < 0.1) {
          nodeVelocities.set(nodeId, { vx: 0, vy: 0 });
        }
      }
      
      // 이전 위치 정보 정리
      dragPreviousPositions.delete(nodeId);
      
      // 드래그 종료 후 물리 시뮬레이션 재시작
      ensurePhysicsRunning();
    });

    // 레이아웃 재실행 함수
    const handleRelayout = () => {
      const cy = cyRef.current;
      if (!cy || !layoutConfigRef.current) return;
      
      // 물리 시뮬레이션 일시 중지
      physicsActive = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // 모든 노드의 속도를 0으로 초기화
      cy.nodes().forEach((node: any) => {
        nodeVelocities.set(node.id(), { vx: 0, vy: 0 });
      });
      
      // 레이아웃 재실행
      const layout = cy.layout(layoutConfigRef.current);
      
      // 레이아웃 완료 후 물리 시뮬레이션 재시작 및 전체보기
      layout.one('layoutstop', function() {
        // 모든 노드의 속도를 0으로 초기화
        cy.nodes().forEach((node: any) => {
          nodeVelocities.set(node.id(), { vx: 0, vy: 0 });
        });
        
        // 전체보기로 조정 (모든 노드가 화면에 맞게)
        cy.fit(undefined, 50);
        
        // 물리 시뮬레이션 재시작
        ensurePhysicsRunning();
      });
      
      layout.run();
    };

    // 전체보기 함수
    const handleFitView = () => {
      const cy = cyRef.current;
      if (!cy) return;
      
      cy.fit(undefined, 50); // padding 50px
      ensurePhysicsRunning();
    };

    // 레이아웃이 완료된 후에만 물리 시뮬레이션 시작
    cy.one('layoutstop', function() {
      // 초기 줌 레벨 설정 (더욱 확대된 상태 - 모든 노드를 보여줄 필요 없음)
      // fit을 하지 않고 직접 줌 레벨 설정하여 더 가깝게 보이도록
      cy.zoom(300.0); // 매우 높은 줌 레벨로 설정
      // 그래프의 중심 부분으로 이동 (모든 노드를 보여줄 필요 없음)
      const nodes = cy.nodes();
      if (nodes.length > 0) {
        // 중앙에 있는 노드들을 중심으로 배치
        const positions = nodes.map((node: any) => node.position());
        const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
        const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
        // pan을 사용하여 중심으로 이동
        const currentZoom = cy.zoom();
        const extent = cy.extent();
        const width = extent.w;
        const height = extent.h;
        const newPanX = (width / 2) - (avgX * currentZoom);
        const newPanY = (height / 2) - (avgY * currentZoom);
        cy.pan({ x: newPanX, y: newPanY });
      }
      // 모든 노드의 속도를 0으로 초기화
      cy.nodes().forEach((node: any) => {
        nodeVelocities.set(node.id(), { vx: 0, vy: 0 });
      });
      
      // 레이아웃 완료 후 즉시 물리 시뮬레이션 시작 (지연 제거)
      ensurePhysicsRunning();
    });

    // 함수들을 ref에 저장하여 외부에서 접근 가능하게 함
    (cy as any).handleRelayout = handleRelayout;
    (cy as any).handleFitView = handleFitView;

    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      handleNodeClick(nodeData.id);
      // 클릭 시 센터·줌 애니메이션과 함께 물리 시뮬레이션 재가동
      ensurePhysicsRunning();
    });

    cy.on('tap', 'edge', function(evt) {
      const edge = evt.target;
      const edgeData = edge.data();
      const description = edgeData.description || '';
      const natureLabel = relationNatureLabels[edgeData.nature as string] || '';
      
      const tooltip = document.createElement('div');
      tooltip.className = 'fixed bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-xs';
      tooltip.innerHTML = `
        <div class="font-bold text-lg mb-2" style="color: ${relationTypeColors[edgeData.type as RelationType]}">
          ${edgeData.label}${natureLabel ? ` <span class="text-xs font-normal text-gray-500">(${natureLabel})</span>` : ''}
        </div>
        <div class="text-sm text-gray-600 mb-2">${description}</div>
        ${edgeData.mechanism ? `<div class="text-xs text-gray-500 mb-1"><span class="font-semibold">메커니즘:</span> ${edgeData.mechanism}</div>` : ''}
        ${edgeData.conditions ? `<div class="text-xs text-gray-500 mb-1"><span class="font-semibold">조건:</span> ${edgeData.conditions}</div>` : ''}
        ${edgeData.lag ? `<div class="text-xs text-gray-500 mb-1"><span class="font-semibold">시차:</span> ${edgeData.lag}</div>` : ''}
        ${edgeData.strength ? `<div class="text-xs text-gray-500">강도: ${edgeData.strength === 'strong' ? '강함' : edgeData.strength === 'medium' ? '보통' : '약함'}</div>` : ''}
      `;
      document.body.appendChild(tooltip);
      
      const updatePosition = (e: MouseEvent) => {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
      };
      
      const removeTooltip = () => {
        document.body.removeChild(tooltip);
        document.removeEventListener('mousemove', updatePosition);
        document.removeEventListener('click', removeTooltip);
      };
      
      document.addEventListener('mousemove', updatePosition);
      document.addEventListener('click', removeTooltip);
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  // 사이드바 단어 목록 정렬 (가나다 / ABC)
  const sortedSidebarTerms = useMemo(() => {
    const arr = [...allTerms];
    if (sidebarSort === 'english') {
      arr.sort((a, b) => getEnglishName(a.name).localeCompare(getEnglishName(b.name), 'en'));
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return arr;
  }, [allTerms, sidebarSort]);

  return (
    <div className="w-full h-full">
      {recommendedTerms.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="text-base font-semibold text-gray-700 mb-1">추천 단어</div>
          <div className="text-xs text-gray-500 mb-2">가장 관계가 많은 단어 TOP 10개</div>
          <div className="flex flex-wrap gap-2">
            {recommendedTerms.map(term => (
              <span
                key={term.id}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => {
                  setSelectedNode(term);
                  if (cyRef.current) {
                    const node = cyRef.current.getElementById(term.id);
                    if (node.length > 0) {
                      cyRef.current.animate({
                        center: { eles: node },
                        zoom: 1.5
                      }, {
                        duration: 500
                      });
                    }
                  }
                }}
              >
                {term.name}
              </span>
            ))}
          </div>
        </div>
      )}
      {randomTerms.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="text-base font-semibold text-gray-700 mb-1">랜덤 단어</div>
          <div className="text-xs text-gray-500 mb-2">추천 단어를 제외한 랜덤 10개</div>
          <div className="flex flex-wrap gap-2">
            {randomTerms.map(term => (
              <span
                key={term.id}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => {
                  setSelectedNode(term);
                  if (cyRef.current) {
                    const node = cyRef.current.getElementById(term.id);
                    if (node.length > 0) {
                      cyRef.current.animate({
                        center: { eles: node },
                        zoom: 1.5
                      }, {
                        duration: 500
                      });
                    }
                  }
                }}
              >
                {term.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div
        className="relative w-full border-2 border-gray-200 rounded-lg bg-white mb-4 overflow-hidden"
        style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}
      >
        {showSidebar ? (
          <div className="absolute top-0 left-0 h-full w-56 bg-white/95 backdrop-blur-sm border-r border-gray-200 z-20 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">단어 목록 ({sortedSidebarTerms.length})</span>
              <button
                onClick={() => setShowSidebar(false)}
                title="사이드바 숨기기"
                className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
              >
                ×
              </button>
            </div>
            <div className="flex gap-1 px-3 py-2 border-b border-gray-200">
              <button
                onClick={() => setSidebarSort('korean')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  sidebarSort === 'korean'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                가나다
              </button>
              <button
                onClick={() => setSidebarSort('english')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  sidebarSort === 'english'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ABC
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {sortedSidebarTerms.map(term => (
                <button
                  key={term.id}
                  onClick={() => focusNode(term.id)}
                  title={term.name}
                  className={`w-full text-left px-3 py-1.5 text-sm truncate transition-colors ${
                    selectedNode?.id === term.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {term.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSidebar(true)}
            title="단어 목록 열기"
            className="absolute top-4 left-4 z-20 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            단어 목록
          </button>
        )}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => {
              const cy = cyRef.current;
              if (cy && (cy as any).handleRelayout) {
                (cy as any).handleRelayout();
              }
            }}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            정렬
          </button>
          <button
            onClick={() => {
              const cy = cyRef.current;
              if (cy && (cy as any).handleFitView) {
                (cy as any).handleFitView();
              }
            }}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            전체보기
          </button>
        </div>
        <div
          ref={containerRef}
          className="w-full h-full"
        />
      </div>
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {Object.entries(relationTypeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: relationTypeColors[type as RelationType] }}
              />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
            {[
              { label: '강함', h: 7, opacity: 1 },
              { label: '보통', h: 4.5, opacity: 0.85 },
              { label: '약함', h: 2.5, opacity: 0.55 }
            ].map(({ label, h, opacity }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className="w-5 rounded-full bg-gray-500"
                  style={{ height: `${h}px`, opacity }}
                />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">카테고리:</div>
          <div className="flex flex-wrap gap-3 items-center">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedNode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold text-gray-800">{selectedNode.name}</h2>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-4 flex gap-3 items-center flex-wrap">
              {selectedNode.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {selectedNode.category}
                </span>
              )}
              {selectedNode.stockMarketImportance && (
                <span className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm border border-yellow-200">
                  주식시장 중요도: <span className="text-lg">{getStarRating(selectedNode.stockMarketImportance)}</span>
                </span>
              )}
            </div>
            <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {selectedNode.description}
            </div>

            {cyRef.current && (() => {
              const node = cyRef.current!.getElementById(selectedNode.id);
              if (node.length === 0) return null;
              
              const outboundEdges = node.outgoers('edge');
              const inboundEdges = node.incomers('edge');
              
              return (
                <div className="space-y-6">
                  {outboundEdges.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {selectedNode.name}이(가) 영향을 주는 관계
                      </h3>
                      <div className="space-y-3">
                        {outboundEdges.map((edge: any) => {
                          const edgeData = edge.data();
                          const targetNode = cyRef.current!.getElementById(edgeData.target);
                          const targetName = targetNode.data('label');
                          const targetId = targetNode.data('id');
                          const relationType = edgeData.type;
                          const color = relationTypeColors[relationType as RelationType];
                          const isBidirectional = edgeData.bidirectional === true;
                          
                          return (
                            <div key={edgeData.id} className="space-y-2">
                              <div className="border-l-4 pl-4 py-2" style={{ borderColor: color }}>
                                <div className="font-semibold text-gray-800 mb-1">
                                  <span style={{ color }}>{relationTypeLabels[relationType as RelationType]}</span>
                                  {isBidirectional ? ' ⇄ ' : ' → '}
                                  <button
                                    onClick={() => handleNodeClick(targetId)}
                                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 font-semibold transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                                  >
                                    {targetName}
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {edgeData.description || `${selectedNode.name}이(가) ${targetName}에 영향을 줌`}
                                </div>
                                {renderRelationMeta(edgeData)}
                              </div>
                              {isBidirectional && (
                                <div className="border-l-4 pl-4 py-2 ml-4" style={{ borderColor: color, borderStyle: 'dashed' }}>
                                  <div className="font-semibold text-gray-800 mb-1 text-sm">
                                    <button
                                      onClick={() => handleNodeClick(targetId)}
                                      className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 font-semibold transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                                    >
                                      {targetName}
                                    </button>
                                    {' → '}
                                    <span style={{ color }}>{relationTypeLabels[edgeData.reverseType as RelationType]}</span>
                                    {' → '}
                                    {selectedNode.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {edgeData.reverseDescription || `${targetName}이(가) ${selectedNode.name}에 영향을 줌`}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {inboundEdges.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {selectedNode.name}에 영향을 주는 관계
                      </h3>
                      <div className="space-y-3">
                        {inboundEdges.map((edge: any) => {
                          const edgeData = edge.data();
                          const sourceNode = cyRef.current!.getElementById(edgeData.source);
                          const sourceName = sourceNode.data('label');
                          const sourceId = sourceNode.data('id');
                          const relationType = edgeData.type;
                          const color = relationTypeColors[relationType as RelationType];
                          const isBidirectional = edgeData.bidirectional === true;
                          
                          // 양방향 엣지인 경우 이미 outbound에서 표시했으므로 스킵
                          if (isBidirectional) return null;
                          
                          return (
                            <div key={edgeData.id} className="border-l-4 pl-4 py-2" style={{ borderColor: color }}>
                              <div className="font-semibold text-gray-800 mb-1">
                                <button
                                  onClick={() => handleNodeClick(sourceId)}
                                  className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 font-semibold transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                                >
                                  {sourceName}
                                </button>
                                {' → '}
                                <span style={{ color }}>{relationTypeLabels[relationType as RelationType]}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {edgeData.reverseDescription || edgeData.description || `${sourceName}이(가) ${selectedNode.name}에 영향을 줌`}
                              </div>
                              {renderRelationMeta(edgeData)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {(selectedNode.updatedAt || (selectedNode.changelog && selectedNode.changelog.length > 0)) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-base font-bold text-gray-700 mb-2">최근 변경</h3>
                <TermChangelog term={selectedNode} latestOnly compact />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

RelationGraph.displayName = 'RelationGraph';

export default RelationGraph;
