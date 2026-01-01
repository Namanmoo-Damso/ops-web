"use client";

import { useEffect, useCallback, useRef } from "react";

type SessionMonitorOptions = {
  warningBeforeExpiryMs?: number; // 만료 전 경고 시간 (기본: 5분)
  onExpired?: () => void; // 만료 시 콜백
  onWarning?: (remainingMs: number) => void; // 만료 임박 시 콜백
};

// JWT 토큰에서 payload 추출
function parseJwt(token: string): { exp?: number; iat?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// 토큰 만료 시간 가져오기 (ms)
function getTokenExpiry(token: string): number | null {
  const payload = parseJwt(token);
  if (payload?.exp) {
    return payload.exp * 1000; // seconds to ms
  }
  return null;
}

export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const {
    warningBeforeExpiryMs = 5 * 60 * 1000, // 5분 전 경고
    onExpired,
    onWarning,
  } = options;

  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_info");
    window.location.href = "/login";
  }, []);

  const clearTimers = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const setupTimers = useCallback(() => {
    clearTimers();

    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      // 토큰 없으면 바로 로그인으로
      handleLogout();
      return;
    }

    const expiry = getTokenExpiry(token);
    if (!expiry) {
      // 토큰 파싱 실패
      handleLogout();
      return;
    }

    const now = Date.now();
    const remainingMs = expiry - now;

    console.log(`[SessionMonitor] Token expires in ${Math.round(remainingMs / 1000)}s`);

    if (remainingMs <= 0) {
      // 이미 만료됨
      if (onExpired) {
        onExpired();
      } else {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
      }
      return;
    }

    // 만료 타이머 설정 (정확히 만료 시점에 발동)
    expiryTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      console.log("[SessionMonitor] Session expired!");
      if (onExpired) {
        onExpired();
      } else {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
      }
    }, remainingMs);

    // 경고 타이머 설정 (만료 N분 전)
    const warningTime = remainingMs - warningBeforeExpiryMs;
    if (warningTime > 0) {
      warningTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        const timeLeft = warningBeforeExpiryMs;
        console.log(`[SessionMonitor] Warning: ${Math.round(timeLeft / 60000)}min left`);
        if (onWarning) {
          onWarning(timeLeft);
        } else {
          const minutes = Math.ceil(timeLeft / 60000);
          const shouldLogout = confirm(
            `세션이 ${minutes}분 후 만료됩니다.\n\n계속 사용하시려면 '취소'를 누르세요.\n지금 로그아웃하시려면 '확인'을 누르세요.`
          );
          if (shouldLogout) {
            handleLogout();
          }
        }
      }, warningTime);
    }
  }, [clearTimers, handleLogout, onExpired, onWarning, warningBeforeExpiryMs]);

  useEffect(() => {
    mountedRef.current = true;

    // 초기 타이머 설정
    setupTimers();

    // 탭 활성화 시 타이머 재설정 (다른 탭에서 로그아웃했을 수 있음)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setupTimers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // storage 이벤트 (다른 탭에서 토큰 변경 감지)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_access_token") {
        if (!e.newValue) {
          // 다른 탭에서 로그아웃함
          handleLogout();
        } else {
          // 토큰 갱신됨 - 타이머 재설정
          setupTimers();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mountedRef.current = false;
      clearTimers();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setupTimers, clearTimers, handleLogout]);

  return { handleLogout, refreshTimers: setupTimers };
}
