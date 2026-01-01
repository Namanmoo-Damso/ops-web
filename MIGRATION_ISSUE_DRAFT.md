## 이슈 유형 (Issue Type)

- [ ] Bug
- [x] Feature
- [x] Docs
- [x] Refactor

## 제목 (Title)

feat: Migrate Institution Web App to Modern UI & Port Legacy Logic

## 상세 설명 (Description)

기존 `ops-web` 레포지토리의 Frontend를 현대적인 디자인(Shadcn UI + Tailwind)으로 전면 개편하고, 별도로 작업된 `institution` 앱 코드를 통합(Migration)하였습니다.

### 1. UI/UX Refactor

- **Design System**: Shadcn/ui 및 커스텀 Tailwind 테마(`Damso Green`) 적용.
- **Components**: Sidebar, Header 등 공통 레이아웃 컴포넌트 구조화 (`src/app/(workspace)/layout.tsx`).
- **Dashboard**: 직관적인 카드형 UI 및 모니터링/지도 뷰 진입점 개선.

### 2. Migration & Integration

- **Codebase**: `institution` 폴더의 코드를 `ops-web`의 `feature/institution-migration` 브랜치로 통합.
- **Directory Structure**: Next.js App Router의 `src/` 구조 도입.
- **Dependencies**: Tailwind CSS v4, Lucide React 등 최신 라이브러리 추가.

### 3. Logic Porting (Legacy Support)

기존 `ops-web`(main)에 있던 API 연동 로직을 새로운 UI에 이식하였습니다.

- **Authentication**: `src/app/(auth)/login`: Email 로그인 및 OAuth(Kakao/Google) 콜백 처리 로직 복구.
- **Route Protection**: `AuthGuard` 컴포넌트를 통한 비로그인 접근 차단 구현.
- **Data Model**: Legacy API (`/v1/admin/...`) 스펙에 맞춰 Token 관리 및 Fetcher 구현.

## 기대 결과 (Expected Behavior)

- 사용자는 기존 계정 및 소셜 로그인으로 정상적으로 접속할 수 있어야 함.
- 로그인 후 대시보드에서 실제 서버 데이터(통계, 알림 등)를 확인할 수 있어야 함.
- `npm run dev` 및 `npm run build`가 에러 없이 동작해야 함.

## 참고 사항 (Notes)

- `.env` 파일 설정이 필요합니다 (`NEXT_PUBLIC_API_URL` 등).
- 상세 API 명세는 `API_REQUIREMENTS.md`, 디자인 가이드는 `DESIGN_GUIDE.md`를 참고하세요.
