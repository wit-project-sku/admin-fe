import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { useStatsChannel } from '@/stores/statsChannelStore';
import {
  emptyWeeklyStats,
  normalizeWeeklyStatsPayload,
  type NormalizedWeeklyStats,
} from '../../utils/weeklyStatsNormalize';

export type { MarketShareRow, NormalizedWeeklyStats, WeeklyTrendRow } from '../../utils/weeklyStatsNormalize';

/**
 * `/admin/stats/total` — weekly line series, market share, 오늘 클릭 분해, and redundant headline totals.
 * `select` always returns a stable object on success; check `isError` for network/API failures.
 */
export const useGetWeeklyStats = () => {
  const channel = useStatsChannel();
  return useQuery({
    queryKey: ['weekly-stats', channel],
    queryFn: async () => APIService.private.get('/admin/stats/total', { params: { channel } }),
    select: (raw: unknown): NormalizedWeeklyStats => normalizeWeeklyStatsPayload(raw) ?? emptyWeeklyStats(),
  });
};
