import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useGetOutfitRankingStats,
  type OutfitRankingStatsParams,
} from '../../hooks/inventory-api/useGetOutfitRankingStats';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { unwrapList } from '../../utils/unwrapApi';
import { parseOutfitRankingStatsResponse, type OutfitReportPanelStatus } from '../../utils/outfitReportUtils';
import { REPORT_MESSAGES } from './reportMessages';
import type { OutfitSubmittedFilters } from './reportTypes';
import { downloadOutfitRankingExcel, downloadOutfitStatsExcel } from './outfitReportExports';
import { buildKioskNameById } from '../../utils/kioskHelpers';
import { outfitContextLabels } from './outfitReportLabels';
import type { OutfitReportFiltersState } from './useOutfitReportFilters';

const OUTFIT_RANKING_PAGE_SIZE = 12;

export type OutfitReportPanelModel = {
  status: OutfitReportPanelStatus;
  rows: Record<string, unknown>[];
  rangeLabel: string;
  kioskLabel: string;
  exportEnabled: boolean;
};

function buildOutfitStatsParams(
  tab: 'ranking' | 'stats',
  submitted: OutfitSubmittedFilters | null,
  rankingSort: 'popular' | 'number',
  statsSort: 'shots' | 'number',
): OutfitRankingStatsParams {
  const sort =
    tab === 'ranking'
      ? rankingSort === 'popular'
        ? 'POPULAR'
        : 'ID'
      : statsSort === 'shots'
        ? 'POPULAR'
        : 'ID';

  const p: OutfitRankingStatsParams = { sort };

  if (submitted == null) {
    return p;
  }

  const start = String(submitted.start ?? '').trim();
  const end = String(submitted.end ?? '').trim();
  if (start) p.start = start;
  if (end) p.end = end;

  const kioskId = String(submitted.kioskId ?? '').trim();
  if (kioskId) p.kioskId = kioskId;

  return p;
}

/**
 * Fetches outfit ranking/stats only while the tab that mounts this hook is visible.
 * Use inside `OutfitRankingTabPanel` or `OutfitStatsTabPanel` only.
 */
export function useOutfitTabReport(tab: 'ranking' | 'stats', outfit: OutfitReportFiltersState) {
  const { submitted, rankingSort, statsSort } = outfit;

  const [pageNum, setPageNum] = useState(1);

  useEffect(() => {
    setPageNum(1);
  }, [tab, submitted, rankingSort, statsSort]);

  const rankingParams = useMemo(
    () => ({
      ...buildOutfitStatsParams(tab, submitted, rankingSort, statsSort),
      pageNum,
      pageSize: OUTFIT_RANKING_PAGE_SIZE,
    }),
    [tab, submitted, rankingSort, statsSort, pageNum],
  );

  /** Runs on tab open with `sort` only; after 조회, params include 기간/지점. */
  const { data: rankingRaw, isLoading: rankingLoading, error: rankingError } = useGetOutfitRankingStats(
    rankingParams,
    { enabled: true },
  );

  const { data: kiosksRaw, isLoading: kiosksLoading } = useGetKiosks();
  const kiosks = unwrapList(kiosksRaw) as { id: string | number; name: string }[];

  const kioskNameById = useMemo(() => buildKioskNameById(kiosks), [kiosks]);

  const contextLabels = useMemo(() => {
    if (submitted != null) return outfitContextLabels(submitted, kioskNameById);
    return { rangeLabel: '전체 기간', kioskLabel: '전체 지점 · 조회 시 필터 적용' };
  }, [submitted, kioskNameById]);

  const { rows: tableRows, totalPages, totalElements } = useMemo(
    () => parseOutfitRankingStatsResponse(rankingRaw),
    [rankingRaw],
  );

  useEffect(() => {
    setPageNum((p) => Math.min(Math.max(1, p), Math.max(1, totalPages)));
  }, [totalPages]);

  const panel: OutfitReportPanelModel = useMemo(() => {
    if (submitted == null) {
      if (rankingError) {
        return {
          status: 'error',
          rows: [],
          rangeLabel: contextLabels.rangeLabel,
          kioskLabel: contextLabels.kioskLabel,
          exportEnabled: false,
        };
      }
      if (rankingLoading) {
        return {
          status: 'loading',
          rows: [],
          rangeLabel: contextLabels.rangeLabel,
          kioskLabel: contextLabels.kioskLabel,
          exportEnabled: false,
        };
      }
      if (tableRows.length === 0) {
        return {
          status: 'idle',
          rows: [],
          rangeLabel: contextLabels.rangeLabel,
          kioskLabel: contextLabels.kioskLabel,
          exportEnabled: false,
        };
      }
      return {
        status: 'data',
        rows: tableRows,
        rangeLabel: contextLabels.rangeLabel,
        kioskLabel: contextLabels.kioskLabel,
        exportEnabled: true,
      };
    }
    if (rankingError) {
      return {
        status: 'error',
        rows: [],
        rangeLabel: contextLabels.rangeLabel,
        kioskLabel: contextLabels.kioskLabel,
        exportEnabled: false,
      };
    }
    if (rankingLoading) {
      return {
        status: 'loading',
        rows: [],
        rangeLabel: contextLabels.rangeLabel,
        kioskLabel: contextLabels.kioskLabel,
        exportEnabled: false,
      };
    }
    if (tableRows.length === 0) {
      return {
        status: 'empty',
        rows: [],
        rangeLabel: contextLabels.rangeLabel,
        kioskLabel: contextLabels.kioskLabel,
        exportEnabled: false,
      };
    }
    return {
      status: 'data',
      rows: tableRows,
      rangeLabel: contextLabels.rangeLabel,
      kioskLabel: contextLabels.kioskLabel,
      exportEnabled: true,
    };
  }, [submitted, rankingError, rankingLoading, tableRows, contextLabels]);

  const filtersLoading = kiosksLoading || rankingLoading;

  const exportExcel = useCallback(() => {
    if (rankingError || rankingLoading || tableRows.length === 0) return;
    if (tab === 'ranking') {
      downloadOutfitRankingExcel(tableRows, rankingSort, submitted);
    } else {
      downloadOutfitStatsExcel(tableRows, statsSort, submitted);
    }
  }, [tab, rankingSort, statsSort, submitted, rankingError, rankingLoading, tableRows]);

  const rankOffset = (pageNum - 1) * OUTFIT_RANKING_PAGE_SIZE;

  return {
    kiosks,
    filtersLoading,
    panel,
    rankingError,
    errorMessage: REPORT_MESSAGES.outfitRankingLoadError,
    exportExcel,
    pageNum,
    setPageNum,
    totalPages,
    totalElements,
    pageSize: OUTFIT_RANKING_PAGE_SIZE,
    rankOffset,
  };
}
