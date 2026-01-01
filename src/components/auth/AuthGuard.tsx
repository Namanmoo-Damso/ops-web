"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type AuthGuardProps = {
  children: React.ReactNode;
};

const PUBLIC_PATHS = ["/login", "/login/callback", "/onboarding/intro"];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 공개 페이지는 인증 체크하지 않음
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F2]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#E1EAD3] border-t-[#8FA963] rounded-full animate-spin" />
          <p className="text-[#6E7F4F] font-medium">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았으면 (리다이렉트 전) 아무것도 렌더링하지 않음
  if (!isAuthenticated && !PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return null;
  }

  return <>{children}</>;
}
