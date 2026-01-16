# 빠른 테스트 가이드 (일회성 실행)

## 방법 1: 프로젝트 로컬 설치 (권장)

Node.js는 기본적으로 프로젝트 폴더에만 `node_modules`를 설치합니다. 전역 설치가 아닙니다.

### 1단계: Node.js 설치 (처음 한 번만)

1. **Node.js 다운로드**
   - https://nodejs.org/ 접속
   - **최신 버전 (Current)** 다운로드
     - 현재 최신: Node.js 25.x (Current)
     - 또는 최신 LTS: Node.js 24.x (Active LTS) - 더 안정적
   - Windows Installer (.msi) 다운로드
   - **참고**: 최신 버전은 실험적 기능 포함 가능, 안정성이 중요하면 LTS 권장

2. **설치**
   - 다운로드한 .msi 파일 실행
   - 기본 설정으로 설치 진행
   - "Add to PATH" 옵션이 체크되어 있는지 확인

3. **설치 확인**
   - 터미널/명령 프롬프트를 **새로 열기** (중요!)
   - 다음 명령어로 확인:
   ```bash
   node --version
   npm --version
   ```
   - 버전이 표시되면 설치 완료

### 2단계: 프로젝트 실행

프로젝트 디렉토리(`C:\Users\psgpk\Desktop\Wordmap`)에서 실행:

```bash
# 1. 의존성 설치 (프로젝트 폴더에만 설치됨)
npm install

# 2. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3단계: 테스트 완료 후 정리

```bash
# node_modules 폴더만 삭제하면 완전히 제거됨
# Windows PowerShell에서:
Remove-Item -Recurse -Force node_modules

# 또는 Windows CMD에서:
rmdir /s /q node_modules
```

### 장점
- 전역 설치 없음 (프로젝트 폴더에만 영향)
- `node_modules` 폴더만 삭제하면 완전히 제거 가능
- `.gitignore`에 포함되어 있어 Git에는 영향 없음

---
