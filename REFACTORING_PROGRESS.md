# ops-web 리팩토링 진행 현황

> 이 문서는 완료된 작업과 생성된 컴포넌트를 추적합니다.  
> 로컬 작업용이며 Git에 push하지 않습니다.

---

## ✅ 완료된 Phase

### Phase 1: 디자인 시스템 기반 구축

| 단계 | Issue | PR | 상태 |
|------|-------|-----|------|
| 1-1 디자인 토큰 | #50 | #51 | ✅ 완료 |
| 1-2 핵심 UI 컴포넌트 | #52 | #53 | ✅ 완료 |
| 1-3 확장 UI 컴포넌트 | #56 | #57 | ✅ 완료 |

---

### Phase 2-1: 레이아웃 시스템 정리

| 단계 | Issue | PR | 상태 |
|------|-------|-----|------|
| DashboardLayout, PageHeader | #59 | #60 | ✅ 완료 |

---

### Phase 3: 상태 관리 및 API 개선

| 단계 | Issue | PR | 상태 |
|------|-------|-----|------|
| **3-1A** 핵심 인프라 | #61 | #62 | ✅ 완료 |
| **3-1B** Hooks 마이그레이션 | #63 | #64 | ✅ 완료 |
| **3-1C** Pages 마이그레이션 | #65, #67, #69 | #66, #68, #70 | ✅ 완료 |

---

### Phase 4: 타입 안정성 강화

| 단계 | Issue | PR | 상태 |
|------|-------|-----|------|
| **4-1** API 타입 정의 | #71 | #72 | ✅ 완료 |


## 📦 생성된 컴포넌트

### UI 컴포넌트 (`components/ui/`)

```tsx
import { 
  Button, Input, Card, Badge, 
  LoadingSpinner, Modal, Table, EmptyState 
} from '@/components/ui';
```

| 컴포넌트 | 주요 Props | 용도 |
|----------|-----------|------|
| `Button` | variant, size, loading | 액션 버튼 |
| `Input` | label, error, helperText | 폼 입력 |
| `Card` | padding, hoverable | 컨테이너 |
| `Badge` | variant (success/warning/danger) | 상태 표시 |
| `LoadingSpinner` | size | 로딩 상태 |
| `Modal` | open, onClose, title, size | 팝업 |
| `Table` | - | 데이터 테이블 |
| `EmptyState` | icon, title, description | 빈 상태 |

### 레이아웃 컴포넌트 (`components/layouts/`)

```tsx
import { DashboardLayout, PageHeader, Sidebar } from '@/components/layouts';
```

| 컴포넌트 | 주요 Props | 용도 |
|----------|-----------|------|
| `DashboardLayout` | title, noPadding, children | 메인 레이아웃 |
| `PageHeader` | title, description, actions | 페이지 헤더 |
| `Sidebar` | collapsed, onCollapsedChange | 사이드바 |

---

## 🎨 적용된 패턴

### shadcn/ui 스타일
```tsx
const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ prop1, prop2, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        {/* content */}
      </div>
    );
  }
);
Component.displayName = 'Component';
export default Component;
```

### 디자인 토큰 사용
```tsx
import { colors, spacing, typography, borderRadius, shadows } from '@/styles/tokens';

// 사용 예
backgroundColor: colors.primary.main,
padding: spacing.lg,
fontSize: typography.fontSize.body,
```

---

## 🔜 다음 작업: Phase 3-1 (점진적 마이그레이션)

> ⚠️ 12개 이상 파일이 `admin_access_token` 직접 사용 → 점진적 마이그레이션 필요

| Sub-Phase | 내용 | PR 크기 | 상태 |
|-----------|------|---------|------|
| **3-1A** | AuthContext, api-client, useAuth 핵심 인프라 | ~300줄 | ✅ 완료 |
| **3-1B** | Hooks 마이그레이션 (useAuthedFetch 등) | ~200줄 | ✅ 완료 |
| **3-1C** | Pages 마이그레이션 (각 페이지별) | 개별 | ✅ 완료 |
| **4-1** | API 타입 정의 및 any 제거 | ~300줄 | ✅ 완료 |

### 영향받는 파일 목록
- **Types**: `types/api.ts`, `types/models.ts`, `types/common.ts`
- **Pages**: beneficiaries, dashboard, select-organization
- **Hooks**: useMultiRoomSession, useLiveKitSession
- **Layouts**: DashboardLayout
- **Hooks**: useAuthedFetch, useAdminApi, useSessionMonitor, useLiveKitSession, useMultiRoomSession
- **Components**: AuthGuard, DashboardLayout
- **Pages**: beneficiaries, my-wards, dashboard, locations, emergencies, login, page.tsx

---

*Last Updated: 2026.01.08*
