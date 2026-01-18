import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';
import { loadTerms, loadRelations } from '../utils/dataLoader';
import { RelationType, Term } from '../types';

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

// 카테고리 통합 및 색상 정의
const categoryColors: Record<string, string> = {
  '거시경제': '#3b82f6',
  '금융': '#10b981',
  '통화': '#f59e0b',
  '통화정책': '#8b5cf6',
  '금융안정': '#ef4444',
  '국제경제': '#14b8a6',
  '정부': '#64748b'
};

// 카테고리 매핑 (통합)
const categoryMapping: Record<string, string> = {
  '통화금융': '금융',
  '금리정책': '통화정책',
  '금리': '금융',
  '금융시장': '금융',
  '금융규제': '금융',
  '중앙은행': '정부',
  '채권': '금융'
};

const RelationGraph = forwardRef<RelationGraphHandle>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<Term | null>(null);
  const [recommendedTerms, setRecommendedTerms] = useState<Term[]>([]);
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

  // 외부에서 노드 클릭할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    clickNode: handleNodeClick
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const terms = loadTerms();
    termsRef.current = terms;
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

    setRecommendedTerms(sortedTerms.slice(0, 5));

    const nodes = terms.map(term => {
      const originalCategory = term.category || '기타';
      const mappedCategory = categoryMapping[originalCategory] || originalCategory;
      return {
        data: {
          id: term.id,
          label: term.name,
          description: term.description,
          category: mappedCategory,
          originalCategory: originalCategory
        }
      };
    });

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
            'width': 150,
            'height': 150,
            'font-size': '18px',
            'font-weight': 'bold',
            'color': '#ffffff',
            'text-outline-color': '#000000',
            'text-outline-width': 2,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '180px',
            'border-width': 6,
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
            'width': 5,
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
            'width': 5,
            'opacity': 1
          }
        }
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 1200,
        nodeOverlap: 200,
        refresh: 1,
        fit: true,
        padding: 60,
        randomize: false,
        componentSpacing: 200,
        nodeRepulsion: 2000000,
        edgeElasticity: 150,
        nestingFactor: 5,
        gravity: 0.2,
        numIter: 200,
        initialTemp: 100,
        coolingFactor: 0.95,
        minTemp: 1.0,
        animate: false
      }
    });

    cyRef.current = cy;

    // 노드를 드래그 가능하게 설정
    cy.nodes().grabify();

    // 최대 엣지 길이 설정
    const maxEdgeLength = 12500;
    const idealEdgeLength = 1200;
    const springConstant = 0.001;
    const damping = 0.99;

    // 각 노드의 속도 저장
    const nodeVelocities = new Map<string, { vx: number; vy: number }>();

    // 물에 떠다니듯 부드럽게 움직이는 애니메이션
    let isDragging = false;
    let physicsActive = false; // 초기에는 레이아웃이 완료될 때까지 비활성화
    let stableFrames = 0;
    
    const updatePhysics = () => {
      if (!cyRef.current || isDragging || !physicsActive) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      let hasMovement = false;
      cy.nodes().forEach((node: any) => {
        const nodeId = node.id();
        const pos = node.position();
        
        if (!nodeVelocities.has(nodeId)) {
          nodeVelocities.set(nodeId, { vx: 0, vy: 0 });
        }
        
        const velocity = nodeVelocities.get(nodeId)!;
        let fx = 0;
        let fy = 0;

        // 모든 노드와의 반발력 계산 (노드 지름의 1.5배 이내에서만)
        const nodeDiameter = 150; // 노드 지름
        const repulsionDistance = nodeDiameter * 1.5; // 반발력 작용 거리 (225)
        const repulsionStrength = 0.5; // 반발력 강도
        
        cy.nodes().forEach((otherNode: any) => {
          if (otherNode.id() === nodeId) return; // 자기 자신은 제외
          
          const otherPos = otherNode.position();
          const dx = otherPos.x - pos.x;
          const dy = otherPos.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 반발력 작용 거리 이내에만 힘 적용
          if (distance > 0 && distance < repulsionDistance) {
            // 거리가 가까울수록 강한 반발력
            const repulsionForce = repulsionStrength * (1 - distance / repulsionDistance);
            const angle = Math.atan2(dy, dx);
            // 반대 방향으로 밀어냄
            fx -= Math.cos(angle) * repulsionForce;
            fy -= Math.sin(angle) * repulsionForce;
          }
        });

        // 연결된 노드들과의 스프링 힘 계산
        const connectedNodes = node.neighborhood('node');
        connectedNodes.forEach((connectedNode: any) => {
          const edge = node.edgesWith(connectedNode);
          if (edge.length > 0) {
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
          }
        });

        // 속도 업데이트 (댐핑 적용, 더 부드럽게 - 힘을 더 약하게 적용)
        velocity.vx = (velocity.vx * 0.98 + fx * 0.5) * damping;
        velocity.vy = (velocity.vy * 0.98 + fy * 0.5) * damping;

        // 위치 업데이트 (부드러운 움직임)
        const newX = pos.x + velocity.vx;
        const newY = pos.y + velocity.vy;

        // 움직임이 있는지 확인
        if (Math.abs(velocity.vx) > 0.05 || Math.abs(velocity.vy) > 0.05 || Math.abs(fx) > 0.01 || Math.abs(fy) > 0.01) {
          hasMovement = true;
          node.position({ x: newX, y: newY });
        } else {
          velocity.vx = 0;
          velocity.vy = 0;
        }
      });

      // 안정화 확인 - 30프레임 동안 움직임이 없으면 물리 시뮬레이션 중지
      if (hasMovement) {
        stableFrames = 0;
      } else {
        stableFrames++;
        if (stableFrames > 30) {
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

    // 드래그 중일 때는 물리 시뮬레이션 중지
    cy.on('drag', 'node', function(evt) {
      isDragging = true;
      const draggedNode = evt.target;
      // 드래그 중인 노드의 속도 초기화
      nodeVelocities.set(draggedNode.id(), { vx: 0, vy: 0 });
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    });

    cy.on('dragfree', 'node', function(evt) {
      isDragging = false;
      const draggedNode = evt.target;
      // 드래그 종료 시 속도 초기화
      nodeVelocities.set(draggedNode.id(), { vx: 0, vy: 0 });
      
      // 드래그 종료 후 물리 시뮬레이션 재시작
      physicsActive = true;
      stableFrames = 0;
      if (animationFrameRef.current === null) {
        updatePhysics();
      }
    });

    // 레이아웃이 완료된 후에만 물리 시뮬레이션 시작
    cy.one('layoutstop', function() {
      // 모든 노드의 속도를 0으로 초기화
      cy.nodes().forEach((node: any) => {
        nodeVelocities.set(node.id(), { vx: 0, vy: 0 });
      });
      
      // 레이아웃 완료 후 충분한 지연을 두고 물리 시뮬레이션 시작
      setTimeout(() => {
        physicsActive = true;
        stableFrames = 0;
        // 처음 시작할 때는 힘을 매우 약하게
        updatePhysics();
      }, 500);
    });

    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      handleNodeClick(nodeData.id);
    });

    cy.on('tap', 'edge', function(evt) {
      const edge = evt.target;
      const edgeData = edge.data();
      const description = edgeData.description || '';
      
      const tooltip = document.createElement('div');
      tooltip.className = 'fixed bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-xs';
      tooltip.innerHTML = `
        <div class="font-bold text-lg mb-2" style="color: ${relationTypeColors[edgeData.type as RelationType]}">
          ${edgeData.label}
        </div>
        <div class="text-sm text-gray-600 mb-2">${description}</div>
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

  return (
    <div className="w-full h-full">
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
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
        {recommendedTerms.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">추천 단어:</div>
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
      </div>
      <div
        ref={containerRef}
        className="w-full border-2 border-gray-200 rounded-lg bg-white"
        style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}
      />
      {selectedNode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
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
            {selectedNode.category && (
              <div className="mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {selectedNode.category}
                </span>
              </div>
            )}
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
                          const relationType = edgeData.type;
                          const color = relationTypeColors[relationType as RelationType];
                          const isBidirectional = edgeData.bidirectional === true;
                          
                          return (
                            <div key={edgeData.id} className="space-y-2">
                              <div className="border-l-4 pl-4 py-2" style={{ borderColor: color }}>
                                <div className="font-semibold text-gray-800 mb-1">
                                  <span style={{ color }}>{relationTypeLabels[relationType as RelationType]}</span>
                                  {isBidirectional ? ' ⇄ ' : ' → '}
                                  {targetName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {edgeData.description || `${selectedNode.name}이(가) ${targetName}에 영향을 줌`}
                                </div>
                              </div>
                              {isBidirectional && (
                                <div className="border-l-4 pl-4 py-2 ml-4" style={{ borderColor: color, borderStyle: 'dashed' }}>
                                  <div className="font-semibold text-gray-800 mb-1 text-sm">
                                    {targetName}
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
                          const relationType = edgeData.type;
                          const color = relationTypeColors[relationType as RelationType];
                          const isBidirectional = edgeData.bidirectional === true;
                          
                          // 양방향 엣지인 경우 이미 outbound에서 표시했으므로 스킵
                          if (isBidirectional) return null;
                          
                          return (
                            <div key={edgeData.id} className="border-l-4 pl-4 py-2" style={{ borderColor: color }}>
                              <div className="font-semibold text-gray-800 mb-1">
                                {sourceName}
                                {' → '}
                                <span style={{ color }}>{relationTypeLabels[relationType as RelationType]}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {edgeData.reverseDescription || edgeData.description || `${sourceName}이(가) ${selectedNode.name}에 영향을 줌`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
});

RelationGraph.displayName = 'RelationGraph';

export default RelationGraph;
