'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

// OAuth 설정
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
  const { isAuthenticated, login } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopupOverlay, setShowPopupOverlay] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Show generic message instead of raw error
      setError('로그인 과정에서 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }, [searchParams]);

  // Generate and store state for CSRF protection
  const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);
    return state;
  };

  const getRedirectUri = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/login/callback`;
  };

  const handleGoogleLogin = () => {
    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Configuration Missing');
      }

      const state = generateState();
      const redirectUri = getRedirectUri();

      const googleAuthUrl = new URL(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set('redirect_uri', `${redirectUri}?provider=google`);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');
      googleAuthUrl.searchParams.set('state', state);

      console.log('[Login] Opening popup for Google OAuth');

      // Show overlay to indicate popup is open
      setShowPopupOverlay(true);
      setIsLoading(true);

      // Center the popup on screen
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      // Open OAuth in popup instead of redirect
      const popup = window.open(
        googleAuthUrl.toString(),
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      console.log('[Login] Popup object:', popup);

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setError('팝업이 차단되었습니다. 팝업을 허용해주세요.');
        setIsLoading(false);
        setShowPopupOverlay(false);
        return;
      }

      // Listen for message from popup
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'oauth-success') {
          window.removeEventListener('message', handleMessage);
          setShowPopupOverlay(false);

          // Login with the received credentials
          login(event.data.accessToken, event.data.refreshToken, event.data.admin);

          // Redirect based on organization
          if (event.data.hasOrganization) {
            router.replace('/dashboard');
          } else {
            router.replace('/select-organization');
          }
        } else if (event.data.type === 'oauth-error') {
          window.removeEventListener('message', handleMessage);
          setShowPopupOverlay(false);
          setError(event.data.message || '로그인 처리에 실패했습니다.');
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup if popup is closed manually
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setShowPopupOverlay(false);
          setIsLoading(false);
        }
      }, 500);
    } catch (err) {
      console.error('[Login] Google login error');
      setError('로그인 설정을 불러오는 중 문제가 발생했습니다.');
      setShowPopupOverlay(false);
      setIsLoading(false);
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
        position: 'relative',
      }}
    >
      {/* Popup overlay - shown when OAuth popup is open */}
      {showPopupOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                border: '4px solid #E9F0DF',
                borderTopColor: '#8FA963',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style jsx>{`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#4A5D23' }}>
              Google 로그인 진행 중
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              팝업 창에서 로그인을 완료해주세요
            </p>
          </div>
        </div>
      )}


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

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            이동 중...
          </div>
        ) : (
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
        )}
      </div>
    </div>
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
