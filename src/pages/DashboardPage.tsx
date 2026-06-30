import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardCommerceOverview } from '../features/dashboard/DashboardCommerceOverview';
import { DashboardDrilldownView } from '../features/dashboard/DashboardDrilldownView';
import { DashboardOverview } from '../features/dashboard/DashboardOverview';
import { parseShootingSummaryPayload } from '../features/dashboard/dashboardSummary';
import { useGetStatisticSummary } from '../hooks/dashboard-api/useGetTotalShootingStatistics';
import { useGetWeeklyStats } from '../hooks/dashboard-api/useGetWeeklyStats';
import { emptyWeeklyStats, marketShareToPieSlices } from '../utils/weeklyStatsNormalize';
import ds from './DashboardPage.module.css';

const KIOSK_ANALYTICS_PATH = '/admin/kiosk-analytics';

/** Summary = kiosk breakdown + outfit count + headline totals; total = weekly line + market share. */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'commerce'>('analytics');
  const [drilldown, setDrilldown] = useState<'today' | 'monthly' | null>(null);
  const { data: summaryRaw, isLoading: summaryLoading, error: summaryErrorRaw } = useGetStatisticSummary();
  const summaryError = Boolean(summaryErrorRaw);
  const summary = parseShootingSummaryPayload(summaryRaw);

  const { data: weeklyData, isLoading: weekLoading, isError: weekError } = useGetWeeklyStats();
  const weekly = weeklyData ?? emptyWeeklyStats();
  const weeklyPieSlices = useMemo(() => marketShareToPieSlices(weekly.marketShare), [weekly]);

  if (drilldown) {
    return (
      <DashboardDrilldownView
        mode={drilldown}
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError}
        onBack={() => setDrilldown(null)}
      />
    );
  }

  return (
    <div className={ds.dashboardShell}>
      <nav className={ds.tabBar} aria-label='대시보드 보기 전환'>
        <button
          type='button'
          className={`${ds.tab} ${dashboardTab === 'analytics' ? ds.tabActive : ''}`}
          onClick={() => setDashboardTab('analytics')}
        >
          AR착장 오버뷰
        </button>
        <button type='button' className={ds.tab} onClick={() => navigate(KIOSK_ANALYTICS_PATH)}>
          WITH사용 오버뷰
        </button>
        <button
          type='button'
          className={`${ds.tab} ${dashboardTab === 'commerce' ? ds.tabActive : ''}`}
          onClick={() => setDashboardTab('commerce')}
        >
          위드마켓 오버뷰
        </button>
      </nav>
      {dashboardTab === 'analytics' ? (
        <DashboardOverview
          summary={summary}
          weekly={weekly}
          weeklyPieSlices={weeklyPieSlices}
          weeklyLoading={weekLoading}
          weeklyError={weekError}
          onDrillToday={() => setDrilldown('today')}
          onDrillMonthly={() => setDrilldown('monthly')}
        />
      ) : (
        <DashboardCommerceOverview />
      )}
    </div>
  );
}
