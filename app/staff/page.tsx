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
        <DashboardLayout title="직원관리">
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
                        직원관리
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
