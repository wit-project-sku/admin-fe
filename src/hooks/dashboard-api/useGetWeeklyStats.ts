import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import {
  emptyWeeklyStats,
  normalizeWeeklyStatsPayload,
  type NormalizedWeeklyStats,
} from '../../utils/weeklyStatsNormalize';

export type { MarketShareRow, NormalizedWeeklyStats, WeeklyTrendRow } from '../../utils/weeklyStatsNormalize';

/**
 * `/admin/stats/total` — weekly line series + market share (and redundant totals the UI may ignore).
 * `select` always returns a stable object on success; check `isError` for network/API failures.
 */
export const useGetWeeklyStats = () => {
  return useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async () => APIService.private.get('/admin/stats/total'),
    select: (raw: unknown): NormalizedWeeklyStats => normalizeWeeklyStatsPayload(raw) ?? emptyWeeklyStats(),
  });
};
