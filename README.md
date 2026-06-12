# AngryJ

앵그리 J 기록 대시보드입니다. React/Vite 기반 웹앱이며, Cloudflare Pages에 배포하면 EXE 없이 브라우저에서 사용할 수 있습니다.

https://angryj.pages.dev



## 로컬 실행

```powershell
npm install
npm run dev
```

## 빌드

```powershell
npm run build
```

## Cloudflare 구성

이 프로젝트는 Cloudflare Pages Functions의 `/api/state`와 Cloudflare D1을 사용해 기록 데이터를 저장합니다.

1. GitHub에 이 프로젝트를 푸시합니다.
2. Cloudflare Pages에서 GitHub 저장소를 연결합니다.
3. 빌드 설정을 아래처럼 지정합니다.
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Cloudflare D1 데이터베이스를 만들고 Pages 프로젝트에 `DB` 이름으로 바인딩합니다.
5. 선택사항이지만 권장: Pages 환경 변수/Secret에 `ANGRYJ_APP_SECRET`을 설정합니다.
6. 앱의 설정 > 클라우드 동기화에 같은 비밀키를 입력합니다.

자세한 명령은 [docs/cloudflare-pages.md](docs/cloudflare-pages.md)를 참고하세요.
