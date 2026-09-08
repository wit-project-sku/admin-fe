import type { CSSProperties, ReactNode } from 'react';
import {
  AlertTriangle,
  GraduationCap,
  HeartHandshake,
  RefreshCw,
  RotateCcw,
  School,
  Users,
  Wallet,
} from 'lucide-react';
import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import s from '../../dashboard/DashboardCommerceOverview.module.css';
import { useSchoolDonationDashboard } from './useSchoolDonationDashboard';
import { DonationPaymentChart, DonationTrendChart } from './DonationDashboardCharts';
import { SchoolGraduationChart, SchoolRankingTable, SchoolRegionChart } from './SchoolDonationCharts';

const filterSelectStyle: CSSProperties = {
  height: 36,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--border-color, #e2e8f0)',
  background: 'var(--card-bg, #fff)',
  fontSize: 13,
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const dateInputStyle: CSSProperties = { ...filterSelectStyle, cursor: 'text', minWidth: 140 };

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
            <AlertTriangle size={14} /> 실패
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

export function SchoolDonationDashboard() {
  const {
    region,
    setRegion,
    keyword,
    setKeyword,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    regionOptions,
    resetFilters,
    metrics,
    regionBars,
    ranking,
    trend,
    graduationBars,
    paymentSplit,
    matchedSchoolCount,
    periodDonationCount,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useSchoolDonationDashboard();

  return (
    <div className={s.root}>
      {/* 필터 바 */}
      <div
        className={shared.card}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          padding: '14px 18px',
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>필터</span>
        <div style={{ flex: '1 1 200px', minWidth: 160, display: 'flex' }}>
          <SearchBar value={keyword} onChange={setKeyword} placeholder='학교명 검색...' />
        </div>
        <select style={filterSelectStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value=''>지역 전체</option>
          {regionOptions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type='date'
            style={dateInputStyle}
            value={rangeStart}
            max={rangeEnd || undefined}
            onChange={(e) => setRangeStart(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>~</span>
          <input
            type='date'
            style={dateInputStyle}
            value={rangeEnd}
            min={rangeStart || undefined}
            onChange={(e) => setRangeEnd(e.target.value)}
          />
        </div>
        <button
          type='button'
          onClick={resetFilters}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color, #e2e8f0)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <RotateCcw size={13} /> 초기화
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
          학교 {matchedSchoolCount.toLocaleString('ko-KR')}개 · 기간 내 기부 {periodDonationCount.toLocaleString('ko-KR')}건
        </span>
      </div>

      {/* KPI (누적 기준) */}
      <section className={s.metricsGrid} aria-label='학교 기부 핵심 지표' aria-busy={isLoading}>
        <MetricCard
          icon={<HeartHandshake size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #f43f5e, #e11d48)'
          label='누적 기부액'
          value={metrics.totalAmount}
          unit='원'
          sub={`학교당 평균 ${metrics.avgPerSchool.toLocaleString('ko-KR')}원`}
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<School size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #6366f1, #4f46e5)'
          label='참여 학교'
          value={metrics.participatingSchools}
          unit='개'
          sub={`전체 ${metrics.totalSchools.toLocaleString('ko-KR')}개교`}
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<Users size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #10b981, #059669)'
          label='총 참여자'
          value={metrics.participantCount}
          unit='명'
          sub='누적 기부 참여 건수'
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<GraduationCap size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #f59e0b, #d97706)'
          label='수혜 학생'
          value={metrics.studentCount}
          unit='명'
          sub='재학생 합계'
          isLoading={isLoading}
          isError={isError}
        />
      </section>

      {isError ? (
        <div className={s.errorBanner} role='alert'>
          <span>
            <AlertTriangle size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            학교 기부 통계 데이터를 불러오지 못했습니다.
          </span>
          <button type='button' className={s.retryBtn} onClick={refetch} disabled={isFetching}>
            <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: '-2px' }} />
            다시 시도
          </button>
        </div>
      ) : null}

      <div className={s.chartsRow} style={{ gridTemplateColumns: '1.5fr 1fr', marginTop: 20 }}>
        <DonationTrendChart data={trend} isLoading={isLoading} isError={isError} />
        <DonationPaymentChart data={paymentSplit} isLoading={isLoading} isError={isError} />
      </div>

      <div className={s.chartsRow} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <SchoolRegionChart data={regionBars} isLoading={isLoading} isError={isError} />
        <SchoolGraduationChart data={graduationBars} isLoading={isLoading} isError={isError} />
      </div>

      <SchoolRankingTable rows={ranking} isLoading={isLoading} isError={isError} />

      <div className={s.note}>
        <Wallet size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
        누적 지표(기부액·참여자·수혜 학생)와 지역·랭킹은 전체 기간 누적값이며, 추이·졸업연도·결제수단 차트는 선택한
        기간의 완료(PAID) 기부만 반영합니다.
      </div>
    </div>
  );
}
