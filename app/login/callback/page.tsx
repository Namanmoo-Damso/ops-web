'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/useAuth';
import type { Admin } from '../../../types/models';

// API response types
interface OAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackContent />
    </Suspense>
  );
}

function LoadingSpinner() {
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
      <p style={{ color: '#64748b' }}>처리 중...</p>
    </div>
  );
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const provider = searchParams.get('provider');
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError('로그인 과정에서 오류가 발생했습니다.');
        return;
      }

      if (!provider || !code) {
        setStatus('error');
        setError('잘못된 요청입니다.');
        return;
      }

      // CSRF State Verification
      const savedState = sessionStorage.getItem('oauth_state');
      if (!state || state !== savedState) {
        setStatus('error');
        setError('보안 검증에 실패했습니다. (State Mismatch)');
        // Clear state to preventing replay
        sessionStorage.removeItem('oauth_state');
        return;
      }

      // Clear state after usage
      sessionStorage.removeItem('oauth_state');

      try {
        const redirectUri = `${window.location.origin}/login/callback?provider=${provider}`;

        const data = await apiClient.post<OAuthResponse>(
          '/admin/auth/oauth/code',
          { provider, code, redirectUri }, // Ensure request is exactly as server expects
          { skipAuth: true }
        );

        login(data.accessToken, data.refreshToken, data.admin);

        if (!data.admin.organizationId) {
          router.replace('/select-organization');
        } else {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('[Callback] Login failed'); // Log for dev
        setStatus('error');
        // Generic error message
        setError('로그인 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  if (status === 'error') {
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
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            ❌
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '20px', color: '#4A5D23' }}>
            로그인 실패
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8FA963',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

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
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
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
        <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
          로그인 처리 중...
        </p>
      </div>
    </div>
  );
}
