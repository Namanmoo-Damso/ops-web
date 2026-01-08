'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Grid2x2,
  Map,
  MapPin,
  MonitorPlay,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useApi } from '../../hooks/useApi';
import { Button, Card, Badge } from '../../components/ui';
import { colors, spacing, typography } from '../../styles/tokens';

// --- Types ---

type MyWardsStatsResponse = {
  stats?: {
    total: number;
    registered: number;
  };
};

type HeroCopy = {
  title: string;
  desc: ReactNode;
  action: ReactNode;
};

// --- Page Component ---

export default function DashboardPage() {
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, refetch } = useApi<MyWardsStatsResponse>({
    deps: [refreshKey],
    fetcher: (client, signal) => client.get('/v1/admin/my-wards', { signal }),
  });

  const totalCount =
    typeof data?.stats?.total === 'number' ? data.stats.total : 0;
  const linkedCount =
    typeof data?.stats?.registered === 'number' ? data.stats.registered : 0;
  const unlinkedCount = Math.max(totalCount - linkedCount, 0);

  const syncState =
    totalCount === 0
      ? 'empty'
      : unlinkedCount > 0
        ? 'needs_link'
        : 'all_linked';

  const heroCopy: HeroCopy = error
    ? {
      title: '연동 현황을 불러오지 못했습니다.',
      desc: (
        <>
          네트워크 상태를 확인한 뒤 다시 시도해주세요.
          <br />
          문제가 계속되면 관리자에게 문의하세요.
        </>
      ),
      action: (
        <Button variant="secondary" onClick={() => refetch()}>
          다시 시도하기
        </Button>
      ),
    }
    : loading
      ? {
        title: '연동 현황을 불러오는 중입니다.',
        desc: (
          <>
            최신 대상자 연동 정보를 확인하고 있습니다.
            <br />
            잠시만 기다려주세요.
          </>
        ),
        action: (
          <Button variant="secondary" disabled>
            불러오는 중...
          </Button>
        ),
      }
      : syncState === 'empty'
        ? {
          title: '아직 등록된 피보호자가 없습니다.',
          desc: (
            <>
              CSV 업로드 또는 수기 등록으로 바로 시작하세요.
              <br />
              등록이 완료되면 실시간 관제 기능을 사용할 수 있습니다.
            </>
          ),
          action: (
            <Button onClick={() => setCsvModalOpen(true)}>
              피보호자 등록하기
            </Button>
          ),
        }
        : syncState === 'needs_link'
          ? {
            title: `${unlinkedCount}명의 대상자가 아직 연동되지 않았습니다.`,
            desc: (
              <>
                대상자 연동 현황에서 보호자 연결을 완료해주세요.
                <br />
                연동이 완료되면 자동 관제 기능이 활성화됩니다.
              </>
            ),
            action: (
              <Link href="/my-wards">
                <Button>대상자 연동 현황으로 가기</Button>
              </Link>
            ),
          }
          : {
            title: `총 ${totalCount}명의 대상자가 등록되었습니다.`,
            desc: (
              <>
                전체 대상자 관리에서 상세 정보를 확인하고 관리하세요.
                <br />
                오늘도 담소의 관제로 안전하게 케어하세요.
              </>
            ),
            action: (
              <Link href="/beneficiaries">
                <Button>전체 대상자 관리</Button>
              </Link>
            ),
          };

  return (
    <DashboardLayout
      title="기관 통합 관제"
      csvModalOpen={csvModalOpen}
      onCsvModalOpenChange={setCsvModalOpen}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3xl'] }}>
        {error && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.status.danger.soft,
              color: colors.status.danger.main,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>연동 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</span>
            <Button variant="danger" size="sm" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <section
          style={{
            position: 'relative',
            background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
            borderRadius: '24px',
            padding: spacing['3xl'],
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 12px',
                borderRadius: '999px',
                marginBottom: spacing.lg,
              }}
            >
              <span
                style={{
                  backgroundColor: '#fff',
                  color: colors.primary.main,
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                NEW
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>시스템 설정 완료</span>
            </div>
            <h1
              style={{
                fontSize: typography.fontSize.h1,
                fontWeight: typography.fontWeight.black,
                marginBottom: spacing.md,
                lineHeight: 1.2,
              }}
            >
              {heroCopy.title}
            </h1>
            <p
              style={{
                fontSize: typography.fontSize.body,
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              {heroCopy.desc}
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>{heroCopy.action}</div>
        </section>

        {/* Feature Grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: spacing.xl,
          }}
        >
          <FeatureCard
            icon={<MonitorPlay size={22} />}
            cornerIcon={<Grid2x2 size={76} />}
            title="실시간 영상 모니터링"
            description="여러 어르신과의 통화 화면을 한눈에 확인합니다. 응급 상황 발생 시 해당 화면이 자동으로 팝업됩니다."
            actionLabel="모니터링 뷰 열기"
            href="/"
          />
          <FeatureCard
            icon={<MapPin size={22} />}
            cornerIcon={<Map size={76} />}
            title="지도 기반 위치 관제"
            description="등록된 120명의 거주지 위치가 지도에 매핑되었습니다. 지역별 현황과 이동 동선을 시각적으로 파악하세요."
            actionLabel="지도 뷰 열기"
            href="/locations"
          />
        </section>

        {/* Stats Section */}
        <section>
          <h2
            style={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Sparkles size={18} color={colors.semantic.warning} fill={colors.semantic.warning} /> 금일현황
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.lg,
            }}
          >
            <StatCard
              label="총 등록 대상"
              value="120"
              unit="명"
              icon={<Users size={18} />}
              tone="dark"
            />
            <StatCard
              label="오늘 예정 통화"
              value="120"
              unit="건"
              icon={<Clock size={18} />}
              badge="오후 2시 시작 예정"
              tone="muted"
            />
            <StatCard
              label="위험 감지"
              value="0"
              unit="건"
              icon={<CheckCircle2 size={18} />}
              badge="현재 안전함"
              tone="primary"
            />
            <StatCard
              label="연결 대기 중"
              value="120"
              unit="명"
              icon={<Phone size={18} />}
              tone="warning"
            />
          </div>
        </section>

        {/* Current Call (Empty State) */}
        <section
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: '24px',
            padding: spacing['3xl'],
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.lg,
            border: `1px dashed ${colors.border.strong}`,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#E5E7EB',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
            }}
          >
            <Phone size={32} />
          </div>
          <div>
            <h3
              style={{
                fontSize: typography.fontSize.value,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing.sm,
              }}
            >
              아직 진행된 통화가 없습니다.
            </h3>
            <p style={{ color: colors.text.muted, lineHeight: 1.5 }}>
              설정하신 시간에 AI가 자동으로 전화를 걸기 시작합니다.
              <br />
              혹은 <strong>[모니터링 뷰]</strong>에서 수동으로 연결할 수 있습니다.
            </p>
          </div>
          <Button variant="ghost">AI 강제 실행하기 (즉시 시작)</Button>
        </section>
      </div>
    </DashboardLayout>
  );
}

// --- Local Components (using Shared Components) ---

function FeatureCard({
  icon,
  cornerIcon,
  title,
  description,
  actionLabel,
  href,
}: {
  icon: ReactNode;
  cornerIcon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <Card
        hoverable
        style={{
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: spacing.md,
        }}
        padding="lg"
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            opacity: 0.1,
            color: colors.primary.main,
            transform: 'rotate(-10deg)',
          }}
        >
          {cornerIcon}
        </div>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: colors.background.elevated2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary.dark,
          }}
        >
          {icon}
        </div>
        <div>
          <h3
            style={{
              fontSize: typography.fontSize.value,
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing.xs,
              color: colors.text.primary,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.body,
              color: colors.text.secondary,
              lineHeight: 1.5,
              marginBottom: spacing.md,
            }}
          >
            {description}
          </p>
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.fontSize.label,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary.main,
          }}
        >
          {actionLabel} <ArrowRight size={16} />
        </div>
      </Card>
    </Link>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon,
  badge,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  icon: ReactNode;
  badge?: string;
  tone: 'dark' | 'muted' | 'primary' | 'warning';
}) {
  const getToneColor = () => {
    switch (tone) {
      case 'dark':
        return { bg: colors.primary.dark, text: '#fff' };
      case 'muted':
        return { bg: colors.background.elevated2, text: colors.text.muted };
      case 'primary':
        return { bg: colors.primary.light, text: colors.primary.dark };
      case 'warning':
        return { bg: colors.semantic.warning, text: '#fff' };
    }
  };
  const toneStyle = getToneColor();

  return (
    <Card padding="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: toneStyle.bg,
            color: toneStyle.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        {badge && (
          <Badge
            variant={tone === 'primary' ? 'success' : 'default'}
            size="sm"
            className="self-start"
          >
            {badge}
          </Badge>
        )}
      </div>
      <div>
        <div
          style={{
            fontSize: typography.fontSize.caption,
            color: colors.text.muted,
            marginBottom: '2px',
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <strong
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: colors.text.primary,
            }}
          >
            {value}
          </strong>
          <span
            style={{
              fontSize: typography.fontSize.small,
              color: colors.text.soft,
              fontWeight: 600,
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    </Card>
  );
}
