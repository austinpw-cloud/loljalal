# CLAUDE.md — 롤잘알 (앱인토스 네이티브)

## 프로젝트 개요

토스 앱인토스 WebView 기반 게임 미니앱. 리그오브레전드 퀴즈 게임.
겜잘알(gamjalal) 보일러플레이트에서 생성됨.

## 기술 스택

- **프레임워크**: Vite + React + TypeScript
- **앱인토스 SDK**: `@apps-in-toss/web-framework` 2.x
- **상태관리**: Zustand (persist → Toss 네이티브 Storage)
- **스타일**: 순수 CSS (global.css), Tailwind 사용 안 함
- **서버**: 없음 (Supabase/Vercel 의존 제로)
- **라우팅**: 자체 SPA 상태 기반 라우터 (App.tsx)
- **보일러플레이트**: `/Users/cj/Documents/works/gamjalal/` 기반

## 앱인토스 설정

- **appName**: `loljalal`
- **displayName**: 롤잘알
- **primaryColor**: `#C89B3C` (LoL 골드)
- **webViewProps.type**: `game`

## 개발 명령어

```sh
npm run dev          # 개발 서버 (granite dev → metro + vite)
npm run build        # .ait 번들 생성 (ait build)
npx ait deploy       # 콘솔에 자동 업로드
```

주의: `ait dev`는 존재하지 않음. `granite dev` 사용.

## 작업 가이드

현재 겜잘알 코드가 그대로 들어있으므로, 롤잘알에 맞게 교체할 것:

1. **src/data/** — LoL 퀴즈 데이터로 교체
2. **src/lib/quiz-engine.ts** — LoL 퀴즈 로직으로 수정
3. **src/lib/type-calculator.ts** — LoL 유저 타입 판정 로직으로 수정
4. **src/pages/HomePage.tsx** — 로고, 타이틀을 롤잘알로 변경
5. **src/components/ui/TopBar.tsx** — 로고 변경
6. **src/styles/global.css** — LoL 테마 컬러로 CSS 변수 변경
7. **src/lib/toss-sdk.ts** — AD_GROUP_ID 실제 값으로 교체

교체하지 않아도 되는 재사용 모듈:
- toss-sdk.ts (AD_GROUP_ID만 변경)
- sounds.ts (그대로)
- TossProvider.tsx (그대로)
- Timer.tsx, CountUp.tsx, LoadingScreen.tsx (그대로)

## 앱인토스 SDK 사용

- `Storage` — 네이티브 저장소
- `submitGameCenterLeaderBoardScore` — 리더보드 점수 제출
- `openGameCenterLeaderboard` — 리더보드 열기
- `loadFullScreenAd` / `showFullScreenAd` — 통합 광고 (보상형)
- `share` — 네이티브 공유 시트

## 주의사항

- TDS 미사용 (게임 카테고리 → TDS 필수 아님)
- AsyncStorage 사용 금지 (white-out 발생)
- 핀치줌 비활성화 (index.html meta viewport)
- Safe Area 처리 (CSS env() 사용)
- JSON 데이터 snake_case → camelCase 변환 필요 시 load-data.ts 사용
- React StrictMode에서 useEffect 이중 실행 → useRef로 방어
- Timer onTick 콜백은 useEffect 의존성에 넣지 말 것 (무한 루프)
