import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGetDailyShootingStats } from '../../hooks/dashboard-api/useGetDailyShootingStats';
import { buildShootingStatsTableModel } from './shootingStatsMappers';
import { REPORT_MESSAGES } from './reportMessages';
import { getFirstOfMonthYmd, getLocalTodayYmd } from '../../utils/dateUtils';

const DAILY_SHOOTING_PAGE_SIZE = 20;

/**
 * Default range: start = 1st of the current month, end = today (local calendar).
 * Derived once at mount so the two dates stay consistent and `start <= end` always holds,
 * including on the 1st of the month where `start === end`.
 */
function computeDefaultRange() {
  const today = getLocalTodayYmd();
  const first = getFirstOfMonthYmd();
  return { start: first, end: today };
}

export function useDailyShootingReport(tabIsActive: boolean) {
  const defaultRange = useMemo(computeDefaultRange, []);
  const [dateDraft, setDateDraft] = useState(defaultRange);
  const [committedRange, setCommittedRange] = useState(defaultRange);
  const [pageNum, setPageNum] = useState(1);

  const runQuery = useCallback(() => {
    if (!dateDraft.start || !dateDraft.end) return;
    setPageNum(1);
    setCommittedRange({ start: dateDraft.start, end: dateDraft.end });
  }, [dateDraft.start, dateDraft.end]);

  const clearRange = useCallback(() => {
    setDateDraft({ start: '', end: '' });
    setCommittedRange({ start: '', end: '' });
    setPageNum(1);
  }, []);

  const rangeReady = Boolean(committedRange.start && committedRange.end);

  const { data, isLoading, error } = useGetDailyShootingStats(committedRange.start, committedRange.end, {
    enabled: tabIsActive && rangeReady,
    pageNum,
    pageSize: DAILY_SHOOTING_PAGE_SIZE,
  });

  const { rows, kioskNames, totalPages, totalElements } = useMemo(
    () => buildShootingStatsTableModel(data, 'date'),
    [data],
  );

  useEffect(() => {
    setPageNum((p) => Math.min(Math.max(1, p), Math.max(1, totalPages)));
  }, [totalPages]);

  const errorMessage = error ? REPORT_MESSAGES.dailyLoadError : '';

  return {
    dateDraft,
    setDateDraft,
    committedRange,
    runQuery,
    clearRange,
    isLoading,
    rows,
    kioskNames,
    errorMessage,
    pageNum,
    setPageNum,
    totalPages,
    totalElements,
    pageSize: DAILY_SHOOTING_PAGE_SIZE,
  };
}
