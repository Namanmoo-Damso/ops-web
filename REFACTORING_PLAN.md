# ops-web 프론트엔드 리팩토링 계획

> 이 문서는 로컬 작업 가이드용이며, Git에 push하지 않습니다.

---

## 📋 목표

**Damso 디자인 시스템(DESIGN_GUIDE_V2.MD)을 따르면서, 일관성 있고 재사용 가능한 UI 컴포넌트 기반의 프론트엔드 구조를 구축합니다.**

### 핵심 원칙
- ✅ **디자인 시스템 준수**: Nature Palette, 타이포그래피, UI 컴포넌트 원칙
- ✅ **재사용성**: 공통 컴포넌트 라이브러리 구축
- ✅ **일관성**: 레이아웃, 스타일, 패턴 통일
- ✅ **타입 안정성**: TypeScript 엄격 모드, any 제거
- ✅ **점진적 마이그레이션**: 페이지별로 단계적 적용
- ✅ **shadcn/ui 철학**: 복사-붙여넣기 가능한 컴포넌트, 완전한 커스터마이징

---

## 🎨 디자인 시스템 요약 (DESIGN_GUIDE_V2.MD 기반)

### Core Colors
- Primary (Damso Green): `#8FA963`
- Secondary (Soft Sprout): `#C2D5A8`
- Foreground (Deep Moss): `#4A5D23`
- Background (Cream Rice): `#F7F9F2`

### Typography
- H1 (Page Title): 30px, font-black (900)
- H2 (Section Header): 22px, font-bold (700~900)
- Body: 16px, font-medium (500)
- Value/Primary Text: 16~19px, font-bold
- Label/Caption: 14~16px, font-semibold

### UI Components
- **Cards**: Radius 24~32px, shadow-sm 기본
- **Buttons**: 높이 h-10 이상, 16~18px
- **Modal**: 최대폭 1000~1200px, 라벨 16px, 값 18~19px

---

## 📊 현재 상태 분석

### 문제점
1. **디자인 일관성 부족**: CSS 변수, theme.ts, 인라인 스타일 혼재
2. **컴포넌트 재사용성 부족**: 버튼, 입력, 카드 등이 매번 재작성
3. **아이콘 중복 정의**: 3곳에서 같은 아이콘 SVG 재정의
4. **레이아웃 표준 부재**: 페이지마다 다른 헤더/타이틀 방식
5. **타입 안정성**: any 타입 사용, API 응답 수동 변환 반복

### 기술 스택
- Next.js 16.1.1 (App Router)
- React 19.2.3
- CSS Modules + Inline Styles
- LiveKit (실시간 영상)
- lucide-react + 커스텀 SVG

---

## 🚀 Phase별 작업 계획

### Phase 1: 디자인 시스템 기반 구축 ⭐️ (가장 우선)

**목표**: 모든 작업의 기반이 되는 디자인 토큰, 공통 컴포넌트 라이브러리 구축

#### 1-1. 디자인 토큰 시스템 구축
**Issue**: `[Refactor] 디자인 토큰 시스템 구축 및 CSS 변수 통합`

**작업 내용**:
- [ ] `styles/tokens.ts` 생성 (DESIGN_GUIDE_V2 기반)
- [ ] `styles/theme.css` 생성 (CSS 변수 통합)
- [ ] 기존 `app/theme.ts`, `app/globals.css` 통합
- [ ] 하드코딩된 색상값 → CSS 변수로 마이그레이션 (SidebarLayout부터)

**브랜치**: `refactor/#issue번호/design-tokens`

**예상 변경 파일**:
- `styles/tokens.ts` (NEW)
- `styles/theme.css` (NEW)
- `app/globals.css` (MODIFIED)
- `app/theme.ts` (DEPRECATED or MERGED)
- `components/SidebarLayout.tsx` (MODIFIED - 샘플 적용)

---

#### 1-2. 공통 UI 컴포넌트 라이브러리 (1차: 핵심 4개) ✅
**Issue**: `#52 [Feature] 공통 UI 컴포넌트 라이브러리 구축 (Button, Input, Card, Badge)`
**PR**: `#53`
**Status**: ✅ 완료

**작업 내용**:
- [x] `components/ui/Button.tsx` - variant(primary, secondary, danger, ghost), size(sm, md, lg), loading
- [x] `components/ui/Input.tsx` - label, error, helperText, 접근성 개선
- [x] `components/ui/Card.tsx` - padding variants, header/footer 슬롯, hoverable
- [x] `components/ui/Badge.tsx` - status variants (warning, danger, success, info), dot, icon
- [x] `components/ui/index.ts` - barrel export

**⚠️ Icon 컴포넌트 제외 이유**:
- 기존 `components/Icons.tsx`는 비디오 통화 전용 (IconMic, IconCam 등)
- 범용 Icon 컴포넌트는 Phase 5 페이지 리팩토링 시 추가 예정
- 기존 컴포넌트와의 충돌 방지 및 통합 계획 필요

**브랜치**: `feature/#52/ui-components-core`

**변경 파일**:
- `components/ui/Button.tsx` (NEW)
- `components/ui/Input.tsx` (NEW)
- `components/ui/Card.tsx` (NEW)
- `components/ui/Badge.tsx` (NEW)
- `components/ui/index.ts` (NEW)

**디자인 시스템 준수**:
- Button: h-10 이상 (40px), 16~18px, radius 12px
- Card: radius 24~32px, shadow-sm
- Badge: secondary/20 배경, 진한 텍스트

**shadcn/ui 패턴 적용**:
- ✅ forwardRef로 ref 전달 지원
- ✅ variant/size props로 변형 관리
- ✅ cn() 유틸리티로 className 병합
- ✅ displayName 명시
- ✅ TypeScript Props 인터페이스
- ⚠️ 추가 라이브러리(cva, clsx, tailwind-merge, Radix UI)는 프로젝트 복잡도 고려하여 미사용

---

#### 1-3. 공통 UI 컴포넌트 라이브러리 (2차: 복합 컴포넌트)
**Issue**: `[Feature] 공통 UI 컴포넌트 라이브러리 확장 (Modal, Table, LoadingSpinner, EmptyState)`

**작업 내용**:
- [x] `components/ui/Modal.tsx` - 1000~1200px max-width, 크림톤 배경
- [x] `components/ui/Table.tsx` - 정렬, 페이지네이션 내장
- [x] `components/ui/LoadingSpinner.tsx` - Damso Green 색상
- [x] `components/ui/EmptyState.tsx` - icon, title, description

**브랜치**: `feature/#issue번호/ui-components-extended`

**예상 변경 파일**:
- `components/ui/Modal.tsx` (NEW)
- `components/ui/Table.tsx` (NEW)
- `components/ui/LoadingSpinner.tsx` (NEW)
- `components/ui/EmptyState.tsx` (NEW)

---

### Phase 2: 레이아웃 시스템 정리

#### 2-1. DashboardLayout 및 PageHeader 표준화
**Issue**: `[Refactor] DashboardLayout 및 PageHeader 컴포넌트 표준화`

**작업 내용**:
- [x] `components/layouts/DashboardLayout.tsx` - 사이드바 + 헤더 통합
- [x] `components/layouts/PageHeader.tsx` - title, description, actions props
- [x] `components/layouts/Sidebar.tsx` - 기존 SidebarLayout에서 분리
- [x] 반응형 breakpoints 정의 (styles/tokens.ts에 추가)

**브랜치**: `refactor/#issue번호/dashboard-layout`

**예상 변경 파일**:
- `components/layouts/DashboardLayout.tsx` (NEW)
- `components/layouts/PageHeader.tsx` (NEW)
- `components/layouts/Sidebar.tsx` (NEW or from SidebarLayout)
- `components/SidebarLayout.tsx` (MODIFIED or DEPRECATED)

---

### Phase 3: 상태 관리 개선

> ⚠️ **의존성 분석 필수**: 이 Phase는 12개 이상의 파일이 `admin_access_token`을 직접 사용하므로 점진적 마이그레이션 필요

**영향받는 파일**:
- Hooks: useAuthedFetch, useAdminApi, useSessionMonitor, useLiveKitSession, useMultiRoomSession
- Components: AuthGuard, DashboardLayout
- Pages: beneficiaries, my-wards, dashboard, locations, emergencies, login, page.tsx

#### 3-1A. 핵심 인프라 구축 ✅ 완료
**Issue**: #61 | **PR**: #62

**완료된 작업**:
- [x] `contexts/AuthContext.tsx` - 중앙 인증 상태 관리
- [x] `lib/api-client.ts` - fetch 래퍼, 인증 헤더 자동 추가
- [x] `hooks/useAuth.ts` - AuthContext 편의 훅
- [x] `components/AuthGuard.tsx` - useAuth() 사용, LoadingSpinner 통일

> 📌 **향후 보안 개선 (별도 작업)**:
> - localStorage → httpOnly 쿠키 (백엔드 변경 필요)
> - 토큰 갱신(refresh) 로직 추가
> - 401 에러 시 재시도 로직

---

#### 3-1B. Hooks 마이그레이션 (두 번째 PR)
**Issue**: `[Refactor] 기존 Auth Hooks를 AuthContext 기반으로 마이그레이션`

**작업 내용**:
- [x] `hooks/useAuthedFetch.ts` - deprecated 표시, 새 useApi 권장
- [x] `hooks/useAdminApi.ts` - AuthContext 사용
- [x] `hooks/useSessionMonitor.ts` - AuthContext 사용
- [x] `hooks/useApi.ts` (NEW) - api-client 기반 통합 훅

**브랜치**: `refactor/#issue번호/auth-hooks-migration`

---

#### 3-1C. Pages 마이그레이션 (별도 PR들)
**Issue**: 각 페이지별 별도 Issue 생성

**작업 내용** (각각 개별 PR):
- [x] `app/beneficiaries/page.tsx` - useApi 사용
- [x] `app/my-wards/page.tsx` - useApi 사용
- [x] `app/dashboard/page.tsx` - useApi 사용
- [x] `app/locations/page.tsx` - useApi 사용
- [x] `app/emergencies/page.tsx` - useApi 사용
- [x] `app/login/page.tsx`, `app/login/callback/page.tsx` - AuthContext 사용

---


### Phase 4: 타입 안정성 강화

#### 4-1. API 타입 정의 통합 [COMPLETED]
**Issue**: #71 | **PR**: #72

**작업 내용**:
- [x] `types/api.ts` - ApiResponse<T>, DataListResponse<T>
- [x] `types/models.ts` - Beneficiary, Ward, Organization 등
- [x] `types/common.ts` - Status, LoadingState 등
- [x] 기존 any 타입 제거
- [x] `RoomConnection` 타입 정의
- [x] `AdminInfo` → `Admin` 모델로 리팩토링

**브랜치**: `refactor/#issue번호/api-types`

**예상 변경 파일**:
- `types/api.ts` (NEW)
- `types/models.ts` (NEW)
- `types/common.ts` (NEW)
- `types/admin.ts` (MODIFIED)
- `types/room.ts` (MODIFIED)

---

### Phase 5: 페이지별 리팩토링 (점진적 적용)

**⚠️ 중요: 기존 컴포넌트 정리 및 통합**
Phase 5에서는 각 페이지 리팩토링과 함께 기존 컴포넌트들을 새 디자인 시스템 기반으로 재작성합니다.

**정리 대상 컴포넌트**:
- `components/Icons.tsx` → `components/video/Icons.tsx` 이동 또는 유지 (비디오 전용)
- `components/CsvUploadModal.tsx` → 새 Modal 컴포넌트 기반으로 리팩토링
- `components/ManualWardForm.tsx` → 새 Input, Button 컴포넌트 기반으로 리팩토링
- `components/DashboardCharts.tsx` → Card 컴포넌트 기반으로 개선
- `app/my-wards/icons.tsx` → 제거 (Icons.tsx 통합 또는 lucide-react 사용)

**범용 Icon 컴포넌트 추가**:
- Phase 5 중반쯤 `components/ui/Icon.tsx` 구현
- lucide-react + 프로젝트 커스텀 아이콘 통합
- 기존 Icons.tsx와 충돌 방지

---

#### 5-1. Dashboard 페이지 리팩토링 (템플릿 확립)
**Issue**: `[Refactor] Dashboard 페이지를 새 디자인 시스템으로 마이그레이션`

**작업 내용**:
- [ ] DashboardLayout 적용
- [ ] PageHeader 컴포넌트 사용
- [ ] 공통 UI 컴포넌트 (Card, Badge, Button) 적용
- [ ] CSS Module → CSS 변수 마이그레이션
- [ ] 타입 안정성 강화

**브랜치**: `refactor/#issue번호/dashboard-page`

**예상 변경 파일**:
- `app/dashboard/page.tsx` (MODIFIED)
- `app/dashboard/dashboard.module.css` (MODIFIED or REMOVED)

---

#### 5-2. Beneficiaries 페이지 리팩토링
**Issue**: `[Refactor] Beneficiaries 페이지를 새 디자인 시스템으로 마이그레이션`

**작업 내용**:
- [ ] Table, Modal 컴포넌트 적용
- [ ] 공통 UI 컴포넌트 적용
- [ ] 타입 안정성 강화
- [ ] DetailModal 개선

**브랜치**: `refactor/#issue번호/beneficiaries-page`

**예상 변경 파일**:
- `app/beneficiaries/page.tsx` (MODIFIED)
- `app/beneficiaries/DetailModal.tsx` (MODIFIED)
- `app/beneficiaries/DetailModal.module.css` (MODIFIED or REMOVED)

---

#### 5-3. My-Wards 페이지 리팩토링
**Issue**: `[Refactor] My-Wards 페이지를 새 디자인 시스템으로 마이그레이션`

**작업 내용**:
- [ ] 동일 패턴 적용
- [ ] StatCard 컴포넌트를 공통 Card 기반으로 리팩토링
- [ ] 아이콘 통합 (components/ui/Icon 사용)

**브랜치**: `refactor/#issue번호/my-wards-page`

**예상 변경 파일**:
- `app/my-wards/page.tsx` (MODIFIED)
- `app/my-wards/StatCard.tsx` (MODIFIED)
- `app/my-wards/icons.tsx` (DEPRECATED)

---

#### 5-4. Monitoring 페이지 UI 개선
**Issue**: `[Refactor] Monitoring 페이지 UI를 디자인 시스템에 맞게 개선`

**작업 내용**:
- [ ] 비디오 로직은 유지, UI만 개선
- [ ] ControlBar, Sidebar 등에 공통 컴포넌트 적용
- [ ] CSS Module 정리

**브랜치**: `refactor/#issue번호/monitoring-page`

**예상 변경 파일**:
- `app/page.tsx` (MODIFIED)
- `app/page.module.css` (MODIFIED)
- `components/video/*` (MODIFIED)

---

#### 5-5. 나머지 페이지 (Locations, Emergencies)
**Issue**: `[Refactor] Locations 및 Emergencies 페이지 리팩토링`

**작업 내용**:
- [ ] 동일 패턴 적용
- [ ] 공통 컴포넌트 사용

**브랜치**: `refactor/#issue번호/locations-emergencies-pages`

---

### Phase 6: 최적화 및 문서화

#### 6-1. 반응형 최적화 및 접근성 개선
**Issue**: `[Enhancement] 반응형 디자인 및 접근성 개선`

**작업 내용**:
- [ ] 모든 페이지 반응형 테스트
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션 개선

**브랜치**: `refactor/#issue번호/responsive-a11y`

---

#### 6-2. 컴포넌트 스토리북 문서화 (선택사항)
**Issue**: `[Docs] Storybook을 활용한 UI 컴포넌트 문서화`

**작업 내용**:
- [ ] Storybook 설정
- [ ] 각 컴포넌트 스토리 작성

**브랜치**: `docs/#issue번호/storybook`

---

## 📁 최종 디렉토리 구조

```
ops-web/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/        # 메인 대시보드 그룹
│   │   ├── layout.tsx      # DashboardLayout 적용
│   │   ├── page.tsx        # Dashboard
│   │   ├── beneficiaries/
│   │   ├── my-wards/
│   │   ├── locations/
│   │   └── emergencies/
│   └── monitoring/         # Fullscreen monitoring
│       └── page.tsx
├── components/
│   ├── ui/                 # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   ├── Icon.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   ├── PageHeader.tsx
│   │   └── Sidebar.tsx
│   └── features/           # 기능별 컴포넌트
│       ├── beneficiaries/
│       ├── video/
│       └── wards/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   └── constants.ts
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useApi.ts
│   ├── useAuth.ts
│   └── ...
├── styles/
│   ├── tokens.ts           # 디자인 토큰
│   ├── theme.css           # CSS 변수
│   └── globals.css
├── types/
│   ├── api.ts
│   ├── models.ts
│   └── common.ts
└── REFACTORING_PLAN.md     # 이 파일 (Git에 push 안함)
```

---

## 🎯 Quick Wins (즉시 적용 가능)

1. **하드코딩된 색상 → CSS 변수** (Phase 1-1)
2. **Button 컴포넌트 하나만 만들어서 적용** (Phase 1-2)
3. **API 환경 변수 통일** (Phase 3-1)
4. **공통 에러/로딩 UI** (Phase 1-3)

---

## ✅ 작업 순서 요약

1. **Phase 1-1**: 디자인 토큰 시스템 구축 ⭐️
2. **Phase 1-2**: 핵심 UI 컴포넌트 5개 (Button, Input, Card, Badge, Icon) ⭐️
3. **Phase 1-3**: 확장 UI 컴포넌트 (Modal, Table, Loading, Empty)
4. **Phase 2-1**: DashboardLayout, PageHeader 표준화
5. **Phase 3-1**: AuthContext, API 클라이언트
6. **Phase 4-1**: API 타입 정의
7. **Phase 5-1**: Dashboard 페이지 리팩토링 (템플릿)
8. **Phase 5-2~5**: 나머지 페이지 순차 적용
9. **Phase 6**: 최적화 및 문서화

---

## 📝 Git 워크플로우

### 브랜치 네이밍 (WORKFLOW_GUIDE.md 준수)
```
<type>/#<issue_number>/<short_description>
```

### 커밋 컨벤션
```
<type>(<scope>): <subject>

<body>
```

### PR 제목
```
[Type] issue 제목
```

### 예시
```bash
# Issue 생성
gh issue create --title "[Refactor] 디자인 토큰 시스템 구축 및 CSS 변수 통합"

# 브랜치 생성
git checkout -b refactor/#123/design-tokens

# 작업 후 커밋
git add .
git commit -m "refactor(styles): 디자인 토큰 시스템 구축

- styles/tokens.ts 생성
- DESIGN_GUIDE_V2 기반 Core Colors, Typography 정의
- CSS 변수 통합 (theme.css)
- globals.css에서 중복 제거"

# Push
git push -u origin refactor/#123/design-tokens

# PR 생성
gh pr create --base dev --title "[Refactor] 디자인 토큰 시스템 구축 및 CSS 변수 통합" --body "Closes #123"
```

---

## 🚨 주의사항

- ⚠️ **DESIGN_GUIDE_V2.MD 준수 필수**
- ⚠️ **작은 PR 권장**: 200줄 이하
- ⚠️ **각 Phase는 독립적으로 PR**: 한 번에 여러 Phase 포함 금지
- ⚠️ **테스트 후 머지**: 각 페이지 리팩토링 후 UI 동작 확인 필수
- ⚠️ **AI 생성 표시 금지**: 커밋, PR에 Claude Code 언급 금지

## 📚 참고 자료

- **shadcn/ui**: 컴포넌트 아키텍처 패턴 참고
  - 철학: 복사-붙여넣기 가능한 컴포넌트, npm 의존성 최소화
  - 패턴: forwardRef, variant props, cn() 유틸리티
  - URL: https://ui.shadcn.com
- **DESIGN_GUIDE_V2.MD**: Damso 디자인 시스템 상세 가이드
- **WORKFLOW_GUIDE.md**: Git 브랜치, 커밋, PR 컨벤션

---

Last Updated: 2026.01.07
