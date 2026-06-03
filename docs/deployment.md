# 무료 호스팅 가이드

이 프로젝트를 무료로 호스팅하는 방법입니다.

## 🚀 방법 1: Vercel (가장 추천)

✅ **Private Repository 지원**: 무료 플랜에서도 Private repo 사용 가능

### 단계별 가이드

1. **GitHub에 프로젝트 업로드**
   ```bash
   # Git 저장소 초기화 (아직 안 했다면)
   git init
   git add .
   git commit -m "Initial commit"
   
   # GitHub에 새 저장소 생성 후
   git remote add origin https://github.com/사용자명/wordmap.git
   git push -u origin main
   ```

2. **Vercel 가입 및 배포**
   - [vercel.com](https://vercel.com) 접속
   - "Sign Up" → GitHub 계정으로 로그인
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - 설정:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - "Deploy" 클릭

3. **완료!**
   - 몇 분 후 자동으로 배포 완료
   - `https://your-project.vercel.app` 주소로 접속 가능
   - 이후 코드 푸시 시 자동 재배포

---

## 🌐 방법 2: Netlify

✅ **Private Repository 지원**: 무료 플랜에서도 Private repo 사용 가능

1. **GitHub에 프로젝트 업로드** (방법 1과 동일)

2. **Netlify 배포**
   - [netlify.com](https://netlify.com) 접속
   - "Sign up" → GitHub 계정으로 로그인
   - "Add new site" → "Import an existing project"
   - GitHub 저장소 선택
   - 빌드 설정:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - "Deploy site" 클릭

---

## 📄 방법 3: GitHub Pages

⚠️ **Private Repository 제한**: Private repo는 GitHub Pro (유료) 필요. 무료 플랜에서는 Public repo만 가능

1. **워크플로** — `.github/workflows/deploy_frontend.yml` (공식 Pages Actions: artifact 업로드 후 deploy)
2. **GitHub 저장소 설정** — README의 [GitHub Pages 배포](../README.md#github-pages-배포) 체크리스트 참고
3. **자동 배포** — `main` 브랜치에 프론트/데이터 관련 경로가 변경되면 배포 (`workflow_dispatch`로 수동 실행 가능)

---

## ⚡ 방법 4: Cloudflare Pages

✅ **Private Repository 지원**: 무료 플랜에서도 Private repo 사용 가능

1. **GitHub에 프로젝트 업로드**

2. **Cloudflare Pages 배포**
   - [pages.cloudflare.com](https://pages.cloudflare.com) 접속
   - "Sign up" → GitHub 계정으로 로그인
   - "Create a project" → "Connect to Git"
   - 저장소 선택
   - 빌드 설정:
     - **Framework preset**: Vite
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - "Save and Deploy" 클릭

---

---


## 🎯 추천 순서

1. **Vercel** - 가장 쉬움, 자동 배포, 빠름
2. **Netlify** - Vercel과 유사, 드래그 앤 드롭도 가능
3. **Cloudflare Pages** - 매우 빠른 CDN
4. **GitHub Pages** - GitHub만 사용하고 싶을 때

---

## 💡 팁

- 모든 플랫폼에서 **무료**로 사용 가능
- **Private Repository**: Vercel, Netlify, Cloudflare Pages는 무료 플랜에서도 Private repo 지원
- **GitHub Pages**: Private repo는 GitHub Pro (유료) 필요
- 커스텀 도메인 연결 가능 (무료)
- HTTPS 자동 적용
- 코드 푸시 시 자동 재배포

## 🔒 Private Repository 사용 시

Private repo를 사용하려면:
- ✅ **Vercel** (추천) - 무료 플랜에서 Private repo 완전 지원
- ✅ **Netlify** - 무료 플랜에서 Private repo 완전 지원
- ✅ **Cloudflare Pages** - 무료 플랜에서 Private repo 완전 지원
- ❌ **GitHub Pages** - Private repo는 GitHub Pro 필요 (월 $4)
