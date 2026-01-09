import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';

/**
 * 직원관리 페이지
 *
 * TODO: 향후 구현 예정
 * - 직원 목록 조회
 * - 직원 추가/수정/삭제
 * - 권한 관리
 * - 활동 로그
 */
export default function StaffPage() {
    return (
        <DashboardLayout>
            {/* Page Header */}
            <div style={{ marginBottom: '20px' }}>
                <h1
                    style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: 700,
                        color: "var(--color-primary-dark)",
                    }}
                >
                    직원관리
                </h1>
                <p
                    style={{ margin: '6px 0 0', color: "var(--color-text-muted)", fontSize: '14px' }}
                >
                    직원 계정 및 권한을 관리합니다.
                </p>
            </div>

            <Card padding="lg">
                <div
                    style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '48px',
                            marginBottom: '16px',
                        }}
                    >
                        👥
                    </div>
                    <h2
                        style={{
                            fontSize: 'var(--font-size-h2)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: '8px',
                        }}
                    >
                        준비 중입니다
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-body)',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        이 페이지는 향후 구현 예정입니다.
                    </p>
                </div>
            </Card>
        </DashboardLayout>
    );
}
