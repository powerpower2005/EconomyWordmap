export type RelationType = 'proportional' | 'inverse' | 'correlation';

// 관계의 의미론적 성격 (방향성 type과 직교하는 별도 축)
// - causal: 인과 (A가 B를 일으킴)
// - correlational: 상관 (함께 움직이나 인과는 단정 불가)
// - definitional: 정의·측정 (CPI가 인플레이션을 측정 등)
// - hierarchical: 계층 (상위/하위·구성요소)
// - policy: 정책 반응 (정책 대응으로 연결)
export type RelationNature =
  | 'causal'
  | 'correlational'
  | 'definitional'
  | 'hierarchical'
  | 'policy';

export interface TermFieldChange {
  field: 'name' | 'description' | 'category' | 'stockMarketImportance' | 'relation';
  label: string;
  before: string;
  after: string;
}

export interface TermChangeEntry {
  date: string;
  commit?: string;
  message?: string;
  summary: string;
  changes: TermFieldChange[];
}

export interface Term {
  id: string;
  name: string;
  description: string;
  category?: string;
  stockMarketImportance?: number; // 1-10, stock market importance rating
  updatedAt?: string;
  changelog?: TermChangeEntry[];
}

export interface Relation {
  id: string;
  term1Id: string;
  term2Id: string;
  // 정방향 (term1 -> term2) 관계 정보
  type: RelationType;
  description?: string;
  strength?: 'weak' | 'medium' | 'strong';
  // 의미론적 성격 (선택) - 시각화(실선/점선)와 학습 맥락에 사용
  nature?: RelationNature;
  // 작동 메커니즘 설명 (선택)
  mechanism?: string;
  // 성립 조건·국면 (선택, 예: "고인플레 국면", "기대인플레 anchored 시")
  conditions?: string;
  // 시차 (선택, 예: "1~2분기 후")
  lag?: string;
  // 양방향 관계 여부
  bidirectional?: boolean;
  // 역방향 (term2 -> term1) 관계 정보 (양방향일 때 사용)
  reverseType?: RelationType;
  reverseDescription?: string;
  reverseStrength?: 'weak' | 'medium' | 'strong';
}

export interface TermWithRelations extends Term {
  relations: Array<{
    term: Term;
    relation: Relation;
  }>;
}
