import OutfitReportFilters from '@components/reports/OutfitReportFilters';
import OutfitStatsTable from '@components/reports/OutfitStatsTable';
import type { OutfitReportFiltersState } from './useOutfitReportFilters';
import { useOutfitTabReport } from './useOutfitTabReport';

type OutfitStatsTabPanelProps = {
  outfit: OutfitReportFiltersState;
};

export function OutfitStatsTabPanel({ outfit }: OutfitStatsTabPanelProps) {
  const report = useOutfitTabReport('stats', outfit);

  return (
    <div>
      <OutfitReportFilters
        kiosks={report.kiosks}
        kioskId={outfit.kioskDraft}
        onKioskChange={outfit.setKioskDraft}
        start={outfit.dateDraft.start}
        end={outfit.dateDraft.end}
        onStartChange={(v) => outfit.setDateDraft((d) => ({ ...d, start: v }))}
        onEndChange={(v) => outfit.setDateDraft((d) => ({ ...d, end: v }))}
        onSearch={outfit.applyFilters}
        onClearFilters={outfit.clearFilters}
        loading={report.filtersLoading}
      />
      <OutfitStatsTable
        panelStatus={report.panel.status}
        errorMessage={report.rankingError ? report.errorMessage : undefined}
        rows={report.panel.rows}
        sortMode={outfit.statsSort}
        onSortModeChange={outfit.setStatsSort}
        onExportExcel={report.exportExcel}
        exportEnabled={report.panel.exportEnabled}
        rangeLabel={report.panel.rangeLabel}
        kioskLabel={report.panel.kioskLabel}
        pageNum={report.pageNum}
        totalPages={report.totalPages}
        totalElements={report.totalElements}
        onPageChange={report.setPageNum}
        rankOffset={report.rankOffset}
      />
    </div>
  );
}
