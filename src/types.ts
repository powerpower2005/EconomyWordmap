export type RelationType = 'proportional' | 'inverse' | 'correlation';

export interface Term {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface Relation {
  id: string;
  term1Id: string;
  term2Id: string;
  // 정방향 (term1 -> term2) 관계 정보
  type: RelationType;
  description?: string;
  strength?: 'weak' | 'medium' | 'strong';
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
