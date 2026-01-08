'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

// OAuth 설정 - 서버 컴포넌트나 env에서 관리하는 것이 좋지만 일단 유지
const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F9F2',
      }}
    >
      <p style={{ color: '#64748b' }}>로딩 중...</p>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const REDIRECT_URI =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login/callback`
      : '';

  const [error, setError] = useState<string | null>(null);

  // 이미 로그인되어 있으면 대시보드로 이동
  // AuthContext handles this partly, but being explicit here is fine if not using protected routes wrapper on login page.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // OAuth Error 처리
  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('OAuth 인증이 취소되었습니다.');
    }
  }, [searchParams]);

  const handleKakaoLogin = () => {
    try {
      if (!KAKAO_CLIENT_ID) {
        setError('카카오 클라이언트 ID가 설정되지 않았습니다.');
        return;
      }

      const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
      kakaoAuthUrl.searchParams.set('client_id', KAKAO_CLIENT_ID);
      kakaoAuthUrl.searchParams.set(
        'redirect_uri',
        `${REDIRECT_URI}?provider=kakao`,
      );
      kakaoAuthUrl.searchParams.set('response_type', 'code');
      kakaoAuthUrl.searchParams.set('scope', 'profile_nickname,account_email');

      window.location.href = kakaoAuthUrl.toString();
    } catch (err) {
      console.error('[Login] Kakao login error:', err);
      setError((err as Error).message);
    }
  };

  const handleGoogleLogin = () => {
    try {
      if (!GOOGLE_CLIENT_ID) {
        setError('Google 클라이언트 ID가 설정되지 않았습니다.');
        return;
      }

      const googleAuthUrl = new URL(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set(
        'redirect_uri',
        `${REDIRECT_URI}?provider=google`,
      );
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      window.location.href = googleAuthUrl.toString();
    } catch (err) {
      console.error('[Login] Google login error:', err);
      setError((err as Error).message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F9F2',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#4A5D23',
            }}
          >
            담소 관제센터
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '14px',
              color: '#64748b',
            }}
          >
            관리자 로그인
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '24px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Kakao Login */}
          <button
            onClick={handleKakaoLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 20px',
              backgroundColor: '#FEE500',
              color: '#191919',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            <KakaoIcon />
            카카오로 로그인
          </button>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 20px',
              backgroundColor: 'white',
              color: '#4A5D23',
              border: '1px solid #E9F0DF',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={e =>
              (e.currentTarget.style.backgroundColor = '#F7F9F2')
            }
            onMouseOut={e =>
              (e.currentTarget.style.backgroundColor = 'white')
            }
          >
            <GoogleIcon />
            Google로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.02944 2 1 5.36131 1 9.47368C1 12.1172 2.8377 14.4386 5.55185 15.7088L4.50555 19.4013C4.41748 19.6881 4.73941 19.9231 4.98666 19.7538L9.36334 16.8129C9.57055 16.8373 9.78273 16.8496 10 16.8496C14.9706 16.8496 19 13.4883 19 9.37591C19 5.26352 14.9706 2 10 2Z"
        fill="#191919"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M19.8055 10.2308C19.8055 9.55078 19.7499 8.86703 19.6332 8.19824H10.2051V11.9868H15.6016C15.3775 13.1868 14.6571 14.2251 13.6055 14.9018V17.3518H16.8238C18.7238 15.6091 19.8055 13.1318 19.8055 10.2308Z"
        fill="#4285F4"
      />
      <path
        d="M10.2051 19.7139C12.8996 19.7139 15.1718 18.8168 16.8238 17.3518L13.6055 14.9018C12.7113 15.4918 11.5551 15.8278 10.2051 15.8278C7.60018 15.8278 5.38518 14.0628 4.6002 11.6978H1.28223V14.2218C2.96073 17.4963 6.41602 19.7139 10.2051 19.7139Z"
        fill="#34A853"
      />
      <path
        d="M4.6002 11.6978C4.16602 10.4978 4.16602 9.2151 4.6002 8.01507V5.49109H1.28223C-0.0941016 8.14409 -0.0941016 11.5688 1.28223 14.2218L4.6002 11.6978Z"
        fill="#FBBC04"
      />
      <path
        d="M10.2051 3.88491C11.6162 3.8621 13.0051 4.37178 14.0551 5.35903L16.8793 2.53478C15.0829 0.860284 12.6884 -0.0555664 10.2051 -0.0222664C6.41602 -0.0222664 2.96073 2.19541 1.28223 5.47028L4.6002 8.01507C5.38518 5.64303 7.60018 3.88491 10.2051 3.88491Z"
        fill="#EA4335"
      />
    </svg>
  );
}
