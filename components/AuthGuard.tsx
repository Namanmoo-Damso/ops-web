'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './ui';
import { colors } from '../styles/tokens';

type AuthGuardProps = {
  children: React.ReactNode;
};

// 인증이 필요없는 페이지들
const PUBLIC_PATHS = ['/login', '/login/callback'];

/**
 * AuthGuard component
 * 
 * Protects routes that require authentication.
 * Redirects to login if not authenticated.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // 공개 페이지는 인증 체크하지 않음
    if (PUBLIC_PATHS.includes(pathname)) {
      return;
    }

    // 로딩 중이면 아직 판단하지 않음
    if (isLoading) {
      return;
    }

    // 인증되지 않으면 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [pathname, router, isLoading, isAuthenticated]);

  // 공개 페이지는 바로 렌더링
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // 로딩 중일 때 로딩 표시 - LoadingSpinner 컴포넌트 사용
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background.main,
        }}
      >
        <LoadingSpinner size={40} />
      </div>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
