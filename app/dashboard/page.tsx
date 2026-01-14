'use client';

import { useState, type ReactElement } from 'react';
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
import Link from 'next/link';
import SidebarLayout from '../../components/SidebarLayout';
import { AuthError, useAuthedFetch } from '../../hooks/useAuthedFetch';
import styles from './dashboard.module.css';
import {
  type FeatureCardProps,
  type HeroCopy,
  type MyWardsStatsResponse,
  type StatCardProps,
  type StatTone,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const toneClass: Record<StatTone, string> = {
  dark: styles.toneDark,
  muted: styles.toneMuted,
  primary: styles.tonePrimary,
  warning: styles.toneWarning,
};

export default function DashboardPage() {
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useAuthedFetch<MyWardsStatsResponse>({
    deps: [refreshKey],
    fetcher: async ({ token, signal }) => {
      const response = await fetch(`${API_BASE}/v1/admin/my-wards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });
      if (response.status === 401 || response.status === 403) {
        throw new AuthError('인증이 만료되었습니다.');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as MyWardsStatsResponse;
    },
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
          <button
            className={styles.heroAction}
            type="button"
            onClick={() => setRefreshKey(key => key + 1)}
          >
            다시 시도하기
          </button>
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
            <button
              className={`${styles.heroAction} ${styles.heroActionDisabled}`}
              type="button"
              disabled
            >
              불러오는 중...
            </button>
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
              <button
                className={styles.heroAction}
                type="button"
                onClick={() => setCsvModalOpen(true)}
              >
                피보호자 등록하기
              </button>
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
                <Link className={styles.heroAction} href="/my-wards">
                  대상자 연동 현황으로 가기
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
                <Link className={styles.heroAction} href="/beneficiaries">
                  전체 대상자 관리
                </Link>
              ),
            };

  return (
    <SidebarLayout
      title="기관 통합 관제"
      csvModalOpen={csvModalOpen}
      onCsvModalOpenChange={setCsvModalOpen}
    >
      <div className={styles.page}>
        {error && (
          <div className={styles.notice}>
            연동 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            <button
              className={styles.noticeButton}
              type="button"
              onClick={() => setRefreshKey(key => key + 1)}
            >
              다시 시도
            </button>
          </div>
        )}
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroPill}>NEW</span>
              <span className={styles.heroBadgeText}>시스템 설정 완료</span>
            </div>
            <h1 className={styles.heroTitle}>{heroCopy.title}</h1>
            <p className={styles.heroDesc}>{heroCopy.desc}</p>
          </div>
          {heroCopy.action}
        </section>

        <section className={styles.featureGrid}>
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

        <section>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={18} color="#f59e0b" /> 금일현황
          </h2>
          <div className={styles.statsGrid}>
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

        <section className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Phone size={32} />
          </div>
          <h3 className={styles.emptyTitle}>아직 진행된 통화가 없습니다.</h3>
          <p className={styles.emptyDesc}>
            설정하신 시간에 AI가 자동으로 전화를 걸기 시작합니다.
            <br />
            혹은 <strong>[모니터링 뷰]</strong>에서 수동으로 연결할 수 있습니다.
          </p>
          <button className={styles.emptyAction} type="button">
            AI 강제 실행하기 (즉시 시작)
          </button>
        </section>
      </div>
    </SidebarLayout>
  );
}

function FeatureCard({
  icon,
  cornerIcon,
  title,
  description,
  actionLabel,
  href,
}: FeatureCardProps) {
  return (
    <Link className={styles.featureCard} href={href}>
      <div className={styles.featureCorner}>{cornerIcon}</div>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
      <span className={styles.featureAction}>
        {actionLabel} <ArrowRight size={14} />
      </span>
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
}: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div className={`${styles.statIcon} ${toneClass[tone]}`}>{icon}</div>
        {badge ? <span className={styles.statBadge}>{badge}</span> : null}
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>
        <strong className={styles.statValueNumber}>{value}</strong>
        <span className={styles.statValueUnit}>{unit}</span>
      </div>
    </div>
  );
}
