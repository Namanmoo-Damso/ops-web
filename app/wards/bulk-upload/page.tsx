"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import SidebarLayout from "../../../components/SidebarLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type CSVRow = {
  email: string;
  phone_number: string;
  name: string;
  birth_date?: string;
  address?: string;
};

type UploadResult = {
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    reason: string;
  }>;
};

type UploadStage = "upload" | "preview" | "uploading" | "result";

export default function BulkUploadPage() {
  const [stage, setStage] = useState<UploadStage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: CSVRow = {
        email: "",
        phone_number: "",
        name: "",
      };

      headers.forEach((header, index) => {
        const value = values[index] || "";
        if (header === "email") row.email = value;
        else if (header === "phone_number" || header === "phone") row.phone_number = value;
        else if (header === "name") row.name = value;
        else if (header === "birth_date" || header === "birthdate") row.birth_date = value;
        else if (header === "address") row.address = value;
      });

      if (row.email || row.phone_number || row.name) {
        rows.push(row);
      }
    }

    return rows;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length === 0) {
          setError("CSV 파일에 유효한 데이터가 없습니다.");
          return;
        }

        setPreviewData(rows);
        setStage("preview");
      } catch {
        setError("CSV 파일 파싱에 실패했습니다.");
      }
    };
    reader.onerror = () => {
      setError("파일을 읽는 중 오류가 발생했습니다.");
    };
    reader.readAsText(csvFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    // Get admin info from localStorage
    const accessToken = localStorage.getItem("admin_access_token");
    const adminInfoStr = localStorage.getItem("admin_info");

    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    let organizationId: string | null = null;
    if (adminInfoStr) {
      try {
        const adminInfo = JSON.parse(adminInfoStr);
        organizationId = adminInfo.organizationId;
      } catch {
        // ignore parse error
      }
    }

    if (!organizationId) {
      setError("조직 정보가 없습니다. 조직을 먼저 선택해주세요.");
      return;
    }

    setStage("uploading");
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", organizationId);

      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(`${API_BASE}/v1/admin/wards/bulk-upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_info");
          window.location.href = "/login";
          return;
        }
        const data = await response.json();
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult({
        success: true,
        created: data.created || 0,
        skipped: data.skipped || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });
      setStage("result");
    } catch (err) {
      setError((err as Error).message);
      setStage("preview");
    }
  };

  const handleReset = () => {
    setStage("upload");
    setFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setResult(null);
    setError(null);
  };

  const downloadSampleCSV = () => {
    const sample = `email,phone_number,name,birth_date,address
ward1@example.com,010-1234-5678,김영희,1950-03-15,서울시 강남구
ward2@example.com,010-2345-6789,박철수,1948-07-22,부산시 해운대구
ward3@example.com,010-3456-7890,이순자,1952-11-08,대구시 수성구`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_wards.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorsCSV = () => {
    if (!result || result.errors.length === 0) return;

    const header = "row,email,reason\n";
    const rows = result.errors
      .map((e) => `${e.row},"${e.email}","${e.reason}"`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "upload_errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarLayout title="피보호자 일괄 등록">
      <div style={{ maxWidth: "800px" }}>
        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: "24px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "10px",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Upload Stage */}
        {stage === "upload" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? "#3b82f6" : "#d1d5db"}`,
                borderRadius: "12px",
                padding: "56px 24px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: isDragActive ? "#eff6ff" : "#f8fafc",
                transition: "all 0.2s",
              }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: "52px", marginBottom: "18px" }}>📁</div>
              <p style={{ fontSize: "16px", color: "#1e293b", marginBottom: "8px", fontWeight: 500 }}>
                {isDragActive
                  ? "파일을 놓으세요..."
                  : "파일을 드래그하거나 클릭하여 선택"}
              </p>
              <p style={{ fontSize: "14px", color: "#64748b" }}>
                CSV 파일만 업로드 가능합니다
              </p>
            </div>

            <div style={{ marginTop: "28px", textAlign: "center" }}>
              <button
                onClick={downloadSampleCSV}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#475569",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                📥 샘플 CSV 다운로드
              </button>
            </div>

            <div
              style={{
                marginTop: "28px",
                padding: "18px",
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                CSV 형식
              </p>
              <code
                style={{
                  display: "block",
                  marginTop: "10px",
                  fontSize: "13px",
                  color: "#475569",
                  fontFamily: "monospace",
                }}
              >
                email, phone_number, name, birth_date, address
              </code>
            </div>
          </div>
        )}

        {/* Preview Stage */}
        {stage === "preview" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "28px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "28px" }}>📄</span>
              <div>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                  {file?.name}
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                  {previewData.length}명 감지됨
                </p>
              </div>
            </div>

            {/* Preview Table */}
            <div
              style={{
                overflow: "auto",
                maxHeight: "320px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
                      이메일
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
                      전화번호
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
                      이름
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>
                        {row.email}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>
                        {row.phone_number}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>
                        {row.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewData.length > 10 && (
              <p style={{ marginTop: "14px", fontSize: "14px", color: "#64748b", textAlign: "center" }}>
                ... 외 {previewData.length - 10}명
              </p>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "28px",
              }}
            >
              <button
                onClick={handleReset}
                style={{
                  padding: "12px 28px",
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#475569",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                style={{
                  padding: "12px 28px",
                  backgroundColor: "#3b82f6",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                업로드
              </button>
            </div>
          </div>
        )}

        {/* Uploading Stage */}
        {stage === "uploading" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "56px 28px",
              border: "1px solid #e2e8f0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "52px", marginBottom: "18px" }}>⏳</div>
            <p style={{ fontSize: "16px", color: "#1e293b", marginBottom: "28px", fontWeight: 500 }}>
              업로드 중...
            </p>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                maxWidth: "420px",
                height: "10px",
                backgroundColor: "#e2e8f0",
                borderRadius: "5px",
                margin: "0 auto",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  backgroundColor: "#3b82f6",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p style={{ marginTop: "14px", fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
              {uploadProgress}%
            </p>
          </div>
        )}

        {/* Result Stage */}
        {stage === "result" && result && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "36px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "52px", marginBottom: "18px" }}>
                {result.failed === 0 ? "✅" : "⚠️"}
              </div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>
                업로드 완료
              </h2>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "18px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "10px",
                  textAlign: "center",
                  border: "1px solid #bbf7d0",
                }}
              >
                <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#22c55e" }}>
                  {result.created}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#475569", fontWeight: 500 }}>
                  성공
                </p>
              </div>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#fefce8",
                  borderRadius: "10px",
                  textAlign: "center",
                  border: "1px solid #fef08a",
                }}
              >
                <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#eab308" }}>
                  {result.skipped}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#475569", fontWeight: 500 }}>
                  건너뜀
                </p>
              </div>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#fef2f2",
                  borderRadius: "10px",
                  textAlign: "center",
                  border: "1px solid #fecaca",
                }}
              >
                <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#ef4444" }}>
                  {result.failed}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#475569", fontWeight: 500 }}>
                  실패
                </p>
              </div>
            </div>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <div
                style={{
                  marginBottom: "28px",
                  padding: "20px",
                  backgroundColor: "#fef2f2",
                  borderRadius: "10px",
                  border: "1px solid #fecaca",
                }}
              >
                <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 600, color: "#dc2626" }}>
                  실패 상세
                </p>
                <div style={{ maxHeight: "160px", overflow: "auto" }}>
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p
                      key={i}
                      style={{
                        margin: "6px 0",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                    >
                      - {err.row}행: {err.email} - {err.reason}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#64748b" }}>
                      ... 외 {result.errors.length - 10}건
                    </p>
                  )}
                </div>

                <button
                  onClick={downloadErrorsCSV}
                  style={{
                    marginTop: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    backgroundColor: "white",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  📥 실패 목록 다운로드
                </button>
              </div>
            )}

            {/* Done Button */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleReset}
                style={{
                  padding: "14px 36px",
                  backgroundColor: "#3b82f6",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
