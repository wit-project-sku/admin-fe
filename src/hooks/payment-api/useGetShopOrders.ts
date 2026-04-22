import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type ShopOrderRow = {
  orderId: string;
  orderedAt: string;
  customerName: string | null;
  itemName: string | null;
  amount: number;
  status: string;
};

export type ShopOrdersPage = {
  content: ShopOrderRow[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type ShopOrdersResponse = {
  success: boolean;
  code: number;
  message: string;
  data: ShopOrdersPage;
};

export type UseGetShopOrdersParams = {
  pageNum: number;
  pageSize: number;
  enabled?: boolean;
};

/** `/payments/admin/shop/orders` — paginated e-commerce order list for the dashboard. */
export const useGetShopOrders = ({ pageNum, pageSize, enabled = true }: UseGetShopOrdersParams) => {
  return useQuery<ShopOrdersResponse, Error, ShopOrdersPage>({
    queryKey: ['shop-orders', pageNum, pageSize],
    enabled,
    queryFn: () =>
      APIService.private.get<ShopOrdersResponse>('/payments/admin/shop/orders', {
        params: { pageNum, pageSize },
      }),
    select: (res) => res.data,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
};
