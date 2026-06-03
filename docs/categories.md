# Wordmap 카테고리

> **Language:** Korean (maintainer reference). Field names stay English (`category`).

용어 `category` 필드에 사용하는 문자열 목록과 UI 동기화 안내입니다.

## 권장 카테고리 (categories.yaml)

[src/data/categories.yaml](../src/data/categories.yaml):

- 거시경제
- 국제경제
- 금융
- 통화
- 통화정책
- 정부
- 원자재
- 경제이론

## terms-all.yaml에서 실제 사용 중

다음 카테고리도 데이터에 존재합니다 (신규 용어 추가 시 재사용 가능):

- **금리** — 금리·SOFR 등
- **채권** — 단기/중기/장기채 등

목록 갱신 확인:

```bash
grep "category:" src/data/terms-all.yaml
```

## UI 검색 필터

[src/pages/Home.tsx](../src/pages/Home.tsx)의 `categories` 배열은 위 목록과 **동기화**되어야 합니다.  
필터에 없는 category를 쓰면 검색 UI에서 카테고리 필터로 걸러지지 않습니다.

## 신규 카테고리 추가 시

1. 사용자·메인테이너와 이름 합의
2. `terms-all.yaml`에 적용
3. `categories.yaml`에 항목 추가 (선택, 문서용)
4. `Home.tsx` `categories` 배열에 추가
5. [agent-data-guide.md](./agent-data-guide.md) 필요 시 README 카테고리 절 갱신

임의로 새 category 문자열을 만들지 말고, 기존 목록 재사용을 우선하세요.
