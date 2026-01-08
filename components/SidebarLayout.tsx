/**
 * SidebarLayout - Backward Compatibility Export
 * 
 * Phase 2-1 리팩토링으로 DashboardLayout으로 이전되었습니다.
 * 기존 사용처의 호환성을 위해 re-export합니다.
 * 
 * @deprecated DashboardLayout을 직접 import하세요.
 * import { DashboardLayout } from '@/components/layouts';
 */

export { default } from './layouts/DashboardLayout';
export type { DashboardLayoutProps as SidebarLayoutProps } from './layouts/DashboardLayout';
