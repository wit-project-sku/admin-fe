import { useMemo, useState, useEffect, useCallback } from 'react';
import type { MonthlyShootingSort } from '../../hooks/dashboard-api/useGetMonthlyShootingStats';
import { useGetMonthlyShootingStats } from '../../hooks/dashboard-api/useGetMonthlyShootingStats';
import { buildShootingStatsTableModel } from './shootingStatsMappers';
import { REPORT_MESSAGES } from './reportMessages';

const MONTHLY_SHOOTING_PAGE_SIZE = 20;


export function useMonthlyShootingReport(tabIsActive: boolean) {
  const [pageNum, setPageNum] = useState(1);
  const [monthSort, setMonthSortState] = useState<MonthlyShootingSort>('latest');

  const { data, error } = useGetMonthlyShootingStats({
    enabled: tabIsActive,
    pageNum,
    pageSize: MONTHLY_SHOOTING_PAGE_SIZE,
    monthSort,
  });

  const { rows, kioskNames, totalPages, totalElements } = useMemo(
    () => buildShootingStatsTableModel(data, 'month'),
    [data],
  );



  const setMonthSort = useCallback((next: MonthlyShootingSort) => {
    setMonthSortState(next);
    setPageNum(1);
  }, []);

  /** Avoid clamping during fetch when `data` is undefined — table model uses totalPages 1 and would reset the page. */
  useEffect(() => {
    if (data == null) return;
    setPageNum((p) => Math.min(Math.max(1, p), Math.max(1, totalPages)));
  }, [totalPages, data]);

  const errorMessage = error ? REPORT_MESSAGES.monthlyLoadError : '';

  return {
    rows,
    kioskNames,
    errorMessage,
    pageNum,
    setPageNum,
    totalPages,
    totalElements,
    pageSize: MONTHLY_SHOOTING_PAGE_SIZE,
    monthSort,
    setMonthSort,
  };
}
