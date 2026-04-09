import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGetDailyShootingStats } from '../../hooks/dashboard-api/useGetDailyShootingStats';
import { buildShootingStatsTableModel } from './shootingStatsMappers';
import { REPORT_MESSAGES } from './reportMessages';

const DAILY_SHOOTING_PAGE_SIZE = 10;

export function useDailyShootingReport(tabIsActive: boolean) {
  const [dateDraft, setDateDraft] = useState({ start: '', end: '' });
  const [committedRange, setCommittedRange] = useState({ start: '', end: '' });
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
