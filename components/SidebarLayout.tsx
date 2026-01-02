'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useCallback, useState } from 'react';
import AuthGuard from './AuthGuard';
import { useSessionMonitor } from '../hooks/useSessionMonitor';
import CsvUploadModal from './CsvUploadModal';
import { CleanRow } from './CsvUploadPanel';
import { ManualWardPayload } from './ManualWardForm';
import { AdminInfo } from '../types/admin';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12h18M3 6h18M3 18h18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconMonitor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect
      x="2"
      y="3"
      width="20"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M8 21h8M12 17v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="4"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="14"
      y="10"
      width="7"
      height="11"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="3"
      y="13"
      width="7"
      height="8"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 16V4M8 8l4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconLocation = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 21c4-4 6-7.5 6-10a6 6 0 1 0-12 0c0 2.5 2 6 6 10z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const IconEmergency = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 9v4M12 17h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const IconMyWards = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="17" cy="11" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M21 21v-1.5a3 3 0 0 0-3-3h-.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M16 17l5-5-5-5M21 12H9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const navItems = [
  { href: '/', label: '모니터링', icon: IconMonitor },
  { href: '/dashboard', label: '대시보드', icon: IconDashboard },
  { href: '/my-wards', label: '대상자 연동 현황', icon: IconMyWards },
  { href: '/locations', label: '위치정보', icon: IconLocation },
  { href: '/emergencies', label: '비상연락', icon: IconEmergency },
];

type SidebarLayoutProps = {
  children: ReactNode;
  title?: string;
  noPadding?: boolean;
};

export default function SidebarLayout({
  children,
  title,
  noPadding,
}: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);

  // 세션 모니터링 (토큰 만료 시점에 정확히 발동, 5분 전 경고)
  const { handleLogout } = useSessionMonitor({
    warningBeforeExpiryMs: 5 * 60 * 1000,
  });

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_info');
    router.replace('/login');
  }, [router]);

  const createWard = useCallback(
    async (payload: {
      organizationId: string;
      name: string;
      email: string;
      phone_number: string;
      birth_date?: string | null;
      address?: string | null;
      notes?: string | null;
    }) => {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        handleAuthError();
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_BASE}/v1/admin/wards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        throw new Error('인증이 만료되었습니다.');
      }

      if (!response.ok) {
        let message = '등록에 실패했습니다.';
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      return response.json();
    },
    [handleAuthError],
  );

  const handleCsvUpload = useCallback(
    async (_file: File, rows: CleanRow[]) => {
      if (uploading) return;
      const adminInfoRaw = localStorage.getItem('admin_info');
      const adminInfo: AdminInfo | null = adminInfoRaw
        ? JSON.parse(adminInfoRaw)
        : null;
      const organizationId = adminInfo?.organizationId;

      if (!organizationId) {
        alert('조직을 먼저 선택해주세요. (조직 등록/선택 후 다시 시도)');
        return;
      }

      setUploading(true);
      setUploadProgress({ processed: 0, total: rows.length });
      let success = 0;
      const failures: string[] = [];
      const markProcessed = () =>
        setUploadProgress(prev =>
          prev
            ? {
                ...prev,
                processed: Math.min(prev.processed + 1, prev.total),
              }
            : prev,
        );

      const concurrency = 5;
      let currentIndex = 0;

      const workers = Array.from({ length: concurrency }, async () => {
        while (true) {
          const index = currentIndex;
          currentIndex += 1;
          const row = rows[index];
          if (!row) break;

          try {
            await createWard({
              organizationId,
              name: row.name,
              email: row.email,
              phone_number: row.phone_number,
              birth_date: row.birth_date || null,
              address: row.address || null,
              notes: row.notes || null,
            });
            success += 1;
          } catch (error) {
            failures.push(
              `${row.email || row.name || '알 수 없음'}: ${
                (error as Error).message
              }`,
            );
          }
          markProcessed();
        }
      });

      await Promise.all(workers);

      setUploading(false);
      setUploadProgress(null);

      if (failures.length === 0) {
        alert(`CSV 업로드 완료: ${success}건 등록되었습니다.`);
        window.location.reload();
        return;
      }

      const failurePreview = failures.slice(0, 5).join('\n');
      alert(
        `일부 실패: 성공 ${success}건, 실패 ${failures.length}건\n` +
          `${failurePreview}${failures.length > 5 ? '\n...더 있습니다.' : ''}`,
      );
      if (success > 0) {
        window.location.reload();
      }
    },
    [createWard, uploading],
  );

  const handleManualSubmit = useCallback(
    async (payload: ManualWardPayload) => {
      if (uploading) {
        throw new Error('이미 등록 작업이 진행 중입니다.');
      }
      const adminInfoRaw = localStorage.getItem('admin_info');
      const adminInfo: AdminInfo | null = adminInfoRaw
        ? JSON.parse(adminInfoRaw)
        : null;
      const organizationId = adminInfo?.organizationId;

      if (!organizationId) {
        throw new Error(
          '조직을 먼저 선택해주세요. (조직 등록/선택 후 다시 시도)',
        );
      }

      setUploading(true);
      try {
        await createWard({
          organizationId,
          name: payload.name,
          email: payload.email,
          phone_number: payload.phone_number,
          birth_date: payload.birth_date || null,
          address: payload.address || null,
          notes: null,
        });
        alert('피보호자가 등록되었습니다.');
        window.location.reload();
      } catch (error) {
        throw new Error((error as Error).message || '등록에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [createWard, uploading],
  );

  return (
    <AuthGuard>
      {/* Toggle Button (when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => {
            console.log('[DEBUG] Menu button clicked - opening sidebar');
            setSidebarCollapsed(false);
          }}
          style={{
            position: 'fixed',
            top: '16px',
            left: '8px',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: 'white',
            display: 'grid',
            placeItems: 'center',
            color: '#475569',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 9999,
          }}
        >
          <IconMenu />
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          transform: sidebarCollapsed ? 'translateX(-240px)' : 'translateX(0)',
          transition: 'transform 200ms ease',
          zIndex: 9999,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background:
                  'conic-gradient(from 120deg, #3b82f6, #1e40af, #22c55e, #3b82f6)',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.12)',
              }}
            />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              담소 관제센터
            </span>
          </Link>
          <button
            onClick={() => {
              console.log('[DEBUG] Close button clicked - collapsing sidebar');
              setSidebarCollapsed(true);
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              display: 'grid',
              placeItems: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <IconClose />
          </button>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  console.log(
                    '[DEBUG] Nav button clicked, navigating to:',
                    item.href,
                  );
                  router.push(item.href);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#3b82f6' : '#475569',
                  backgroundColor: isActive
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'transparent',
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }
                }}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '16px 12px',
          }}
        >
          <button
            onClick={() => {
              console.log(
                '[DEBUG] Register CSV button clicked - opening modal',
              );
              setIsCsvModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 14px',
              marginBottom: '8px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1f2937',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#1f2937';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <IconUpload />
            <span>피보호자 등록</span>
          </button>
          <div
            style={{
              height: '1px',
              backgroundColor: '#e2e8f0',
              marginBottom: '10px',
              marginTop: '6px',
            }}
          />
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <IconLogout />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? 0 : '240px',
          minHeight: '100vh',
          height: noPadding ? '100vh' : undefined,
          display: noPadding ? 'flex' : undefined,
          flexDirection: noPadding ? 'column' : undefined,
          transition: 'margin-left 200ms ease',
        }}
      >
        {/* Header */}
        {title && (
          <header
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '20px 28px',
              position: 'sticky',
              top: 0,
              zIndex: 40,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              {title}
            </h1>
          </header>
        )}

        {/* Page Content */}
        <div
          style={
            noPadding
              ? {
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }
              : { padding: '24px 28px' }
          }
        >
          {children}
        </div>
      </main>

      {/* CSV Upload Modal */}
      <CsvUploadModal
        open={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onUpload={handleCsvUpload}
        onManualSubmit={handleManualSubmit}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />
    </AuthGuard>
  );
}
