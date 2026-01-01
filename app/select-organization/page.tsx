"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PROVINCES, getSigunguList, getDongList } from "./korea-regions";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SelectOrganizationPage() {
  const router = useRouter();
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [dong, setDong] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("admin_access_token");
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const adminInfo = localStorage.getItem("admin_info");
    if (adminInfo) {
      const admin = JSON.parse(adminInfo);
      if (admin.organizationId) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const sigunguList = getSigunguList(sido);
  const dongList = getDongList(sido, sigungu);

  const handleSubmit = async () => {
    if (!sido || !sigungu) {
      setError("시/도와 시/군/구를 모두 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // 읍/면/동이 선택되었으면 포함, 아니면 시/군/구까지만
    const organizationName = dong
      ? `${sido} ${sigungu} ${dong} 관제센터`
      : `${sido} ${sigungu} 관제센터`;

    try {
      const accessToken = localStorage.getItem("admin_access_token");

      // 조직 생성 또는 조회
      const response = await fetch(`${API_BASE}/admin/organizations/find-or-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: organizationName }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_info");
          window.location.href = "/login";
          return;
        }
        const data = await response.json();
        throw new Error(data.message || "조직 생성에 실패했습니다.");
      }

      const { organization } = await response.json();

      // admin 조직 업데이트
      const updateResponse = await fetch(`${API_BASE}/admin/me/organization`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ organizationId: organization.id }),
      });

      if (!updateResponse.ok) {
        if (updateResponse.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_info");
          window.location.href = "/login";
          return;
        }
        const data = await updateResponse.json();
        throw new Error(data.message || "조직 선택에 실패했습니다.");
      }

      // admin_info 업데이트
      const adminInfo = localStorage.getItem("admin_info");
      if (adminInfo) {
        const admin = JSON.parse(adminInfo);
        admin.organizationId = organization.id;
        admin.organizationName = organization.name;
        localStorage.setItem("admin_info", JSON.stringify(admin));
      }

      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectStyle = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    backgroundColor: "white",
    color: "#1f2937",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "20px",
  };

  const disabledSelectStyle = {
    ...selectStyle,
    backgroundColor: "#f3f4f6",
    cursor: "not-allowed",
  };

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
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}>
            관제센터 선택
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#6b7280" }}>
            소속 지역을 선택해주세요
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "24px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          {/* 시/도 선택 */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
              시/도
            </label>
            <select
              value={sido}
              onChange={(e) => {
                setSido(e.target.value);
                setSigungu("");
                setDong("");
              }}
              style={selectStyle}
            >
              <option value="">시/도를 선택하세요</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 시/군/구 선택 */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
              시/군/구
            </label>
            <select
              value={sigungu}
              onChange={(e) => {
                setSigungu(e.target.value);
                setDong("");
              }}
              disabled={!sido}
              style={sido ? selectStyle : disabledSelectStyle}
            >
              <option value="">시/군/구를 선택하세요</option>
              {sigunguList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 읍/면/동 선택 */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
              읍/면/동 <span style={{ fontSize: "12px", color: "#9ca3af" }}>(선택)</span>
            </label>
            <select
              value={dong}
              onChange={(e) => setDong(e.target.value)}
              disabled={!sigungu}
              style={sigungu ? selectStyle : disabledSelectStyle}
            >
              <option value="">읍/면/동을 선택하세요</option>
              {dongList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 선택된 관제센터 미리보기 */}
        {sido && sigungu && (
          <div
            style={{
              padding: "16px",
              marginBottom: "24px",
              backgroundColor: "#eff6ff",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>선택된 관제센터</p>
            <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "600", color: "#1e40af" }}>
              {dong ? `${sido} ${sigungu} ${dong} 관제센터` : `${sido} ${sigungu} 관제센터`}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!sido || !sigungu || isSubmitting}
          style={{
            width: "100%",
            padding: "14px 20px",
            backgroundColor: sido && sigungu ? "#3b82f6" : "#9ca3af",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: sido && sigungu ? "pointer" : "not-allowed",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "처리 중..." : "선택 완료"}
        </button>
      </div>
    </div>
  );
}
