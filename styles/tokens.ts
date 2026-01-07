/**
 * Design Tokens
 *
 * Damso 디자인 시스템의 기본 토큰 정의
 * DESIGN_GUIDE_V2.MD 기반
 */

export const colors = {
  // Nature Palette (핵심 컬러)
  primary: {
    main: '#8FA963',      // Damso Green
    dark: '#4A5D23',      // Deep Moss (Foreground)
    light: '#C2D5A8',     // Soft Sprout (Secondary)
  },

  background: {
    main: '#F7F9F2',      // Cream Rice
    elevated1: '#F0F5E8', // 1단계 elevation
    elevated2: '#E9F0DF', // 2단계 elevation
  },

  // Semantic Colors
  semantic: {
    warning: '#F59E0B',   // Amber-500
    danger: '#EF4444',    // Red-500
    safe: '#10B981',      // Emerald-500
  },

  // UI Colors
  panel: {
    main: '#FFFFFF',
    strong: '#FFFFFF',
  },

  border: {
    main: '#E9F0DF',
    strong: '#C2D5A8',
  },

  text: {
    primary: '#4A5D23',
    secondary: '#4A5D23',
    muted: '#64748B',
    soft: '#94A3B8',
  },

  // Accent Colors
  accent: {
    main: '#8FA963',
    strong: '#4A5D23',
    soft: 'rgba(143, 169, 99, 0.16)',
  },

  // Status Colors (상세)
  status: {
    danger: {
      main: '#EF4444',
      soft: '#FEF2F2',
      border: '#FCA5A5',
    },
    warning: {
      main: '#F59E0B',
      soft: '#FFF7ED',
    },
    success: {
      main: '#22C55E',
      soft: '#ECFDF5',
      dark: '#059669',
    },
  },
} as const;

/**
 * Typography Tokens
 * DESIGN_GUIDE_V2 기준: Body 16px 이상
 */
export const typography = {
  // Font Sizes
  fontSize: {
    h1: '30px',         // Page Title (~text-3xl)
    h2: '22px',         // Section Header (~text-2xl)
    body: '16px',       // Body (text-base)
    value: '18px',      // Value/Primary Text (16~19px)
    label: '16px',      // Label/Caption (14~16px)
    caption: '14px',    // Muted/Meta
    small: '12px',      // Small text
  },

  // Font Weights
  fontWeight: {
    black: 900,         // H1
    bold: 700,          // H2, Value
    semibold: 600,      // Label
    medium: 500,        // Body
    regular: 400,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

/**
 * Spacing Tokens
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
} as const;

/**
 * Border Radius Tokens
 * DESIGN_GUIDE_V2: 카드는 24~32px 범위
 */
export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  full: '9999px',
} as const;

/**
 * Shadow Tokens
 */
export const shadows = {
  sm: '0 1px 3px rgba(15, 23, 42, 0.08)',         // 기본 카드
  md: '0 2px 8px rgba(15, 23, 42, 0.12)',         // 강조 카드
  lg: '0 10px 30px rgba(15, 23, 42, 0.18)',       // 모달
  raised: '0 6px 16px rgba(15, 23, 42, 0.08)',
  lifted: '0 6px 18px rgba(15, 23, 42, 0.08)',
  floating: '0 4px 20px rgba(0, 0, 0, 0.08)',     // ControlBar

  // Semantic Shadows
  dangerGlow: '0 10px 30px rgba(220, 38, 38, 0.1)',
  dangerStrong: '0 10px 30px rgba(220, 38, 38, 0.18)',
} as const;

/**
 * Overlay Tokens
 */
export const overlays = {
  scrim: 'rgba(15, 23, 42, 0.4)',
  modalBackdrop: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Breakpoints (반응형)
 */
export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

/**
 * Component Specific Tokens
 */
export const components = {
  button: {
    minHeight: '40px',      // h-10 이상
    fontSize: {
      default: '16px',
      large: '18px',
    },
    borderRadius: borderRadius.md,
  },

  card: {
    borderRadius: {
      default: borderRadius['2xl'],  // 24px
      large: borderRadius['4xl'],    // 32px
    },
    padding: {
      default: spacing.xl,           // 20px
      large: spacing['3xl'],         // 28px
    },
    shadow: shadows.sm,
  },

  modal: {
    sizes: {
      sm: '600px',
      md: '800px',
      lg: '1000px',
      xl: '1200px',
    },
    maxWidth: '1200px',              // 기본값 (DESIGN_GUIDE_V2)
    background: '#FBFDF9',           // 크림 톤
    borderRadius: borderRadius.xl,   // 20px
    label: {
      fontSize: typography.fontSize.label,    // 16px
      fontWeight: typography.fontWeight.semibold,
    },
    value: {
      fontSize: typography.fontSize.value,    // 18px
      fontWeight: typography.fontWeight.bold,
    },
  },

  sidebar: {
    width: '240px',
    widthCollapsed: '64px',
  },
} as const;

/**
 * 전체 토큰 export
 */
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  overlays,
  breakpoints,
  components,
} as const;

export type Tokens = typeof tokens;
