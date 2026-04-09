import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DailyShootingReportPanel } from '../features/reports/DailyShootingReportPanel';
import { MonthlyShootingReportTable } from '../features/reports/MonthlyShootingReportTable';
import { OutfitRankingTabPanel } from '../features/reports/OutfitRankingTabPanel';
import { OutfitStatsTabPanel } from '../features/reports/OutfitStatsTabPanel';
import { ReportPageHeader } from '../features/reports/ReportPageHeader';
import { ReportTabBar } from '../features/reports/ReportTabBar';
import type { ReportTab } from '../features/reports/reportTypes';
import {
  downloadDailyShootingCsv,
  downloadMonthlyShootingCsv,
} from '../features/reports/shootingReportExports';
import { useDailyShootingReport } from '../features/reports/useDailyShootingReport';
import { useMonthlyShootingReport } from '../features/reports/useMonthlyShootingReport';
import { useOutfitReportFilters } from '../features/reports/useOutfitReportFilters';

function tabFromSearch(searchParams: URLSearchParams): ReportTab | null {
  const t = searchParams.get('tab');
  if (t === 'monthly' || t === 'daily' || t === 'ranking' || t === 'stats') return t;
  return null;
}

export default function ReportsPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<ReportTab>(() => tabFromSearch(searchParams) ?? 'monthly');

  useEffect(() => {
    const next = tabFromSearch(searchParams);
    if (next != null) setTab(next);
  }, [searchParams]);

  const monthly = useMonthlyShootingReport(tab === 'monthly');
  const daily = useDailyShootingReport(tab === 'daily');
  const outfitFilters = useOutfitReportFilters();

  const handleHeaderExcelDownload = useCallback(() => {
    if (tab === 'monthly' && !monthly.errorMessage && monthly.rows.length > 0) {
      downloadMonthlyShootingCsv(monthly.rows, monthly.kioskNames);
      return;
    }
    if (tab === 'daily' && !daily.errorMessage && daily.rows.length > 0) {
      downloadDailyShootingCsv(daily.rows, daily.kioskNames, daily.committedRange);
    }
  }, [tab, monthly.errorMessage, monthly.rows, monthly.kioskNames, daily]);

  const headerExcelDisabled = useMemo(() => {
    if (tab === 'monthly') {
      return Boolean(monthly.errorMessage) || monthly.rows.length === 0;
    }
    if (tab === 'daily') {
      return (
        Boolean(daily.errorMessage) ||
        daily.rows.length === 0 ||
        !daily.committedRange.start ||
        !daily.committedRange.end
      );
    }
    return true;
  }, [tab, monthly, daily]);

  return (
    <div>
      <ReportPageHeader
        activeTab={tab}
        onExcelDownload={tab === 'monthly' || tab === 'daily' ? handleHeaderExcelDownload : undefined}
        excelDisabled={headerExcelDisabled}
      />
      <ReportTabBar active={tab} onChange={setTab} />

      {tab === 'monthly' && (
        <MonthlyShootingReportTable
          rows={monthly.rows}
          kioskNames={monthly.kioskNames}
          errorMessage={monthly.errorMessage}
          pageNum={monthly.pageNum}
          onPageChange={monthly.setPageNum}
          totalPages={monthly.totalPages}
          totalElements={monthly.totalElements}
        />
      )}

      {tab === 'daily' && (
        <DailyShootingReportPanel
          dateDraft={daily.dateDraft}
          setDateDraft={daily.setDateDraft}
          onRunQuery={daily.runQuery}
          onClearRange={daily.clearRange}
          isLoading={daily.isLoading}
          rows={daily.rows}
          kioskNames={daily.kioskNames}
          errorMessage={daily.errorMessage}
          pageNum={daily.pageNum}
          onPageChange={daily.setPageNum}
          totalPages={daily.totalPages}
          totalElements={daily.totalElements}
        />
      )}

      {tab === 'ranking' && <OutfitRankingTabPanel outfit={outfitFilters} />}
      {tab === 'stats' && <OutfitStatsTabPanel outfit={outfitFilters} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes reportsSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
