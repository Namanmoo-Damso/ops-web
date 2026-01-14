import type { Metadata } from 'next';
  import Script from 'next/script';

  export const metadata: Metadata = {
    title: '담소 - 어르신 초대',
  };

  const fallbackScript = `(function() {
    const ua = navigator.userAgent;
    const currentUrl = window.location.href;

    // 카카오 인앱브라우저 감지 → Safari로 열기
    if (ua.includes('KAKAOTALK')) {
      window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentUrl);
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/.test(ua);
    const loadingStatus = document.getElementById('loadingStatus');
    const fallbackUI = document.getElementById('fallbackUI');
    const retryLink = document.getElementById('retryLink');

    function showFallback() {
      if (loadingStatus) {
        loadingStatus.style.display = 'none';
      }
      if (fallbackUI) {
        fallbackUI.classList.add('show');
      }
    }

    if (retryLink) {
      retryLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.reload();
      });
    }

    if (!isMobile) {
      showFallback();
    } else {
      // 딥링크 시도
      const params = new URLSearchParams(window.location.search);
      const deepLink = 'damso://invite?' + params.toString();
      window.location.href = deepLink;

      // 앱 없으면 fallback
      setTimeout(showFallback, 3000);
    }
  })();`;

  export default function InvitePage() {
    return (
      <>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #4A90A4 0%, #2D5A6B 100%);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
          }
          .container { max-width: 340px; width: 100%; }
          .logo {
            width: 100px; height: 100px;
            background: white;
            border-radius: 24px;
            margin: 0 auto 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
          }
          h1 { font-size: 26px; font-weight: 700; margin-bottom: 12px; }
          .subtitle {
            font-size: 16px;
            opacity: 0.9;
            line-height: 1.5;
            margin-bottom: 40px;
          }
          .status {
            background: rgba(255,255,255,0.15);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .spinner {
            width: 32px; height: 32px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .status-text { font-size: 15px; opacity: 0.9; }
          .fallback { display: none; }
          .fallback.show { display: block; }
          .message {
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            font-size: 15px;
            line-height: 1.6;
          }
          .help { margin-top: 32px; font-size: 13px; opacity: 0.7; }
          .help a { color: white; text-decoration: underline; }
        `}</style>

        <div className="container">
          <div className="logo">🏠</div>
          <h1>담소에 초대되었습니다</h1>
          <p className="subtitle">
            보호자님이 연결을 요청했습니다.
            <br />
            앱에서 간편하게 가입을 완료해주세요.
          </p>

          <div className="status" id="loadingStatus">
            <div className="spinner" />
            <p className="status-text">앱을 여는 중입니다...</p>
          </div>

          <div className="fallback" id="fallbackUI">
            <div className="message">
              📱 담소 앱이 설치되어 있지 않습니다.
              <br />
              <br />
              TestFlight에서 앱을 설치한 후
              <br />
              이 링크를 다시 클릭해주세요.
            </div>
            <p className="help">
              이미 설치하셨나요? <a href="#" id="retryLink">다시 시도</a>
            </p>
          </div>

          <p className="help">문의: support@sodam.store</p>
        </div>

        <Script id="invite-fallback" strategy="afterInteractive">
          {fallbackScript}
        </Script>
      </>
    );
  }