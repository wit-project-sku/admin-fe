import { useMemo, useState, useEffect, useCallback } from 'react';
import type { MonthlyShootingSort } from '../../hooks/dashboard-api/useGetMonthlyShootingStats';
import { useGetMonthlyShootingStats } from '../../hooks/dashboard-api/useGetMonthlyShootingStats';
import { buildShootingStatsTableModel } from './shootingStatsMappers';
import { REPORT_MESSAGES } from './reportMessages';

const MONTHLY_SHOOTING_PAGE_SIZE = 10;

function monthSortKey(month: string): number {
  const s = month.trim();
  const m = s.match(/^(\d{4})[-/.]?(\d{1,2})/);
  if (m) return Number(m[1]) * 100 + Number(m[2]);
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

export function useMonthlyShootingReport(tabIsActive: boolean) {
  const [pageNum, setPageNum] = useState(1);
  const [monthSort, setMonthSortState] = useState<MonthlyShootingSort>('latest');

  const { data, error } = useGetMonthlyShootingStats({
    enabled: tabIsActive,
    pageNum,
    pageSize: MONTHLY_SHOOTING_PAGE_SIZE,
    monthSort,
  });

  const { rows: rawRows, kioskNames, totalPages, totalElements } = useMemo(
    () => buildShootingStatsTableModel(data, 'month'),
    [data],
  );

  const rows = useMemo(() => {
    const list = [...rawRows];
    list.sort((a, b) => {
      const ka = monthSortKey(String(a.month));
      const kb = monthSortKey(String(b.month));
      return monthSort === 'latest' ? kb - ka : ka - kb;
    });
    return list;
  }, [rawRows, monthSort]);

  const setMonthSort = useCallback((next: MonthlyShootingSort) => {
    setMonthSortState(next);
    setPageNum(1);
  }, []);

  useEffect(() => {
    setPageNum((p) => Math.min(Math.max(1, p), Math.max(1, totalPages)));
  }, [totalPages]);

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
