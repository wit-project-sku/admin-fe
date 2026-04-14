import { useMemo, useState } from 'react';
import { DashboardDrilldownView } from '../features/dashboard/DashboardDrilldownView';
import { DashboardOverview } from '../features/dashboard/DashboardOverview';
import { parseShootingSummaryPayload } from '../features/dashboard/dashboardSummary';
import { useGetStatisticSummary } from '../hooks/dashboard-api/useGetTotalShootingStatistics';
import { useGetWeeklyStats } from '../hooks/dashboard-api/useGetWeeklyStats';
import { emptyWeeklyStats, marketShareToPieSlices } from '../utils/weeklyStatsNormalize';

/** Summary = kiosk breakdown + outfit count + headline totals; total = weekly line + market share. */
export default function DashboardPage() {
  const [drilldown, setDrilldown] = useState<'today' | 'monthly' | null>(null);
  const { data: summaryRaw } = useGetStatisticSummary();
  const summary = parseShootingSummaryPayload(summaryRaw);

  const { data: weeklyData, isLoading: weekLoading, isError: weekError } = useGetWeeklyStats();
  const weekly = weeklyData ?? emptyWeeklyStats();
  const weeklyPieSlices = useMemo(() => marketShareToPieSlices(weekly.marketShare), [weekly]);

  if (drilldown) {
    return (
      <DashboardDrilldownView
        mode={drilldown}
        summary={summary}
        pieSlices={weeklyPieSlices}
        pieLoading={weekLoading}
        pieError={weekError}
        onBack={() => setDrilldown(null)}
      />
    );
  }

  return (
    <DashboardOverview
      summary={summary}
      weekly={weekly}
      weeklyPieSlices={weeklyPieSlices}
      weeklyLoading={weekLoading}
      weeklyError={weekError}
      onDrillToday={() => setDrilldown('today')}
      onDrillMonthly={() => setDrilldown('monthly')}
    />
  );
}
