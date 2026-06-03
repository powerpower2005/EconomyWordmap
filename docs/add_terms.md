# 단어·관계 추가 가이드 (사용자용)

> **에이전트·개발자:** 데이터는 `terms.json`이 아니라 YAML입니다.  
> 절차·문장 품질: [agent-data-guide.md](./agent-data-guide.md) (한국어)  
> 프롬프트(한국어) + 실행 단계(영어): [agent-recipes.md](./agent-recipes.md)  
> 필드 정의(영어): [data-schema.md](./data-schema.md) · 규칙 진입(영어): [AGENTS.md](../AGENTS.md)

## 빠른 요약

| 편집 대상 | 경로 |
|-----------|------|
| 용어 | `src/data/terms-all.yaml` |
| 관계 | `src/data/relations.yaml` |
| 생성물 (수정 금지) | `src/data/terms.json` |

```bash
node build-data.js
npm run validate-data
```

## 프롬프트 템플릿

```
다음 단어를 terms-all.yaml에 추가하고, 필요한 관계는 relations.yaml에 추가해줘:

[단어 목록]

각 단어:
- id: 영어 소문자, 하이픈
- name: 한글 (English)
- description: 상세 설명
- category: 카테고리

관계:
- term1Id → term2Id: 비례/반비례/상관관계
- 설명, 강도(strong/medium/weak)
- 양방향이면 bidirectional: true, reverseDescription

작업 후 build-data 실행하고 커밋해줘.
```

## 예시

### 단어 하나

```
SOFR (Secured Overnight Financing Rate) 용어를 추가하고 기준금리와 관계를 relations.yaml에 넣어줘.
agent-data-guide 절차를 따라줘.
```

### 단어 + 관계

[agent-recipes.md](./agent-recipes.md)의 **R2** 참고.

### 양방향 관계

[agent-recipes.md](./agent-recipes.md)의 **R5** 참고 (예: IORB ↔ 금리, `r22`).

## 더 보기

- 상세 운영: [agent-data-guide.md](./agent-data-guide.md)
- 레시피 모음: [agent-recipes.md](./agent-recipes.md)
- 스키마: [data-schema.md](./data-schema.md)
- 카테고리: [categories.md](./categories.md)
