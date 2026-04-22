import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type ShopRevenueTrendPoint = {
  label: string;
  date: string;
  revenue: number;
  lastWeekRevenue: number;
};

export type ShopOrderStatusSlice = {
  status: string;
  count: number;
  percentage: number;
};

export type ShopStatsSummary = {
  todayRevenue: number;
  newOrders: number;
  deliveringCount: number;
  refundRequestCount: number;
  newOrdersTrend: number;
  revenueTrend: ShopRevenueTrendPoint[];
  orderStatusGraph: ShopOrderStatusSlice[];
};

type ShopStatsSummaryResponse = {
  success: boolean;
  code: number;
  message: string;
  data: ShopStatsSummary;
};

/** `/payments/admin/shop/stats/summary` — e-commerce dashboard KPIs + weekly trend + order status mix. */
export const useGetShopStatsSummary = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;

  return useQuery<ShopStatsSummaryResponse, Error, ShopStatsSummary>({
    queryKey: ['shop-stats-summary'],
    enabled,
    queryFn: () => APIService.private.get<ShopStatsSummaryResponse>('/payments/admin/shop/stats/summary'),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });
};
