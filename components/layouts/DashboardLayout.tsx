'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { colors, spacing } from '../../styles/tokens';
import { cn } from '../ui/utils';
import AuthGuard from '../AuthGuard';
import { useSessionMonitor } from '../../hooks/useSessionMonitor';
import CsvUploadModal from '../CsvUploadModal';
import { CleanRow } from '../CsvUploadPanel';
import { ManualWardPayload } from '../ManualWardForm';
import { Admin } from '../../types/models';
import Sidebar, { SIDEBAR_WIDTH_VALUE } from './Sidebar';
import Header, { HEADER_HEIGHT } from './Header';
import { API_BASE } from '../../lib/api-client';
import Toast, { type ToastType } from '../ui/Toast';

const SSE_INITIAL_RETRY_DELAY_MS = 1000;
const SSE_MAX_RETRY_DELAY_MS = 30000;
const SSE_RETRY_MULTIPLIER = 2;
const SSE_MAX_RETRY_ATTEMPTS = 8;

const getAdminToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
};

const buildSseUrl = (base: string) => {
  const token = getAdminToken();
  if (!token) return `${base}/v1/events/stream`;
  return `${base}/v1/events/stream?token=${encodeURIComponent(token)}`;
};

export interface DashboardLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Page title (displayed in header) */
  title?: string;
  /** Disable padding for full-bleed layouts */
  noPadding?: boolean;
  /** External CSV modal open state */
  csvModalOpen?: boolean;
  /** External CSV modal state change handler */
  onCsvModalOpenChange?: (open: boolean) => void;
  /** Additional className */
  className?: string;
}

/**
 * DashboardLayout component integrating Sidebar + Main content
 *
 * Includes AuthGuard, session monitoring, and CSV upload functionality
 */
const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      children,
      title,
      noPadding,
      csvModalOpen,
      onCsvModalOpenChange,
      className,
    },
    ref,
  ) => {
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [internalCsvModalOpen, setInternalCsvModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
      processed: number;
      total: number;
    } | null>(null);
    const [toast, setToast] = useState<{
      isOpen: boolean;
      message: string;
      type: ToastType;
    }>({ isOpen: false, message: '', type: 'success' });
    const eventSourceRef = useRef<EventSource | null>(null);
    const retryDelayRef = useRef(SSE_INITIAL_RETRY_DELAY_MS);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryCountRef = useRef(0);
    const sseMountedRef = useRef(false);

    const isCsvModalOpen = csvModalOpen ?? internalCsvModalOpen;
    const setCsvModalOpen = useCallback(
      (open: boolean) => {
        if (onCsvModalOpenChange) {
          onCsvModalOpenChange(open);
          return;
        }
        setInternalCsvModalOpen(open);
      },
      [onCsvModalOpenChange],
    );

    // Session monitoring (token expiry warning 5 minutes before)
    useSessionMonitor({
      warningBeforeExpiryMs: 5 * 60 * 1000,
    });

    // SSE 연결: 대상자 연동 완료 이벤트 수신 (전역 토스트)
    useEffect(() => {
      const apiBase = API_BASE;
      if (!apiBase) return;

      sseMountedRef.current = true;

      const connect = () => {
        if (!sseMountedRef.current) return;

        const existing = eventSourceRef.current;
        if (existing && existing.readyState !== EventSource.CLOSED) {
          return;
        }

        if (existing) {
          existing.close();
          eventSourceRef.current = null;
        }

        const sseUrl = buildSseUrl(apiBase);
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          retryDelayRef.current = SSE_INITIAL_RETRY_DELAY_MS;
          retryCountRef.current = 0;
        };

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data) as {
              type?: string;
              wardName?: string;
              organizationWardId?: string;
              organizationId?: string;
            };

            if (data.type === 'ward-registered' && data.wardName) {
              setToast({
                isOpen: true,
                message: `${data.wardName}님이 연동되었습니다`,
                type: 'success',
              });
              window.dispatchEvent(
                new CustomEvent('wardRegistered', { detail: data }),
              );
            }
          } catch (err) {
            console.error('[DashboardLayout] SSE parse error:', err);
          }
        };

        eventSource.onerror = () => {
          console.warn(
            '[DashboardLayout] SSE connection error, reconnecting...',
          );
          eventSource.close();
          eventSourceRef.current = null;

          if (!sseMountedRef.current) return;

          retryCountRef.current += 1;
          if (retryCountRef.current > SSE_MAX_RETRY_ATTEMPTS) {
            console.warn(
              '[DashboardLayout] SSE retry limit reached, giving up',
            );
            return;
          }

          const delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(
            retryDelayRef.current * SSE_RETRY_MULTIPLIER,
            SSE_MAX_RETRY_DELAY_MS,
          );

          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }

          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        };
      };

      connect();

      return () => {
        sseMountedRef.current = false;

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    }, []);

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
        gender?: string | null;
        diseases?: string | null;
        medication?: string | null;
        emergency_contact?: string | null;
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
        const adminInfo: Admin | null = adminInfoRaw
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
                gender: row.gender || null,
                diseases: row.diseases || null,
                medication: row.medication || null,
                emergency_contact: row.emergency_contact || null,
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
        const adminInfo: Admin | null = adminInfoRaw
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
            gender: payload.gender || null,
            diseases: payload.diseases || null,
            medication: payload.medication || null,
            emergency_contact: payload.emergency_contact || null,
            notes: payload.notes || null,
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

    const mainStyle: CSSProperties & {
      '--sidebar-width': string;
      '--header-height': string;
    } = {
      flex: 1,
      marginLeft: sidebarCollapsed ? 0 : SIDEBAR_WIDTH_VALUE,
      marginTop: HEADER_HEIGHT,
      '--sidebar-width': sidebarCollapsed ? '0px' : SIDEBAR_WIDTH_VALUE,
      '--header-height': HEADER_HEIGHT, // Set CSS variable for fixed position components
      backgroundColor: colors.background.main,
      minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
      height: noPadding ? `calc(100vh - ${HEADER_HEIGHT})` : undefined,
      display: noPadding ? 'flex' : undefined,
      flexDirection: noPadding ? 'column' : undefined,
      transition: 'margin-left 200ms ease',
    };

    return (
      <AuthGuard>
        {/* Global Header */}
        <Header
          onRegisterClick={() => setCsvModalOpen(true)}
          onNotificationsClick={() => {
            // TODO: Implement notifications
            console.log('Notifications clicked');
          }}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} headerHeight={HEADER_HEIGHT} />

        {/* Main Content */}
        <main ref={ref} className={cn(className)} style={mainStyle}>
          {/* Page Title Header */}
          {title && (
            <header
              style={{
                backgroundColor: colors.panel.main,
                padding: `${spacing.xl} ${spacing['3xl']}`,
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
                  color: colors.text.primary,
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
                : { padding: `${spacing['2xl']} ${spacing['3xl']}` }
            }
          >
            {children}
          </div>
        </main>

        {/* CSV Upload Modal */}
        <CsvUploadModal
          open={isCsvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          onUpload={handleCsvUpload}
          onManualSubmit={handleManualSubmit}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        {/* Global Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          isOpen={toast.isOpen}
          onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        />
      </AuthGuard>
    );
  },
);

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
