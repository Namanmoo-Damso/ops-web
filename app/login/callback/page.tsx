"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "";

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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
      }}
    >
      <p style={{ color: "#6b7280" }}>처리 중...</p>
    </div>
  );
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const provider = searchParams.get("provider");
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setStatus("error");
        setError("OAuth 인증이 취소되었습니다.");
        return;
      }

      if (!provider || !code) {
        setStatus("error");
        setError("잘못된 콜백 요청입니다.");
        return;
      }

      try {
        // 서버에서 authorization code를 access token으로 교환 후 로그인 처리
        const redirectUri = `${window.location.origin}/login/callback?provider=${provider}`;
        console.log("[Callback] Sending to server:", { provider, code: code.substring(0, 10) + "...", redirectUri });

        const response = await fetch(`${API_BASE}/admin/auth/oauth/code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, code, redirectUri }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "로그인에 실패했습니다.");
        }

        // 토큰 저장
        localStorage.setItem("admin_access_token", data.accessToken);
        localStorage.setItem("admin_refresh_token", data.refreshToken);
        localStorage.setItem("admin_info", JSON.stringify(data.admin));

        // 조직이 없으면 조직 선택 페이지로, 있으면 대시보드로 이동
        if (!data.admin.organizationId) {
          router.replace("/select-organization");
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        setStatus("error");
        setError((err as Error).message);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            ❌
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: "20px", color: "#1f2937" }}>
            로그인 실패
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            margin: "0 auto 16px",
            border: "4px solid #e5e7eb",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <p style={{ margin: 0, fontSize: "16px", color: "#6b7280" }}>
          로그인 처리 중...
        </p>
      </div>
    </div>
  );
}
