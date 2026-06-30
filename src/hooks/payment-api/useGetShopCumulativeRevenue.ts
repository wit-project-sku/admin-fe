import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type ShopCumulativeRevenue = {
  totalAmount: number;
  startDate: string;
  endDate: string;
};

type ShopCumulativeRevenueResponse = {
  success: boolean;
  code: number;
  message: string;
  data: ShopCumulativeRevenue;
};

export type UseGetShopCumulativeRevenueParams = {
  startDate: string;
  endDate: string;
  enabled?: boolean;
};

/** `/payments/admin/shop/stats/cumulative` — total KRW revenue for a `startDate`..`endDate` window. */
export const useGetShopCumulativeRevenue = ({
  startDate,
  endDate,
  enabled = true,
}: UseGetShopCumulativeRevenueParams) => {
  const ready = Boolean(startDate && endDate);

  return useQuery<ShopCumulativeRevenueResponse, Error, ShopCumulativeRevenue>({
    queryKey: ['shop-stats-cumulative', startDate, endDate],
    enabled: enabled && ready,
    queryFn: () =>
      APIService.private.get<ShopCumulativeRevenueResponse>('/payments/admin/shop/stats/cumulative', {
        params: { startDate, endDate },
      }),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });
};
