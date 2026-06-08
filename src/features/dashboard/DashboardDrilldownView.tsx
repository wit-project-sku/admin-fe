import shared from '@commons/shared.module.css';
import s from '@pages/DashboardPage.module.css';
import { DashboardKioskBreakdownCard } from './DashboardKioskBreakdownCard';
import type { KioskCountRow, ShootingSummary } from './dashboardSummary';

export type DashboardDrillMode = 'today' | 'monthly';

type DashboardDrilldownViewProps = {
  mode: DashboardDrillMode;
  summary: ShootingSummary | null;
  summaryLoading?: boolean;
  summaryError?: boolean;
  onBack: () => void;
};

export function DashboardDrilldownView({
  mode,
  summary,
  summaryLoading = false,
  summaryError = false,
  onBack,
}: DashboardDrilldownViewProps) {
  const isToday = mode === 'today';
  const totalVal = isToday ? (summary?.todayTotal ?? 0) : (summary?.monthlyTotal ?? 0);
  const locationData: KioskCountRow[] = isToday ? (summary?.todayByKiosk ?? []) : (summary?.monthlyByKiosk ?? []);
  const label = isToday ? '오늘 지점별 현황' : '이번 달 지점별 현황';

  const yesterdayData = summary?.yesterdayByKiosk ?? [];
  const twoDayAgoData = summary?.twoDayAgoByKiosk ?? [];
  const yesterdayTotal = yesterdayData.reduce((sum, loc) => sum + loc.count, 0);
  const twoDayAgoTotal = twoDayAgoData.reduce((sum, loc) => sum + loc.count, 0);

  return (
    <div>
      <button type='button' className={s.backBtn} onClick={onBack}>
        ← 대시보드로 돌아가기
      </button>
      <div className={shared.pageHeader} style={{ marginTop: 16 }}>
        <div>
          <h1 className={shared.pageTitle}>{label}</h1>
          <p className={shared.pageSubtitle}>Location Breakdown</p>
        </div>
      </div>
      <div className={s.drillBreakdownStack}>
        <DashboardKioskBreakdownCard
          title={label}
          totalValue={totalVal}
          locationData={locationData}
          loading={summaryLoading}
          error={summaryError}
        />
        {isToday && yesterdayData.length > 0 && (
          <DashboardKioskBreakdownCard
            title='어제 지점별 현황'
            totalValue={yesterdayTotal}
            locationData={yesterdayData}
            loading={summaryLoading}
            error={summaryError}
          />
        )}
        {isToday && twoDayAgoData.length > 0 && (
          <DashboardKioskBreakdownCard
            title='2일 전 지점별 현황'
            totalValue={twoDayAgoTotal}
            locationData={twoDayAgoData}
            loading={summaryLoading}
            error={summaryError}
          />
        )}
      </div>
    </div>
  );
}
