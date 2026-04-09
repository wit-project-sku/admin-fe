import { useMemo, useState, useEffect } from 'react';
import { useGetMonthlyShootingStats } from '../../hooks/dashboard-api/useGetMonthlyShootingStats';
import { buildShootingStatsTableModel } from './shootingStatsMappers';
import { REPORT_MESSAGES } from './reportMessages';

const MONTHLY_SHOOTING_PAGE_SIZE = 10;

export function useMonthlyShootingReport(tabIsActive: boolean) {
  const [pageNum, setPageNum] = useState(1);

  const { data, error } = useGetMonthlyShootingStats({
    enabled: tabIsActive,
    pageNum,
    pageSize: MONTHLY_SHOOTING_PAGE_SIZE,
  });

  const { rows, kioskNames, totalPages, totalElements } = useMemo(
    () => buildShootingStatsTableModel(data, 'month'),
    [data],
  );

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
  };
}
