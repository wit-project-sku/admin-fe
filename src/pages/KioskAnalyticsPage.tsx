import shared from '@commons/shared.module.css';
import { KioskAnalyticsAppTable } from '@/features/kiosk/analytics/KioskAnalyticsAppTable';
import { KioskAnalyticsCharts } from '@/features/kiosk/analytics/KioskAnalyticsCharts';
import { KioskAnalyticsFilters } from '@/features/kiosk/analytics/KioskAnalyticsFilters';
import { KioskAnalyticsKpiSection } from '@/features/kiosk/analytics/KioskAnalyticsKpiSection';
import { useKioskAnalyticsPageModel } from '@/features/kiosk/analytics/useKioskAnalyticsPageModel';
import styles from '@/features/kiosk/analytics/KioskAnalyticsPage.module.css';

export default function KioskAnalyticsPage() {
  const m = useKioskAnalyticsPageModel();

  return (
    <div className={styles.shell}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>WITH 분석 대시보드</h1>
          <p className={shared.pageSubtitle}>WITH Analytics Dashboard</p>
        </div>
      </div>

      <KioskAnalyticsFilters
        filters={m.filters}
        setFilters={m.setFilters}
        cityOptions={m.cityOptions}
        citiesLoading={m.citiesLoading}
        kioskOptions={m.kioskOptions}
        kiosksLoading={m.kiosksLoading}
        buttonTypeOptions={m.buttonTypeOptions}
        buttonsLoading={m.buttonsLoading}
        onFilterChange={m.bumpPageReset}
        onReset={m.resetFilters}
      />

      {m.statsError ? (
        <p className={styles.apiError} role='alert'>
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      ) : null}

      <KioskAnalyticsKpiSection
        isLoading={m.statsLoading}
        statsEmpty={m.statsEmpty}
        totalClicks={m.kpi.totalClicks}
        totalDurationSec={m.kpi.totalDurationSec}
        avgSessionSec={m.kpi.avgSessionSec}
        activeRegionCount={m.kpi.activeRegionCount}
      />

      <KioskAnalyticsCharts
        isLoading={m.statsLoading}
        clickDistData={m.clickDistData}
        usagePerButtonData={m.usagePerButtonData}
        trendChartData={m.trendChartData}
        topLocChart={m.topLocChart}
        topKioskUsageData={m.topKioskUsageData}
      />

      <KioskAnalyticsAppTable
        pageRows={m.pageRows}
        safePage={m.safePage}
        totalTablePages={m.totalTablePages}
        tableTotalCount={m.tableTotalCount}
        onPageChange={m.setPage}
        isLoading={m.statsLoading}
        statsEmpty={m.statsEmpty}
      />
    </div>
  );
}
