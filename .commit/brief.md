# Core Intent
PROBLEM: 토스 앱 안에 한국 LoL 유저가 자신의 게임 지식 깊이를 검증하고 플레이 성향을 한 번에 알아보는 공유형 미니 경험이 없다는 점.
FEATURES:
- 10단계 등급제(아이언→챌린저, 1x~5x 배수, 7/10 통과, 미통과 시 광고 시청 후 재도전)
- 3계층 힌트 시스템(처음/12초/7초 시점에 hint1/2/3 추가 공개, 기본 점수 300/200/100 + 속도 보너스 + 스테이지 배수)
- 9개 문제 카테고리 정답률 기반 8종 유저 타입 판정(라인전 장인/아이템 상점 단골/챔피언 도감 완성자/LCK 해설 지망생/소환사 협곡 고고학자/롤 밈 수집가/롤 만물박사/신입 소환사) + 결과 공유
TARGET_USER: 토스 앱 사용 한국 유저 중 LoL을 직접 플레이하거나 LCK를 시청하는 사람. 본인의 LoL 지식·성향을 친구에게 공유하고 싶은 욕구가 있는 캐주얼~중급 유저(다이아 이하 + 라이트 시청자 포함). 실력 자랑보다 "재미있게 맞히는 경험"을 우선시하는 층.

# Stack Fingerprint
RUNTIME: TypeScript 5.9 (`typescript: ~5.9.3`); Node 버전은 package.json에 핀 없음 — `?`
FRONTEND: React 19.2 + Vite 8.0 + Zustand 5 (`src/stores/quiz-store.ts`, `worldcup-store.ts`) + 순수 CSS(`src/styles/global.css`, Tailwind/디자인 시스템 라이브러리 미사용). 자체 상태 기반 SPA 라우터(`src/App.tsx`의 switch).
BACKEND: 없음 — 클라이언트 단독. 영속화는 토스 네이티브 Storage(SDK) → 실패 시 `localStorage`로 폴백(`src/lib/toss-sdk.ts`).
DATABASE: 없음 — 문제 데이터는 TS 모듈(`src/data/questions-*.ts` 9개 파일, `grep -c "^  {"` 합계 약 1,250문제). 세션 상태는 Zustand + Toss Storage.
INFRA: Vercel(웹 미리보기, https://loljalal.vercel.app, `vercel.json`로 `buildCommand: npm run build:web` + `outputDirectory: dist` + SPA rewrite 명시) + Granite/AIT 번들 파이프라인(`npm run build` → `npx ait build` → `loljalal.ait`)으로 토스 앱인토스 콘솔용 산출물 별도 생성. CI 없음.
AI_LAYER: 런타임 AI 없음. 문제는 정적 풀에서 무작위 선택(`buildQuiz` Fisher-Yates), 유저 타입은 카테고리 정답률 기반 결정론(`type-calculator.ts`). 메모상 hint3는 개발 단계의 오프라인 스크립트로 자동 생성되었으나, 그 스크립트는 git에 없음 → 런타임 AI 호출 0.
EXTERNAL_API: `@apps-in-toss/web-framework` 2.1.1 — Storage / GameCenter Leaderboard(`submitGameCenterLeaderBoardScore`, `openGameCenterLeaderboard`) / FullScreen Ads(`loadFullScreenAd`, `showFullScreenAd` — REWARD·INTERSTITIAL·BANNER 3개 그룹, 모두 placeholder ID `ait-ad-test-*`) / `share` / `SafeAreaInsets`. 결과 카드 이미지화 후보로 `html2canvas` 의존성. 외부 HTTP API 호출 없음.
AUTH: 인증 미구현. 토스 인앱 컨텍스트가 디바이스 단위 Storage를 제공하므로 별도 사용자 식별/이메일/OAuth 없음.
SPECIAL: ① Granite + AIT 번들이라는 토스 자체 빌드 파이프라인 — 일반 vite build와 분리됨. ② CSS `env(safe-area-inset-*)`이 토스 WebView에서 일관되지 않아 SDK의 `SafeAreaInsets.get/subscribe`로 `--safe-*` 변수에 직접 주입(브라우저는 env() 폴백) — `src/components/providers/TossProvider.tsx`. ③ React StrictMode 이중 실행 방어를 CLAUDE.md에 룰로 박아둠.

# Failure Log

## Failure 1
SYMPTOM: 첫 Vercel 프로덕션 배포가 "ready"로 표기됐는데 실제 https://loljalal.vercel.app 진입 시 404 NOT_FOUND. `vercel inspect`의 Builds 섹션이 `. [0ms]`로 비어 있음(정적 산출물 사실상 0).
CAUSE: Vercel auto-detect가 `npm run build`를 실행 → 이는 `npx ait build`로 `dist/`를 `.ait` 토스 네이티브 번들로 패킹. 결과적으로 Vercel이 서빙할 정적 자산 위치가 비워진 채 deployment가 "ready" 처리됨. 프레임워크 자동 감지의 함정이 아니라, 빌드 스크립트가 두 가지 산출물(웹용 `dist/` vs 토스용 `.ait`)을 노린 것을 한쪽에서만 알 수 있게 만든 코드 구조 문제.
FIX: 레포 루트에 `vercel.json` 추가 — `buildCommand: "npm run build:web"`(=`vite build`), `outputDirectory: "dist"`, `rewrites: [{ source: "/(.*)", destination: "/index.html" }]`. 재배포(`dpl_4EuY9JHDvJqnq9h4r6n7N5Yfufwh`) 후 200 OK + `<title>롤잘알</title>` 정상 응답 확인.
PREVENTION: vercel.json이 git 추적됨 → 향후 Vercel 빌드는 항상 web-only. 토스용 .ait 빌드는 분리된 명령(`npm run build`)으로만 트리거. SPA rewrite도 함께 박아 두어 자체 라우터의 새로고침 404 가능성도 차단.

## Failure 2
SYMPTOM: 토스 WebView에서 CSS `env(safe-area-inset-top/bottom)` 값이 0으로 반환되어 상단 노치 / 하단 홈 인디케이터 구간에서 레이아웃이 깎이는 패턴. (메모리 + CLAUDE.md 주의사항으로 명시되어 있고, 51f5738 커밋의 코드 변경 방향이 일관됨 — 다만 화면 캡처 같은 직접 증거는 git에 없음.)
CAUSE: 앱인토스 WebView가 CSS `env(safe-area-inset-*)`를 일관되게 노출하지 않음. 일반 모바일 Safari/Chrome 가정으로 CSS만 의존하면 토스 환경에서만 문제 노출.
FIX: `TossProvider.tsx`에서 `@apps-in-toss/web-framework`의 `SafeAreaInsets`를 dynamic import → `get()`으로 초기값을 `--safe-top/--safe-bottom/--safe-left/--safe-right` CSS 변수에 주입, `subscribe()`로 회전 등 변경 추적. 브라우저 환경에서 SDK가 throw하면 `env(safe-area-inset-*)` 값으로 폴백.
PREVENTION: CSS 측에서는 더 이상 env()를 직접 참조하지 않고 `var(--safe-*)`만 사용 → SDK/브라우저 분기를 한 곳에서만 처리. 같은 패턴(SDK가 환경별로 다른 값을 주는 케이스)은 항상 Provider 시점에서 변수화한다는 룰이 사실상 코드에 박힘.

# Decision Archaeology

## Decision 1
ORIGINAL_PLAN: 단일 `AD_GROUP_ID`로 통합 광고 — `loadFullScreenAd`/`showFullScreenAd` 한 종류만 사용. 초기 커밋의 `toss-sdk.ts`에는 `AD_GROUP_ID = 'ait-ad-test-banner-id'` 단일 상수만 존재.
REASON_TO_CHANGE: 게임 안에서 광고 surface 3종(① 퀴즈 화면 띠배너 = 노출형, ② 단계 전환 전면 = 인터스티셜, ③ 오답제거/재도전 리워드 = 보상형)이 정책·과금·타이밍이 모두 달라 단일 ID로는 분리 불가. 토스 앱인토스 광고 IDs도 surface별로 발급되는 구조에 맞물림.
FINAL_CHOICE: `AD_ID = { REWARD, INTERSTITIAL, BANNER }` 객체로 분리. `loadInterstitialAd`/`showInterstitialAd` 추가, `BANNER_AD_GROUP_ID` 별도 export, `BannerAd.tsx` 컴포넌트 신규 추가(commit `e6b3b73`).
OUTCOME: 광고 surface별로 독립 통제 가능 — 인터스티셜은 사용자 흐름 끊김을 무게 있게 다루고, 배너는 상시 노출, 리워드는 명확한 거래로. 단점: 모든 ID가 여전히 placeholder(`ait-ad-test-*-id`). 토스 콘솔에서 실 ID 발급 받기 전까지 매출은 0이고, ID 교체 누락이 있으면 라이브에서 0 임프레션이 침묵으로 발생할 위험 존재(검증 로직 미설치).

## Decision 2
ORIGINAL_PLAN: 16강 토너먼트 형식의 챔피언 월드컵 — `WorldCupPage.tsx` + `worldcup-store.ts`로 구현됨(초기 커밋에 그대로 들어있음).
REASON_TO_CHANGE: 토너먼트 방식은 (a) 시작 마찰이 큼(첫 픽까지 8쌍 비교 필요), (b) 결과 공유 카드의 임팩트가 약함(우승 챔프 한 장보다 "내 최애 + 유형"이 더 강함), (c) 퀴즈 본편의 시간 예산을 침해. 메모/`src/types.ts` 주석에 "내 최애 챔프 (월드컵 대체)"로 결정 기록.
FINAL_CHOICE: 단순 픽 방식의 `ChampPickPage`로 교체. `App.tsx` 라우터는 `mychamp` 라우트만 노출하고 `worldcup` 라우트는 제거.
OUTCOME: 시작~결과까지 시간 단축 + 결과 공유 메시지 응집(유저 타입 + 최애 챔프 한 줄). 단점: 레거시 `src/pages/WorldCupPage.tsx`(147줄)와 `src/stores/worldcup-store.ts`(85줄)가 라우팅에서만 빠진 채 남아 있어 데드 코드. 번들 사이즈 경고(~1MB)에 직접 기여하지는 않더라도 코드 위생상 정리 대상.

# AI Delegation Map

| Domain | AI % | Human % | Notes |
|--------|------|---------|-------|
| Quiz Question Authoring (≈1,250문항) | 80 | 20 | `src/data/questions-*.ts` 9개 파일이 초기 커밋에서 한 번에 ~17,000줄 드롭됨. `.gitignore`의 `lol-research-notes.md` / `lol-korean-research.md` / `lol-2025-2026-latest-data.md`는 AI가 사용한 리서치 노트로 추정. 인간 개입 증거: commit `3af19e1` "fix: 퀴즈 문제 데이터 정확도 보정"에서 8개 파일 약 57줄 직접 수정. |
| Quiz Engine & Scoring | 70 | 30 | `quiz-engine.ts`의 `buildQuiz`(Fisher-Yates), `calculatePoints`, `STAGE_MULTIPLIERS`는 표준 패턴. 임계값(PASS_THRESHOLD=7, base=100, speedBonus≤50, 1x→5x 배수)은 PLANNING.md에 인간이 명시한 기획값. |
| User-Type Classifier | 55 | 45 | `type-calculator.ts`의 결정 로직(top-rate dominance + 신입 소환사 floor + 만물박사 evenness check)은 기계적이지만, 6개 카테고리→타입 매핑("LCK 해설 지망생", "소환사 협곡 고고학자" 등)의 한국어 작명은 raw 모델 출력보다 다듬은 톤. tagline 메시지에서 인간 손길 보임(commit `de49af8`의 "은" → 공백 보정). |
| React Pages & Components | 75 | 25 | HomePage / QuizPage / ResultPage / FinalResultPage / ChampPickPage 스캐폴딩은 일관된 AI 패턴. QuizPage 134줄 디프(commit `de49af8`)는 힌트 노출 타이밍/상태 머신을 인간이 검수한 흔적. |
| Styling / CSS Theme | 70 | 30 | `global.css` 505줄 개편(commit `de49af8`)은 AI 주도. LoL 골드/블루 팔레트(#C89B3C / #0AC8B9)는 CLAUDE.md에 인간이 명시한 컬러 결정. |
| Toss SDK Integration (Storage·Ad·SafeArea·Share) | 60 | 40 | Storage / Leaderboard / share 부분은 gamjalal 보일러플레이트 잔재. 광고 3종 분리(`e6b3b73`)와 SafeAreaInsets dynamic import(`51f5738`)는 AI 제안 + 인간 검증의 혼합. |
| Build / Vercel Config & Deploy | 90 | 10 | 본 세션에서 vercel.json 작성, 첫 배포 404 진단, 재배포까지 AI 단독 수행. 인간 입력은 "vercel에 올려줘" + 404 리포트("404L NOT_FOUND라고 나와"). |
| Git Hygiene & Commit Composition | 85 | 15 | 본 세션의 7개 atomic commit 메시지/그룹핑 모두 AI 작성. 인간이 그룹핑 전략("주제별로 나눠서") + .gitignore 정책(`*.ait` 제외) 결정. |

# Live Proof
DEPLOYED_URL: https://loljalal.vercel.app — 200 OK, `<title>롤잘알</title>` 응답 확인(`curl -sI`로 검증). 단, 이는 브라우저 미리보기일 뿐 실제 유통 surface(토스 인앱 .ait)는 아직 미배포.
GITHUB_URL: https://github.com/austinpw-cloud/loljalal — **PRIVATE**. 비로그인/외부 계정에서는 404처럼 보일 수 있음. 본 세션에서 8개 커밋(`1c919f5` initial + 7개 today, `1b664b8`~`d0f21c1`) 푸시 확인.
API_ENDPOINTS: ? — 백엔드 없음, 외부 HTTP 엔드포인트 없음.
CONTRACT_ADDRESSES: ? — 블록체인 미사용.
OTHER_EVIDENCE: ? — 측정 가능한 사용자 수/리텐션/매출 없음. 토스 인앱 콘솔에는 아직 제출 안 됨(메모: "배포는 아직 불필요"). 자산 증거: 600x600 스토어 아이콘(`롤잘알_600x600.png`, 549KB) 커밋됨, 빌드 산출물 `loljalal.ait` 로컬 검증.

# Next Blocker
CURRENT_BLOCKER: knowledge — 약 1,250개 문제(특히 hint3는 메모상 오프라인 스크립트로 자동 생성)의 사실 정확성이 체계적으로 검수된 적 없음. 토스 앱인토스 게임 카테고리는 콘텐츠 오류에 민감하며, 1문제만 명백한 오답이어도 사용자 신뢰가 깨지고 리뷰에서도 즉시 지적 대상이 됨. 코드/배포 파이프라인은 통과했지만, 콘텐츠 신뢰도가 다음 단계(토스 인앱 심사 제출)의 게이팅 요인.
FIRST_AI_TASK: `src/data/questions-*.ts` 9개 파일을 순차 처리하면서 각 문제의 `answer`와 `hint1/hint2/hint3`을 (1) Riot Data Dragon 최신 버전(엔드포인트: `https://ddragon.leagueoflegends.com/api/versions.json` → 최신 버전의 `champion.json`/`item.json`) 정식 데이터, (2) `category === "pro"`/`"history"` 항목은 별도 LCK/롤드컵 우승팀 스냅샷과 대조해 불일치 의심 항목을 `id, file, field, current_value, evidence_source, suggested_value, confidence(0-1)` 7컬럼 CSV(`out/qc-report.csv`)로 출력. 자동 수정 금지. 단일 세션 안에 끝나도록 파일 단위로 처리하고, 각 파일 처리 끝에 progress 라인 print.

# Integrity Self-Check
PROMPT_VERSION: commit-brief/v1.3
VERIFIED_CLAIMS:
- 스택(React 19.2 / Vite 8.0 / Zustand 5 / TS 5.9 / @apps-in-toss/web-framework 2.1.1 / html2canvas / uuid) — `package.json:12-33`.
- 백엔드/DB 없음 — `src/` 트리 전수 확인(api/ · schema · sql 파일 없음).
- 자체 상태 기반 라우터 + 5개 라우티드 페이지(home/quiz/result/final/mychamp), `WorldCupPage.tsx`는 라우팅 누락된 데드 코드 — `src/App.tsx` switch 분기 + `src/pages/` 디렉토리.
- 문제 약 1,250개 — `grep -c "^  {" src/data/questions-*.ts` 합계 150+150+120+200+160+80+120+150+120.
- 10단계 + 1x→5x 배수 + PASS_THRESHOLD=7, 15초 타이머, 힌트 12s/7s 타이밍, 기본 점수 300/200/100, speedBonus≤50 — `src/lib/quiz-engine.ts`의 `calculatePoints`, `STAGE_MULTIPLIERS` + `PLANNING.md` §3.
- 8종 LoLUserType + 9종 카테고리 — `src/types.ts`.
- 광고 3종 분리(REWARD/INTERSTITIAL/BANNER) — `src/lib/toss-sdk.ts` 현재 코드 + commit `e6b3b73` 디프.
- SafeAreaInsets SDK 주입 + 브라우저 env() 폴백 — `src/components/providers/TossProvider.tsx` + commit `51f5738` 디프.
- Vercel 404 → vercel.json fix → 200 OK — `vercel inspect`의 빈 Builds(이전 dpl_QqdJkJMUQ27sjaDWNRHmVrEgxSPs) + 본 레포의 `vercel.json` + `curl -sI https://loljalal.vercel.app` HTTP/2 200 응답 본문에 `<title>롤잘알</title>`.
- 깃 히스토리 8개 커밋(`1c919f5` + 본 세션 7개) — `git log --oneline`.
- Vercel 프로젝트 `loljalal` / scope `austinpw-clouds-projects` — `vercel projects ls` 출력.
- 월드컵 → 내 최애 챔프 교체 — `src/types.ts` 주석 "내 최애 챔프 (월드컵 대체)" + `App.tsx`의 `mychamp` 라우트만 활성.
- LoL 컬러 팔레트(#C89B3C 골드, #0AC8B9 블루) — `CLAUDE.md`.
UNVERIFIABLE_CLAIMS:
- hint3가 오프라인 스크립트로 생성되었다는 점 — 프로젝트 메모에 의거. 스크립트 파일은 git에 없음, 직접 검증 불가.
- AI Delegation Map의 % 분배 — 추정치. git에 도구별 attribution 없음. 리서치 노트 파일명/문제 양/단일 대량 드롭 패턴으로 추론.
- 초기 커밋 이전(3월 30일 이전) 약 41일간의 반복 과정 — 한 번에 ~58,000줄이 들어와서 그 사이의 시행착오는 git에 보이지 않음.
- 문제 정답·힌트의 사실 정확성 — 본 분석 범위 밖이며, 메모도 "검수 필요"로 미해결로 표기.
- 실 사용자 수 / 다운로드 / 리뷰 / 매출 — 토스 인앱 미제출 상태라 0으로 추정되지만 검증 불가.
- gamjalal 보일러플레이트의 라이선스/귀속 — CLAUDE.md 언급 외 LICENSE 파일 미확인.
- React StrictMode 이중 실행 / Timer onTick 의존성 / AsyncStorage white-out — CLAUDE.md에 룰로 명시되었으나, 본 레포 git history에서는 그 디버깅 과정이 보이지 않음(보일러플레이트 단계 학습으로 추정).
DIVERGENCES:
- 사용자 발화 "로컬로만 테스트했었나? vercel에 올려줘"는 Vercel이 사후적으로 추가된 surface임을 확인시켜 줌. DEPLOYED_URL은 브라우저 미리보기이지 주력 유통(.ait → 토스 인앱)이 아님 — 점수 산정 시 prod-scale로 오인하지 말 것. 본 브리프는 이를 명시했음.
- AI_LAYER가 "None"인 점은 본 게임이 정적 퀴즈라는 사실에 충실한 결과로, AI 활용 점수를 노린 인플레이션을 하지 않았음. 채점 루브릭이 런타임 AI 사용을 가산한다면 본 프로젝트는 거기서 약점.
- 사용자가 템플릿을 변경/약화시킨 흔적 없음. 모든 섹션 그대로 유지.
- 메모 파일은 41일 된 스냅샷이라 일부는 코드/사용자 채팅으로 재확인됨; 그 외 항목은 UNVERIFIABLE_CLAIMS에 분리 기재.
CONFIDENCE_SCORE: 6/10. 스택·구조·본 세션의 두 실패(Vercel 404, SafeAreaInsets)는 직접 검증돼 8~9 수준. 그러나 (a) 41일치 사전 개발의 서사, (b) AI/Human 비율 추정, (c) 문제 정확성은 모두 추론·외부 영역이라 종합 점수를 끌어내림. 인플레이션 없이 관측치만 기록.
