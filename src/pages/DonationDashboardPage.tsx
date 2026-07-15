import { useState, type ReactNode } from 'react';
import { AlertTriangle, Building2, HandHeart, HeartHandshake, RefreshCw, School, Users } from 'lucide-react';
import shared from '@commons/shared.module.css';
import s from '../features/dashboard/DashboardCommerceOverview.module.css';
import ds from './DashboardPage.module.css';
import { useDonationDashboardModel } from '../features/donations/dashboard/useDonationDashboardModel';
import {
  DonationPaymentChart,
  DonationTopTargetsChart,
  DonationTrendChart,
  DonationTypeChart,
} from '../features/donations/dashboard/DonationDashboardCharts';
import { SchoolDonationDashboard } from '../features/donations/dashboard/SchoolDonationDashboard';

type DonationDashboardTab = 'school' | 'overview';

type MetricCardProps = {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: number;
  unit: string;
  sub?: string;
  isLoading: boolean;
  isError: boolean;
};

function MetricCard({ icon, iconBg, label, value, unit, sub, isLoading, isError }: MetricCardProps) {
  return (
    <div className={s.metricCard}>
      <div className={s.metricTop}>
        <div className={s.metricIcon} style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className={s.metricLabel}>{label}</div>
      <div className={s.metricValue}>
        {isLoading ? (
          <span className={shared.skeletonLine} style={{ maxWidth: 120, height: 22 }} aria-label='로딩 중' />
        ) : isError ? (
          <span className={s.metricError}>
            <AlertTriangle size={14} /> 불러오기 실패
          </span>
        ) : (
          <>
            {value.toLocaleString('ko-KR')}
            <span className={s.metricUnit}>{unit}</span>
          </>
        )}
      </div>
      {sub && !isLoading && !isError ? <div className={s.metricLabel} style={{ marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

/** NGO + 학교 통합 개요 (금액·건수·유형·결제수단·상위 대상). */
function DonationOverviewTab() {
  const { metrics, trend, typeSplit, paymentSplit, topTargets, isLoading, isError, refetch } =
    useDonationDashboardModel();

  return (
    <div className={s.root}>
      <section className={s.metricsGrid} aria-label='기부 핵심 지표' aria-busy={isLoading}>
        <MetricCard
          icon={<HeartHandshake size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #10b981, #059669)'
          label='총 기부액'
          value={metrics.totalAmount}
          unit='원'
          sub={`완료 기부 ${metrics.totalCount.toLocaleString('ko-KR')}건`}
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<Users size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #6366f1, #4f46e5)'
          label='기부자 수'
          value={metrics.donorCount}
          unit='명'
          sub='고유 기부자(이름 기준)'
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<HandHeart size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #f59e0b, #d97706)'
          label='진행중 캠페인'
          value={metrics.activeCampaigns}
          unit='개'
          sub={`전체 ${metrics.campaignTotal.toLocaleString('ko-KR')}개 · 단체 ${metrics.orgTotal.toLocaleString('ko-KR')}곳`}
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<School size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #f43f5e, #e11d48)'
          label='참여 학교'
          value={metrics.activeSchools}
          unit='개'
          sub={`전체 ${metrics.schoolTotal.toLocaleString('ko-KR')}개교`}
          isLoading={isLoading}
          isError={isError}
        />
      </section>

      {isError ? (
        <div className={s.errorBanner} role='alert'>
          <span>
            <AlertTriangle size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            기부 통계 데이터를 불러오지 못했습니다.
          </span>
          <button type='button' className={s.retryBtn} onClick={refetch}>
            <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: '-2px' }} />
            다시 시도
          </button>
        </div>
      ) : null}

      <div className={s.chartsRow} style={{ gridTemplateColumns: '1.4fr 1fr', marginTop: 20 }}>
        <DonationTrendChart data={trend} isLoading={isLoading} isError={isError} />
        <DonationTypeChart data={typeSplit} isLoading={isLoading} isError={isError} />
      </div>

      <div className={s.chartsRow} style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <DonationPaymentChart data={paymentSplit} isLoading={isLoading} isError={isError} />
        <DonationTopTargetsChart data={topTargets} isLoading={isLoading} isError={isError} />
      </div>

      <div className={s.note}>
        <Building2 size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
        기부 내역 최신 표본을 기반으로 집계한 수치입니다. 완료(PAID) 상태 결제만 금액·건수에 포함됩니다.
      </div>
    </div>
  );
}

export default function DonationDashboardPage() {
  const [tab, setTab] = useState<DonationDashboardTab>('school');

  return (
    <div className={ds.dashboardShell}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>기부 대시보드</h1>
          <p className={shared.pageSubtitle}>Donation Analytics Overview</p>
        </div>
      </div>

      <nav className={ds.tabBar} aria-label='기부 대시보드 보기 전환'>
        <button
          type='button'
          className={`${ds.tab} ${tab === 'school' ? ds.tabActive : ''}`}
          onClick={() => setTab('school')}
        >
          학교 기부
        </button>
        <button
          type='button'
          className={`${ds.tab} ${tab === 'overview' ? ds.tabActive : ''}`}
          onClick={() => setTab('overview')}
        >
          전체 개요
        </button>
      </nav>

      {tab === 'school' ? <SchoolDonationDashboard /> : <DonationOverviewTab />}
    </div>
  );
}
