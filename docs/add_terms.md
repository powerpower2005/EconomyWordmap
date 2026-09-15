# Wordmap 데이터 작업 빠른 안내

[프롬프트 모음](agent-recipes.md)에서 작업 유형을 선택해 복사하세요.

- 처음 요청: R0 기본 적용 프롬프트
- 기사 검토: R1 (파일 변경 없음)
- 용어·관계·명제 추가: R2
- 기존 설명 수정: R3
- 학습 글 생성·개선: R4
- 전체 구조 검토: R5
- 화면 개선: R6

파일 전체를 붙이는 대신 질문과 용어명 또는 ID를 알려주세요.
AI는 [프로젝트 지도](ai-map.md)로 원본과 연결된 항목을 찾습니다.
커밋·푸시는 기본적으로 수행하지 않으며 필요하면 레시피 마지막의 저장 문장으로 교체하세요.

직접 편집하는 데이터는 `src/data/terms-all.yaml`, `relations.yaml`,
`propositions.yaml`, `curriculum.yaml`입니다.
생성물 `terms.json`과 레거시 `src/data/terms/*.yaml`은 편집하지 않습니다.
