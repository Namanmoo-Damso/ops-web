# ops-web Development Guide

> Comprehensive reference guide for developing pages in ops-web. This guide documents the design system, component library, styling approach, and best practices established during the frontend refactoring phases.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Architecture](#project-architecture)
3. [UI Component Library](#ui-component-library)
4. [Styling System](#styling-system)
5. [Layout Components](#layout-components)
6. [Data Fetching Patterns](#data-fetching-patterns)
7. [Type Definitions](#type-definitions)
8. [Best Practices](#best-practices)
9. [Refactoring Checklist](#refactoring-checklist)
10. [File Structure](#file-structure)

---

## Quick Start

### Creating a New Page

```tsx
// 1. Use DashboardLayout
import DashboardLayout from '../../components/layouts/DashboardLayout';

// 2. Import UI components
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

// 3. Import types
import type { Ward, ApiResponse } from '../../types/models';

// 4. Use the useApi hook for data fetching
import { useApi } from '../../hooks/useApi';

export default function MyPage() {
  const { data, loading, error, refetch } = useApi<ApiResponse<Ward[]>>({
    fetcher: (client, signal) => client.get('/v1/admin/my-endpoint', { signal }),
  });

  return (
    <DashboardLayout title="페이지 제목">
      {loading && <LoadingSpinner />}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <Card>
          {/* Render your data */}
        </Card>
      )}
    </DashboardLayout>
  );
}
```

---

## Project Architecture

### Technology Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Real-time Communication**: LiveKit
- **Icons**: Lucide React
- **Charts**: Recharts
- **Styling**: CSS Variables + CSS Modules (No Tailwind)

### Key Architectural Decisions

1. **No Global State Library**: Server state managed by `useApi` hook, auth state in React Context
2. **Type-Safe API Client**: Centralized `api-client.ts` with TypeScript generics
3. **Component-Based Architecture**: Reusable UI components following shadcn/ui patterns
4. **Design Token System**: CSS variables mapped from TypeScript tokens
5. **Page-Specific Styling**: Dedicated CSS files per page feature

### Current Pages Status

| Page | Path | Layout | Status | Notes |
|------|------|--------|--------|-------|
| **Dashboard** | `/app/dashboard/page.tsx` | DashboardLayout | ✅ Modern | Template for new pages |
| **Beneficiaries** | `/app/beneficiaries/page.tsx` | DashboardLayout | ✅ Modern | Full CRUD with table |
| **My Wards** | `/app/my-wards/page.tsx` | DashboardLayout | ✅ Modern | Refactored |
| **Emergencies** | `/app/emergencies/page.tsx` | DashboardLayout | ✅ Modern | Map integration |
| **Locations** | `/app/locations/page.tsx` | DashboardLayout | ✅ Modern | Floating sidebar overlay (#115) |
| **Stats** | `/app/stats/page.tsx` | DashboardLayout | ✅ Modern | Charts & Filters (#94) |
| **Staff** | `/app/staff/page.tsx` | DashboardLayout | ✅ Modern | Employee management (#102) |
| **Settings** | `/app/settings/page.tsx` | DashboardLayout | ✅ Modern | App settings (#98) |
| **Video Monitoring** | `/app/page.tsx` | SidebarLayout | ❌ Legacy | Needs refactoring |

---

## UI Component Library

### Component Principles

All UI components follow these standards:
- **shadcn/ui-inspired**: forwardRef support, variant/size props, TypeScript interfaces
- **No External Dependencies**: Built without cva, clsx, or radix-ui
- **Type-Safe**: Full TypeScript support with exported interfaces
- **Accessible**: Semantic HTML and ARIA attributes

### Button Component

```tsx
import Button from '../../components/ui/Button';

<Button
  variant="primary"
  size="md"
  loading={isLoading}
  fullWidth
  onClick={handleClick}
>
  Click Me
</Button>
```

**Props:**
- `variant`: `'primary'` | `'secondary'` | `'danger'` | `'ghost'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `loading`: boolean - Shows spinner and disables button
- `fullWidth`: boolean - Button takes full width of container
- Standard button HTML attributes

**CSS Classes:** `.ui-btn`, `.ui-btn-primary`, `.ui-btn-secondary`, `.ui-btn-danger`, `.ui-btn-ghost`

---

### Input Component

```tsx
import Input from '../../components/ui/Input';

<Input
  label="사용자 이름"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  helperText="2-20자 사이로 입력하세요"
  placeholder="이름을 입력하세요"
  fullWidth
/>
```

**Props:**
- `label`: string - Label text above input
- `error`: string - Error message (turns input red)
- `helperText`: string - Helper text below input
- `fullWidth`: boolean - Input takes full width
- Standard input HTML attributes (placeholder, type, disabled, etc.)

**CSS Classes:** `.ui-input`, `.ui-input-error`, `.ui-input-helper-text`

---

### Card Component

```tsx
import Card from '../../components/ui/Card';

<Card
  padding="md"
  radius="default"
  hoverable
  header={<h3>Card Title</h3>}
  footer={<Button>Action</Button>}
>
  Card content here
</Card>
```

**Props:**
- `padding`: `'none'` | `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `radius`: `'none'` | `'sm'` | `'default'` | `'lg'` | `'full'` (default: `'default'`)
- `hoverable`: boolean - Adds hover effect with lift
- `header`: ReactNode - Card header content
- `footer`: ReactNode - Card footer content
- `className`: string - Additional CSS classes

**CSS Classes:** `.ui-card`, `.ui-card-hoverable`, `.ui-card-header`, `.ui-card-footer`

**Example - Stat Card:**
```tsx
<Card padding="lg" hoverable>
  <div className="stat-card">
    <div className="stat-value">142</div>
    <div className="stat-label">Total Wards</div>
  </div>
</Card>
```

---

### Badge Component

```tsx
import Badge from '../../components/ui/Badge';

<Badge variant="success" size="md" dot icon={<CheckIcon />}>
  Active
</Badge>
```

**Props:**
- `variant`: `'default'` | `'warning'` | `'danger'` | `'success'` | `'info'` (default: `'default'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `dot`: boolean - Shows colored dot before text
- `icon`: ReactNode - Icon element to display

**CSS Classes:** `.ui-badge`, `.ui-badge-warning`, `.ui-badge-danger`, `.ui-badge-success`, `.ui-badge-info`

**Status Badge Examples:**
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
```

---

### Table Components

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow
        key={item.id}
        selected={selectedId === item.id}
        onClick={() => handleSelect(item.id)}
      >
        <TableCell>{item.name}</TableCell>
        <TableCell>
          <Badge variant="success">Active</Badge>
        </TableCell>
        <TableCell>
          <Button size="sm" variant="ghost">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Components:**
- `Table`: Main table wrapper
- `TableHeader`: Header section (thead)
- `TableBody`: Body section (tbody)
- `TableRow`: Table row (tr) - accepts `selected` prop for highlight
- `TableHead`: Header cell (th)
- `TableCell`: Body cell (td)

**CSS Classes:** `.ui-table`, `.ui-table-row`, `.ui-table-row-selected`, `.ui-table-cell`

---

### Modal Component

```tsx
import Modal from '../../components/ui/Modal';

<Modal
  open={isOpen}
  onClose={handleClose}
  title="확인"
  size="md"
>
  <div className="modal-content">
    <p>Are you sure you want to proceed?</p>
  </div>
  <div className="modal-actions">
    <Button variant="secondary" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </div>
</Modal>
```

**Props:**
- `open`: boolean - Controls modal visibility
- `onClose`: () => void - Called when closing modal (backdrop click or ESC key)
- `title`: string - Modal title
- `size`: `'sm'` | `'md'` | `'lg'` | `'xl'` (default: `'md'`)

**Features:**
- Backdrop click to close
- ESC key to close
- Focus trap
- Scroll lock

---

### LoadingSpinner Component

```tsx
import LoadingSpinner from '../../components/ui/LoadingSpinner';

<LoadingSpinner size="md" />

// In buttons
<Button loading={isLoading}>Submit</Button>
```

**Props:**
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)

---

### EmptyState Component

```tsx
import EmptyState from '../../components/ui/EmptyState';
import { Inbox } from 'lucide-react';

<EmptyState
  icon={<Inbox size={48} />}
  title="데이터가 없습니다"
  description="새로운 항목을 추가해보세요"
/>
```

**Props:**
- `icon`: ReactNode - Icon to display (use Lucide React icons)
- `title`: string - Main message
- `description`: string - Secondary message

---

### Component Reference Table

| Component | Import | Primary Use Case |
|-----------|--------|------------------|
| **Button** | `import Button from '../../components/ui/Button'` | Actions, form submissions, CTAs |
| **Input** | `import Input from '../../components/ui/Input'` | Form inputs with labels and validation |
| **Card** | `import Card from '../../components/ui/Card'` | Content containers, stat cards, panels |
| **Badge** | `import Badge from '../../components/ui/Badge'` | Status indicators, tags, categories |
| **Table** | Named exports from `'../../components/ui/Table'` | Data tables with selection |
| **Modal** | `import Modal from '../../components/ui/Modal'` | Dialogs, forms, confirmations |
| **LoadingSpinner** | `import LoadingSpinner from '../../components/ui/LoadingSpinner'` | Loading states |
| **EmptyState** | `import EmptyState from '../../components/ui/EmptyState'` | Empty data states |

---

## Styling System

### Design Token System

The project uses a comprehensive design token system in `styles/tokens.ts` that maps to CSS variables in `styles/theme.css`.

#### Using Design Tokens (TypeScript)

```tsx
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/tokens';

<div style={{
  backgroundColor: colors.primary.main,
  padding: spacing.lg,
  fontSize: typography.fontSize.body,
  borderRadius: borderRadius.default,
  boxShadow: shadows.sm,
}}>
  Content
</div>
```

#### Using CSS Variables (Recommended for Inline Styles)

```tsx
<div style={{
  backgroundColor: 'var(--color-primary)',
  padding: 'var(--spacing-lg)',
  fontSize: 'var(--font-size-body)',
  borderRadius: 'var(--border-radius-default)',
  boxShadow: 'var(--shadow-sm)',
}}>
  Content
</div>
```

### Available CSS Variables

#### Colors (`styles/theme.css`)

```css
/* Primary Colors */
--color-primary: #8fa963           /* Damso Green */
--color-primary-dark: #4a5d23      /* Deep Moss */
--color-primary-light: #c2d5a8     /* Light Moss */

/* Background Colors */
--color-bg: #f7f9f2                /* Main background - Cream Rice */
--color-bg-elevated-1: #f0f5e8     /* Elevated surface 1 */
--color-bg-elevated-2: #e9f0df     /* Elevated surface 2 */
--color-panel: #ffffff             /* White panels/cards */

/* Semantic Colors */
--color-danger-main: #ef4444       /* Error/Danger states */
--color-danger-light: #fef2f2      /* Danger background */
--color-warning-main: #f59e0b      /* Warning states */
--color-warning-light: #fffbeb     /* Warning background */
--color-success-main: #10b981      /* Success states */
--color-success-light: #f0fdf4     /* Success background */
--color-info-main: #3b82f6         /* Info states */
--color-info-light: #eff6ff        /* Info background */

/* Text Colors */
--color-text-primary: #1e293b      /* Primary text */
--color-text-secondary: #475569    /* Secondary text */
--color-text-muted: #94a3b8        /* Muted text */
--color-text-soft: #cbd5e1         /* Very muted text */

/* Border Colors */
--color-border: #e2e8f0            /* Default border */
--color-border-hover: #cbd5e1      /* Border on hover */
```

#### Spacing

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 20px
--spacing-2xl: 24px
--spacing-3xl: 28px
--spacing-4xl: 32px
```

#### Typography

```css
/* Font Sizes */
--font-size-h1: 30px
--font-size-h2: 24px
--font-size-h3: 20px
--font-size-body: 15px
--font-size-small: 13px
--font-size-tiny: 11px

/* Font Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

/* Line Heights */
--line-height-tight: 1.25
--line-height-normal: 1.5
--line-height-relaxed: 1.75
```

#### Border Radius

```css
--border-radius-sm: 8px
--border-radius-default: 12px
--border-radius-lg: 16px
--border-radius-xl: 20px
--border-radius-2xl: 24px
--border-radius-3xl: 28px
--border-radius-4xl: 32px
--border-radius-full: 9999px
```

#### Shadows

```css
--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08)
--shadow-md: 0 4px 6px rgba(15, 23, 42, 0.1)
--shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.1)
--shadow-raised: 0 2px 4px rgba(15, 23, 42, 0.08)
--shadow-lifted: 0 4px 12px rgba(15, 23, 42, 0.12)
--shadow-floating: 0 10px 25px rgba(15, 23, 42, 0.15)
--shadow-danger-glow: 0 0 0 3px rgba(239, 68, 68, 0.1)
```

### Page-Specific CSS Files

Create dedicated CSS files for page-specific styles in the `styles/` directory.

**Existing page-specific CSS:**
- `styles/dashboard.css` - Dashboard page styles
- `styles/beneficiaries.css` - Beneficiaries page styles
- `styles/my-wards.css` - My-wards page styles

**Creating a new page-specific CSS file:**

1. Create the file: `styles/my-new-page.css`

```css
/* styles/my-new-page.css */

.my-page-hero {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-bg-elevated-2));
  padding: var(--spacing-4xl);
  border-radius: var(--border-radius-lg);
}

.my-page-stat-card {
  text-align: center;
}

.my-page-stat-value {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-dark);
}

.my-page-stat-label {
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
}
```

2. Import in `app/globals.css`:

```css
/* app/globals.css */
@import '../styles/theme.css';
@import '../styles/components.css';
@import '../styles/dashboard.css';
@import '../styles/beneficiaries.css';
@import '../styles/my-wards.css';
@import '../styles/my-new-page.css';  /* Add your new file */
```

3. Use in your component:

```tsx
export default function MyPage() {
  return (
    <DashboardLayout title="My Page">
      <div className="my-page-hero">
        <h1>Welcome</h1>
      </div>
      <div className="my-page-stat-card">
        <div className="my-page-stat-value">142</div>
        <div className="my-page-stat-label">Total Items</div>
      </div>
    </DashboardLayout>
  );
}
```

---

## Layout Components

### DashboardLayout (Primary Layout)

Use `DashboardLayout` for all main application pages.

```tsx
import DashboardLayout from '../../components/layouts/DashboardLayout';

export default function MyPage() {
  return (
    <DashboardLayout
      title="페이지 제목"
      noPadding={false}
    >
      {/* Page content */}
    </DashboardLayout>
  );
}
```

**Props:**
- `title`: string - Page title shown in the header
- `noPadding`: boolean - Removes default content padding (default: false)
- `csvModalOpen`: boolean - Controls CSV upload modal visibility
- `children`: ReactNode - Page content

**Features:**
- Integrated sidebar navigation
- Responsive design
- CSV upload functionality
- Logout handling
- Consistent page header

### Sidebar Component

The sidebar is integrated into `DashboardLayout` and includes:
- Navigation links
- User profile display
- CSV upload button
- Logout button
- Collapse/expand functionality

**Navigation Items:**
```tsx
const navItems = [
  { path: '/dashboard', label: '대시보드', icon: <LayoutDashboard /> },
  { path: '/beneficiaries', label: '수급자 관리', icon: <Users /> },
  { path: '/my-wards', label: 'My 어르신', icon: <Heart /> },
  { path: '/emergencies', label: '응급 상황', icon: <AlertTriangle /> },
  { path: '/locations', label: '위치 추적', icon: <MapPin /> },
  { path: '/', label: '영상 모니터링', icon: <Video /> },
];
```

### PageHeader Component

For custom page headers within `DashboardLayout`:

```tsx
import PageHeader from '../../components/layouts/PageHeader';

<PageHeader
  title="페이지 제목"
  description="페이지 설명"
  actions={
    <Button onClick={handleAction}>
      Action
    </Button>
  }
/>
```

**Props:**
- `title`: string - Page title
- `description`: string - Optional page description
- `actions`: ReactNode - Optional action buttons

---

## Data Fetching Patterns

### Modern Pattern: useApi Hook (Recommended)

The `useApi` hook provides a consistent way to fetch data with built-in loading states, error handling, and request cancellation.

```tsx
import { useApi } from '../../hooks/useApi';
import type { Ward, ApiResponse } from '../../types/models';

export default function MyPage() {
  const { data, loading, error, refetch } = useApi<ApiResponse<Ward[]>>({
    fetcher: (client, signal) => client.get('/v1/admin/wards', { signal }),
    deps: [], // Dependencies for refetching
    skip: false, // Optional: skip initial fetch
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map(ward => (
        <div key={ward.id}>{ward.name}</div>
      ))}
      <Button onClick={refetch}>Refresh</Button>
    </div>
  );
}
```

**useApi Hook Features:**
- Automatic request cancellation on unmount
- Stale request prevention
- Loading/error states
- Manual refetch capability
- Auth error handling (401/403 redirects)
- AbortSignal support

**useApi Parameters:**
```tsx
interface UseApiOptions<T> {
  fetcher: (client: ApiClient, signal: AbortSignal) => Promise<T>;
  deps?: React.DependencyList;  // Dependencies for refetching
  skip?: boolean;                // Skip initial fetch
}
```

### API Client

The centralized API client in `lib/api-client.ts` provides type-safe HTTP methods:

```tsx
import { apiClient } from '../../lib/api-client';

// GET request
const wards = await apiClient.get<Ward[]>('/v1/admin/wards');

// POST request
const newWard = await apiClient.post<Ward>('/v1/admin/wards', {
  name: '홍길동',
  phoneNumber: '010-1234-5678',
});

// PUT request
const updatedWard = await apiClient.put<Ward>(`/v1/admin/wards/${id}`, {
  name: '홍길동',
});

// DELETE request
await apiClient.delete(`/v1/admin/wards/${id}`);
```

**API Client Features:**
- Automatic authentication header injection
- Type-safe responses with TypeScript generics
- Auth error handling (redirects to login on 401/403)
- AbortSignal support for request cancellation
- Centralized error handling

### Pagination Pattern

For paginated data:

```tsx
import type { PaginatedResponse } from '../../types/api';

export default function MyPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, loading, error } = useApi<PaginatedResponse<Ward>>({
    fetcher: (client, signal) =>
      client.get(`/v1/admin/wards?page=${page}&limit=${limit}`, { signal }),
    deps: [page, limit],
  });

  return (
    <div>
      {/* Render data */}
      <div className="pagination">
        <Button
          disabled={!data?.hasPrevPage}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <span>Page {page} of {data?.totalPages}</span>
        <Button
          disabled={!data?.hasNextPage}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

### Search and Filter Pattern

```tsx
export default function MyPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading } = useApi<Ward[]>({
    fetcher: (client, signal) =>
      client.get(`/v1/admin/wards?search=${debouncedSearch}`, { signal }),
    deps: [debouncedSearch],
  });

  return (
    <div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
      {loading && <LoadingSpinner />}
      {/* Render filtered data */}
    </div>
  );
}
```

### Auto-refresh Pattern

For real-time data that needs periodic updates:

```tsx
export default function MyPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, loading, refetch } = useApi<Location[]>({
    fetcher: (client, signal) =>
      client.get('/v1/admin/locations', { signal }),
    deps: [],
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <div>
      <Button onClick={() => setAutoRefresh(!autoRefresh)}>
        {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
      </Button>
      {/* Render data */}
    </div>
  );
}
```

---

## Type Definitions

### Core Models (`types/models.ts`)

```typescript
// Admin/User
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  organizationId: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
}

// Organization
export interface Organization {
  id: string;
  name: string;
  code: string;
  region: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Ward (보호 대상자)
export interface Ward {
  id: string;
  name: string;
  phoneNumber: string;
  birthDate: string;
  gender: 'male' | 'female';
  address: string;
  organizationId: string;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
}

// Beneficiary (수급자)
export interface Beneficiary {
  id: string;
  name: string;
  wardId: string;
  wardName?: string;
  status: 'active' | 'inactive' | 'pending';
  deviceStatus: 'online' | 'offline';
  lastActiveAt?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// Emergency
export interface Emergency {
  id: string;
  wardId: string;
  wardName?: string;
  beneficiaryId: string;
  beneficiaryName?: string;
  status: 'active' | 'resolved' | 'false_alarm';
  type: 'fall' | 'sos' | 'medical' | 'other';
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  occurredAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Location
export interface Location {
  id: string;
  wardId: string;
  wardName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  batteryLevel?: number;
  status: 'normal' | 'warning' | 'emergency';
}
```

### API Types (`types/api.ts`)

```typescript
// Standard API Response
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// List Response (alternative format)
export interface DataListResponse<T> {
  data: T[];
  total?: number;
}

// Error Response
export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

// Search Parameters
export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

### Using Types in Components

```tsx
import type { Ward, ApiResponse, PaginatedResponse } from '../../types/models';

export default function MyPage() {
  // Single item
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // List
  const { data } = useApi<ApiResponse<Ward[]>>({
    fetcher: (client, signal) => client.get('/v1/admin/wards', { signal }),
  });

  // Paginated
  const { data: paginatedData } = useApi<PaginatedResponse<Ward>>({
    fetcher: (client, signal) =>
      client.get('/v1/admin/wards?page=1&limit=20', { signal }),
  });

  return <div>{/* ... */}</div>;
}
```

---

## Best Practices

### ✅ Do

1. **Use DashboardLayout for all pages**
   ```tsx
   <DashboardLayout title="페이지 제목">
     {/* content */}
   </DashboardLayout>
   ```

2. **Use CSS variables for styling**
   ```tsx
   style={{
     color: 'var(--color-primary-dark)',
     padding: 'var(--spacing-lg)',
     border: '1px solid var(--color-border)'
   }}
   ```

3. **Use UI components from `components/ui/`**
   ```tsx
   import Button from '../../components/ui/Button';
   import Card from '../../components/ui/Card';
   ```

4. **Create page-specific CSS files**
   ```css
   /* styles/my-page.css */
   .my-page-hero { /* ... */ }
   ```

5. **Use the useApi hook for data fetching**
   ```tsx
   const { data, loading, error } = useApi({ /* ... */ });
   ```

6. **Use TypeScript types from `types/models.ts`**
   ```tsx
   import type { Ward, ApiResponse } from '../../types/models';
   ```

7. **Handle loading and error states**
   ```tsx
   if (loading) return <LoadingSpinner />;
   if (error) return <div>Error: {error.message}</div>;
   ```

8. **Use Lucide React for icons**
   ```tsx
   import { Users, MapPin, AlertTriangle } from 'lucide-react';
   ```

### ❌ Don't

1. **Don't use SidebarLayout** (deprecated)
   ```tsx
   // ❌ Legacy
   import SidebarLayout from '../components/SidebarLayout';

   // ✅ Modern
   import DashboardLayout from '../../components/layouts/DashboardLayout';
   ```

2. **Don't use palette from app/theme.ts** (legacy)
   ```tsx
   // ❌ Legacy
   import { palette } from '../theme';
   style={{ color: palette.primary }}

   // ✅ Modern
   style={{ color: 'var(--color-primary)' }}
   ```

3. **Don't use hardcoded colors**
   ```tsx
   // ❌ Bad
   style={{ color: '#4A5D23' }}

   // ✅ Good
   style={{ color: 'var(--color-primary-dark)' }}
   ```

4. **Don't use Tailwind classes** (project policy)
   ```tsx
   // ❌ Bad
   <div className="bg-blue-500 p-4 rounded-lg">

   // ✅ Good
   <Card padding="lg">
   ```

5. **Don't create custom components that duplicate UI library**
   ```tsx
   // ❌ Bad - custom StatCard component
   const StatCard = ({ value, label }) => { /* ... */ };

   // ✅ Good - use shared Card component
   <Card>
     <div className="stat-card">
       <div className="stat-value">{value}</div>
       <div className="stat-label">{label}</div>
     </div>
   </Card>
   ```

6. **Don't use inline HTML buttons**
   ```tsx
   // ❌ Bad
   <button onClick={handleClick}>Click</button>

   // ✅ Good
   <Button onClick={handleClick}>Click</Button>
   ```

7. **Don't fetch data without proper error handling**
   ```tsx
   // ❌ Bad
   const data = await fetch('/api/wards');

   // ✅ Good
   const { data, loading, error } = useApi({
     fetcher: (client, signal) => client.get('/v1/admin/wards', { signal }),
   });
   ```

---

## Refactoring Checklist

When migrating a legacy page to the modern stack:

### Layout & Structure
- [ ] Replace `SidebarLayout` → `DashboardLayout`
- [ ] Add proper page title to `DashboardLayout`
- [ ] Remove legacy layout imports

### Styling
- [ ] Remove `import { palette } from '../theme'`
- [ ] Replace all `palette.xxx` → `var(--color-xxx)`
- [ ] Replace hardcoded colors → CSS variables
- [ ] Replace `borderStyle` constants → `'1px solid var(--color-border)'`
- [ ] Create page-specific CSS file in `styles/`
- [ ] Import page CSS in `app/globals.css`
- [ ] Remove CSS modules if present (`.module.css` files)

### Components
- [ ] Replace HTML `<button>` → UI `<Button>` component
- [ ] Replace HTML `<input>` → UI `<Input>` component
- [ ] Use `<Card>` for containers
- [ ] Use `<Badge>` for status indicators
- [ ] Use `<Table>` components for data tables
- [ ] Use `<Modal>` for dialogs
- [ ] Use `<LoadingSpinner>` for loading states
- [ ] Use `<EmptyState>` for empty data

### Data Fetching
- [ ] Replace legacy fetch hooks → `useApi` hook
- [ ] Use `apiClient` from `lib/api-client.ts`
- [ ] Add proper TypeScript types for API responses
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Implement request cancellation with AbortSignal

### Types
- [ ] Import types from `types/models.ts`
- [ ] Use `ApiResponse<T>` or `PaginatedResponse<T>`
- [ ] Type all component state
- [ ] Type all props

### Testing
- [ ] Run `npm run build` to verify no build errors
- [ ] Run `tsc --noEmit` to verify TypeScript types
- [ ] Test all CRUD operations
- [ ] Test loading and error states
- [ ] Test responsive design

---

## File Structure

```
ops-web/
├── app/                                 # Next.js App Router
│   ├── globals.css                      # Global CSS imports
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Video monitoring (needs refactoring)
│   ├── dashboard/
│   │   └── page.tsx                     # ✅ Dashboard page (template)
│   ├── beneficiaries/
│   │   └── page.tsx                     # ✅ Beneficiaries management
│   ├── my-wards/
│   │   └── page.tsx                     # 🔄 My wards page
│   ├── emergencies/
│   │   └── page.tsx                     # ✅ Emergency tracking
│   ├── locations/
│   │   └── page.tsx                     # ✅ Location tracking
│   ├── login/
│   │   ├── page.tsx                     # Login page
│   │   └── callback/
│   │       └── page.tsx                 # OAuth callback
│   ├── select-organization/
│   │   └── page.tsx                     # Organization selection
│   ├── invite/
│   │   └── page.tsx                     # Invitation handling
│   ├── settings/
│   │   └── page.tsx                     # ✅ Settings page (#98)
│   ├── staff/
│   │   └── page.tsx                     # ✅ Staff management (#102)
│   └── stats/
│       └── page.tsx                     # ✅ Statistics page (#94)
│
├── components/
│   ├── ui/                              # Reusable UI components
│   │   ├── Button.tsx                   # Button component
│   │   ├── Input.tsx                    # Input component
│   │   ├── Card.tsx                   # Card component
│   │   ├── Badge.tsx                    # Badge component
│   │   ├── Table.tsx                    # Table components
│   │   ├── Modal.tsx                    # Modal component
│   │   ├── Select.tsx                   # Select dropdown (#107)
│   │   ├── IconButton.tsx               # Icon button (#107)
│   │   ├── SectionTitle.tsx             # Section title (#107)
│   │   ├── LoadingSpinner.tsx           # Loading spinner
│   │   └── EmptyState.tsx               # Empty state component
│   ├── layouts/                         # Layout components
│   │   ├── DashboardLayout.tsx          # Main app layout
│   │   ├── Sidebar.tsx                  # Navigation sidebar
│   │   └── PageHeader.tsx               # Page header
│   ├── dashboard/                       # Dashboard sub-components (#112)
│   │   ├── BulletinBoard.tsx
│   │   ├── EmergencyLog.tsx
│   │   └── DailyOperationsSummary.tsx
│   ├── monitoring/                      # Map monitoring (#115)
│   │   ├── MonitoringSidebar.tsx
│   │   ├── MonitoringStats.tsx
│   │   └── WardList.tsx
│   ├── staff/                           # Staff management (#106)
│   │   └── StaffCard.tsx
│   ├── video/                           # Video-specific components
│   │   ├── ControlBar.tsx
│   │   ├── VideoTiles.tsx
│   │   └── ...
│   ├── AuthGuard.tsx                    # Route protection
│   ├── CsvUploadModal.tsx               # CSV upload
│   ├── LocationMap.tsx                  # Map component
│   ├── DashboardCharts.tsx              # Dashboard charts
│   └── SidebarLayout.tsx                # ⚠️ Deprecated (re-exports DashboardLayout)
│
├── styles/
│   ├── theme.css                        # CSS variables (design tokens)
│   ├── tokens.ts                        # TypeScript design tokens
│   ├── components.css                   # UI component styles
│   ├── dashboard.css                    # Dashboard page styles
│   ├── beneficiaries.css                # Beneficiaries page styles
│   ├── my-wards.css                     # My-wards page styles
│   ├── stats.css                        # Stats page styles (#94)
│   ├── staff.css                        # Staff page styles (#102)
│   ├── settings.css                     # Settings page styles (#98)
│   └── monitoring.css                   # Map monitoring styles (#115)
│
├── types/
│   ├── models.ts                        # Core data models
│   ├── api.ts                           # API types
│   ├── common.ts                        # Common types
│   ├── dashboard.ts                     # Dashboard-specific types
│   └── room.ts                          # LiveKit room types
│
├── hooks/
│   ├── useApi.ts                        # ✅ Modern data fetching hook
│   ├── useAuthedFetch.ts                # ⚠️ Legacy (being phased out)
│   └── useAdminApi.ts                   # ⚠️ Legacy (being phased out)
│
├── contexts/
│   └── AuthContext.tsx                  # Authentication context
│
├── lib/
│   ├── api-client.ts                    # ✅ Centralized API client
│   └── utils.ts                         # Utility functions
│
└── utils/
    └── cn.ts                            # className utility
```

### Key Files to Reference

- **Layout**: `components/layouts/DashboardLayout.tsx`
- **UI Components**: `components/ui/*.tsx`
- **Styling**: `styles/theme.css`, `styles/tokens.ts`
- **Data Fetching**: `hooks/useApi.ts`, `lib/api-client.ts`
- **Types**: `types/models.ts`, `types/api.ts`
- **Template Page**: `app/dashboard/page.tsx` (best example to follow)

---

## Additional Resources

### Example Pages

- **Best Template**: [app/dashboard/page.tsx](../app/dashboard/page.tsx) - Fully modernized, follows all best practices
- **Table with CRUD**: [app/beneficiaries/page.tsx](../app/beneficiaries/page.tsx) - Complete data table implementation
- **Map Integration**: [app/emergencies/page.tsx](../app/emergencies/page.tsx) - Shows map component usage

### Design Documentation

- **Design Tokens**: [styles/tokens.ts](../styles/tokens.ts) - Complete token system
- **CSS Variables**: [styles/theme.css](../styles/theme.css) - All available CSS variables
- **Component Styles**: [styles/components.css](../styles/components.css) - UI component CSS classes

### API Documentation

- **API Client**: [lib/api-client.ts](../lib/api-client.ts) - HTTP client implementation
- **useApi Hook**: [hooks/useApi.ts](../hooks/useApi.ts) - Data fetching hook

---

## Getting Help

If you have questions or need clarification:

1. **Check existing pages**: Look at `app/dashboard/page.tsx` or `app/beneficiaries/page.tsx` for examples
2. **Review components**: Check `components/ui/` for available UI components
3. **Check types**: Review `types/models.ts` for data model definitions
4. **Consult this guide**: This document covers all standard patterns

---

## Refactoring Status

### ✅ Completed Phases

- **Phase 1**: Design System (tokens, CSS variables)
- **Phase 2**: Layout System (DashboardLayout)
- **Phase 3**: State Management (AuthContext, api-client)
- **Phase 4**: Type Definitions
- **Phase 5.1**: Dashboard Page (template)
- **Phase 5.2**: Beneficiaries Page
- **Phase 5.3**: My-Wards Page
- **Phase 5.4**: Stats Page (#94)
- **Phase 5.5**: Staff Page (#102)
- **Phase 5.6**: Settings Page (#98)
- **Phase 5.7**: Locations/Map Monitoring (#115)

### 🔄 In Progress

- **DetailModal Tabs**: Refactoring DetailModal to use tabbed navigation

### ❌ Remaining Work

- **Video Monitoring Page**: (`app/page.tsx`) - Complex LiveKit integration
- **Cleanup**: Remove or archive `app/theme.ts` after video page refactoring

---

**Last Updated**: 2026-01-11
**Version**: 2.1
