/**
 * UI Components Barrel Export
 *
 * 공통 UI 컴포넌트 중앙 export
 * 사용 예: import { Button, Input, Card, Badge } from '@/components/ui';
 */

export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { default as LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

/**
 * NOTE: Icon 컴포넌트는 Phase 5 페이지 리팩토링 시 추가 예정
 * 현재 components/Icons.tsx는 비디오 전용이므로 별도 유지
 */
