import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';

/**
 * 통계/리포트 페이지
 *
 * TODO: 향후 구현 예정
 * - 대상자 통계 리포트
 * - 응급 상황 통계
 * - 디바이스 사용 현황
 * - 월간/주간 리포트 생성
 */
export default function StatsPage() {
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
                    통계/리포트
                </h1>
                <p
                    style={{ margin: '6px 0 0', color: "var(--color-text-muted)", fontSize: '14px' }}
                >
                    대상자 통계 및 리포트를 확인하고 내보내기 할 수 있습니다.
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
                        📊
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
