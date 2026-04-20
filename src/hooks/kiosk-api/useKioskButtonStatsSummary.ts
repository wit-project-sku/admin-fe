import { useQuery } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';
import type { KioskButtonStatsSummaryParams, KioskButtonStatsSummaryResponse } from './kioskButtonStatsTypes';

/**
 * Kiosk button usage summary + charts + paginated `buttonDetails`.
 * `GET /admin/stats/buttons/summary`
 */
export function useKioskButtonStatsSummary(
  params: KioskButtonStatsSummaryParams,
  options?: { enabled?: boolean },
) {
  const { startDate, endDate, pageNum, pageSize, kioskId, buttonType, city } = params;

  return useQuery<KioskButtonStatsSummaryResponse>({
    queryKey: [
      'kiosk-button-stats-summary',
      startDate,
      endDate,
      pageNum,
      pageSize,
      kioskId ?? '',
      buttonType ?? '',
      city ?? '',
    ],
    queryFn: async () => {
      return await APIService.private.get<KioskButtonStatsSummaryResponse>('/admin/stats/buttons/summary', {
        params: {
          startDate,
          endDate,
          pageNum,
          pageSize,
          ...(typeof kioskId === 'number' && Number.isFinite(kioskId) && kioskId > 0 ? { kioskId } : {}),
          ...(buttonType ? { buttonType } : {}),
          ...(city ? { city } : {}),
        },
      });
    },
    enabled: options?.enabled ?? true,
  });
}
