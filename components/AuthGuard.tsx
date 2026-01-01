"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type AuthGuardProps = {
  children: React.ReactNode;
};

// 인증이 필요없는 페이지들
const PUBLIC_PATHS = ["/login", "/login/callback"];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 공개 페이지는 인증 체크하지 않음
    if (PUBLIC_PATHS.includes(pathname)) {
      setIsChecking(false);
      setIsAuthenticated(true);
      return;
    }

    const accessToken = localStorage.getItem("admin_access_token");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    // 토큰이 있으면 인증됨
    setIsAuthenticated(true);
    setIsChecking(false);
  }, [pathname, router]);

  // 체크 중일 때 로딩 표시
  if (isChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e2e8f0",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: "#64748b", fontSize: "14px" }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
