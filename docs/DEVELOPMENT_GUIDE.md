# 🎨 Design System & Development Guide

> Reference guide for developing pages in ops-web, based on patterns established during the Phase 5 refactoring.

## Quick Start

### Creating a New Page

```tsx
// 1. Use DashboardLayout (not SidebarLayout)
import DashboardLayout from '../../components/layouts/DashboardLayout';

// 2. Use UI components
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

export default function MyPage() {
  return (
    <DashboardLayout title="페이지 제목">
      {/* Page content */}
    </DashboardLayout>
  );
}
```

---

## UI Components (`components/ui/`)

| Component | Import | Key Props |
|-----------|--------|-----------|
| **Button** | `import Button from '../../components/ui/Button'` | `variant`: primary/secondary/danger/ghost, `size`: sm/md/lg, `loading` |
| **Badge** | `import Badge from '../../components/ui/Badge'` | `variant`: default/warning/danger/success/info, `dot`, `size` |
| **Input** | `import Input from '../../components/ui/Input'` | `label`, `error`, `helperText`, `fullWidth` |
| **Card** | `import Card from '../../components/ui/Card'` | `padding`: none/sm/md/lg, `hoverable` |
| **Table** | Named exports | `selected` on TableRow |

---

## CSS Variables (from `styles/theme.css`)

### Colors
```css
/* Primary */
var(--color-primary)        /* #8FA963 - Damso Green */
var(--color-primary-dark)   /* #4A5D23 - Deep Moss */
var(--color-primary-light)  /* #E9F0DF */

/* Status */
var(--color-danger-main)    /* Red for errors/warnings */
var(--color-warning-main)   /* Orange for caution */
var(--color-success-main)   /* Green for success */

/* Backgrounds */
var(--color-bg)             /* #FBFDF9 - Cream Rice */
var(--color-panel)          /* White panels */
var(--color-border)         /* Border color */

/* Text */
var(--color-text-muted)     /* Muted/secondary text */
var(--color-text-soft)      /* Softer text */
```

### Shadows
```css
var(--shadow-sm)
var(--shadow-lifted)
var(--shadow-raised)
```

### Usage in Inline Styles
```tsx
style={{ color: 'var(--color-primary-dark)', border: '1px solid var(--color-border)' }}
```

---

## Page-Specific CSS Files

Create page-specific styles in `styles/`:

| Page | CSS File |
|------|----------|
| Dashboard | `styles/dashboard.css` |
| Beneficiaries | `styles/beneficiaries.css` |
| My-Wards | `styles/my-wards.css` |

**Import in `app/globals.css`:**
```css
@import '../styles/my-new-page.css';
```

---

## Patterns to Follow

### ✅ Do
- Use `DashboardLayout` with `title` prop
- Use CSS variables for colors: `var(--color-primary-dark)`
- Use `components/ui/*` for buttons, inputs, badges, tables
- Create page-specific CSS in `styles/`

### ❌ Don't
- Use `SidebarLayout` (deprecated)
- Use `palette` from `app/theme.ts` (legacy)
- Use hardcoded colors like `#4A5D23`
- Use Tailwind classes (project policy: No Tailwind)

---

## Refactoring Checklist (for existing pages)

When migrating a legacy page:

1. [ ] Replace `SidebarLayout` → `DashboardLayout`
2. [ ] Remove `import { palette } from '../theme'`
3. [ ] Replace `palette.xxx` → `var(--color-xxx)` in styles
4. [ ] Replace `borderStyle` → `'1px solid var(--color-border)'`
5. [ ] Replace HTML `<button>` → `<Button>` component
6. [ ] Run `tsc --noEmit` to verify

---

## File Structure

```
ops-web/
├── app/
│   ├── globals.css          # Global imports
│   ├── layout.tsx           # Root layout
│   └── [page]/
│       └── page.tsx
├── components/
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Table.tsx
├── styles/
│   ├── theme.css            # CSS variables
│   ├── components.css       # UI component styles
│   └── [page].css           # Page-specific styles
└── types/
    └── models.ts            # Shared type definitions
```
