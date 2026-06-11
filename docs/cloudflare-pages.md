# Cloudflare Pages 배포 메모

## 추천 구조

- Frontend: Cloudflare Pages 정적 배포
- API: Pages Functions의 `functions/api/state.ts`
- Storage: Cloudflare D1
- Data model: `app_state` 테이블의 `main` 행에 앱 상태 JSON 저장

현재 앱은 `/api/state`만 있으면 동작하므로 Electron 서버 없이도 같은 방식으로 동기화됩니다.

## 비용

개인 기록 앱 규모라면 Cloudflare 무료 범위 안에서 시작하기 좋습니다.

- Pages Free: 정적 요청/대역폭 무료, 월 500 builds, 프로젝트당 custom domain 100개
- Workers/Pages Functions Free: 하루 100,000 requests
- D1 Free: 무료 실험/프로토타입 지원, free limit 초과 시 D1 쿼리가 실패하고 다음 UTC 00:00에 일일 제한이 재설정됨
- KV도 가능하지만 이 앱은 기록 조회/집계 가능성이 있으므로 D1이 더 맞습니다.

## 최초 설정 명령

GitHub 저장소를 만든 뒤:

```powershell
git init
git add .
git commit -m "Initial AngryJ web app"
git branch -M main
git remote add origin https://github.com/parkman00771188/angry-j.git
git push -u origin main
```

Cloudflare 로그인 후 D1 생성:

```powershell
npm run cf:login
npm run cf:project:create
npm run cf:d1:create
```

`cf:d1:create`는 `wrangler.toml`의 D1 설정을 자동으로 갱신합니다. 자동 갱신이 실패하면 생성 결과의 `database_id`를 `wrangler.toml`에 직접 넣습니다.

원격 D1 마이그레이션:

```powershell
npm run cf:migrate
```

Cloudflare Pages 배포:

```powershell
npm run cf:deploy
```

## 자동 배포

`.github/workflows/cloudflare-pages.yml`가 `main` 브랜치 push마다 아래 작업을 자동으로 실행합니다.

1. `npm ci`
2. `npm run build`
3. `npx wrangler d1 migrations apply angry-j --remote`
4. `npx wrangler pages deploy dist --project-name angry-j`

GitHub 저장소의 Settings > Secrets and variables > Actions에 아래 secrets를 추가해야 합니다.

```text
CLOUDFLARE_ACCOUNT_ID=Cloudflare 계정 ID
CLOUDFLARE_API_TOKEN=Cloudflare API Token
```

API Token에는 Pages 배포와 D1 수정 권한이 필요합니다.

## 보안

Pages 프로젝트의 Variables and Secrets에 아래 값을 추가하는 것을 권장합니다.

```text
ANGRYJ_APP_SECRET=원하는-긴-비밀키
```

앱에서 `설정 > 클라우드 동기화 > 동기화 비밀키`에 같은 값을 입력하면 `/api/state` 요청에 `X-AngryJ-Secret` 헤더가 붙습니다.

이 값을 설정하지 않으면 URL을 아는 사람이 API를 읽고 쓸 수 있으니, 실제 운영에서는 반드시 설정하세요.

## Excel 대안

Excel 파일을 직접 DB처럼 쓰는 방식은 Cloudflare Pages에서 안정적으로 관리하기 어렵습니다. 무료/무서버 운영 기준으로는 D1이 더 안전합니다.

추후 필요하면 CSV 내보내기/가져오기 기능을 앱 안에 추가해서 Excel에서 열 수 있게 만들 수 있습니다.
