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
  // 'term': 용어 자체(이름·설명·카테고리·중요도·신규 등록), 'relation': 관계 변경
  kind?: 'term' | 'relation';
  summary: string;
  changes: TermFieldChange[];
}

export interface Term {
  id: string;
  name: string;
  description: string;
  category?: string;
  stockMarketImportance?: number; // 1-10, stock market importance rating
  // 용어 자체(이름·설명·카테고리·중요도·신규 등록)의 최신 변경일
  updatedAt?: string;
  // 이 용어에 연결된 관계의 최신 변경일 (용어 자체 수정과 분리)
  relationsUpdatedAt?: string;
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

// 명제(Proposition): "A이면 B이다" 형태의 경제 명제와
// 성립하는 경우(holds)·성립하지 않는 경우(fails)를 함께 보여주기 위한 모델
export interface PropositionCase {
  // 사례·조건 제목 (예: "수요 견인 인플레이션 국면")
  label: string;
  // 논리 설명
  detail: string;
  // 실제 역사적 사례 (선택)
  example?: string;
}

export interface CurriculumExample {
  title: string;
  body: string;
  period?: string;
}

export interface CurriculumAssetComparisonRow {
  asset: string;
  phase2020: string;
  phase2022: string;
}

export interface CurriculumAssetComparison {
  title: string;
  lead?: string;
  rows: CurriculumAssetComparisonRow[];
  takeaway?: string;
  investorActions?: string[];
}

export interface CurriculumKoreaPathStep {
  title: string;
  body: string;
}

export interface CurriculumKoreaPath {
  title: string;
  subtitle?: string;
  lead?: string;
  steps: CurriculumKoreaPathStep[];
  takeaway?: string;
  investorActions?: string[];
  termIds?: string[];
  propositionIds?: string[];
}

export interface CurriculumPart {
  id: string;
  title: string;
  subtitle?: string;
  /** 대화형 본문 (Markdown, `**Name:**`) */
  bodyDialogue?: string;
  /** 설명형 연속 산문 (Markdown) */
  bodyProse?: string;
  /** @deprecated bodyDialogue / bodyProse 사용 */
  body?: string;
  /** @deprecated body로 통합 — 구 데이터 호환용 */
  lead?: string;
  examples?: CurriculumExample[];
  takeaway?: string;
  investorActions?: string[];
  termIds: string[];
  propositionIds?: string[];
}

export interface CurriculumSection {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  learnerQuestion?: string;
  /** 섹션 도입 — 대화형 (Markdown, `**Name:**`) */
  bodyDialogue?: string;
  /** 섹션 도입 — 설명형 연속 산문 (Markdown) */
  bodyProse?: string;
  /** @deprecated bodyDialogue / bodyProse 사용 */
  body?: string;
  /** @deprecated body로 통합 — 구 데이터 호환용 */
  overview?: string;
  hook?: string;
  episode?: CurriculumExample;
  /** 같은 거시 환경, 다른 자산 비교 */
  assetComparison?: CurriculumAssetComparison;
  /** 한국 투자자 전달 경로 */
  koreaPath?: CurriculumKoreaPath;
  parts: CurriculumPart[];
}

export interface Curriculum {
  version: number;
  intro?: string;
  sections: CurriculumSection[];
}

export interface Proposition {
  id: string;
  // 명제 진술 (예: "금리가 오르면 물가가 내려간다")
  statement: string;
  category?: string;
  // 명제와 관련된 용어 id (관계도 탭으로 연결)
  termIds: string[];
  // 관련 관계 id (선택)
  relationIds?: string[];
  // 일반적으로 그렇게 보는 논리·전제
  premise: string;
  // 명제가 성립하는 경우들
  holds: PropositionCase[];
  // 명제가 성립하지 않는 경우·한계
  fails: PropositionCase[];
  // 한 줄 결론 (조건부 참 등)
  verdict: string;
}
