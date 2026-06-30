import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

type UseGetAllDeliveriesOptions = {
  pageSize: number;
  pageNum: number;
  keyword?: string;
  deliveryStatus?: string;
}

interface Product {
  productId: number;
  category: string | null;
  productName: string;
  productImageUrl: string | null;
  productQuantity: number;
  productPrice: number;
  customImageUrl: string | null;
  option: string | null;
}

export interface Delivery {
  deliveryId: number;
  transactionId: string;
  orderDate: string;
  deliveryStatus: string;
  trackingNumber: string;
  phoneNumber: string;
  receiverName: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  totalAmount: string;
  productListResponses: Product[];
}

export interface DeliveriesResponse {
  content: Delivery[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export type GetAllDeliveriesResponse = ApiResponse<DeliveriesResponse>;

export const useGetAllDeliveries = (options: UseGetAllDeliveriesOptions) => {
  const { pageNum, pageSize, keyword, deliveryStatus } = options;
  const kw = keyword?.trim() || undefined;

  const { data, isLoading, error } = useQuery<GetAllDeliveriesResponse>({
    queryKey: ['deliveries-all', pageNum, pageSize, kw ?? '', deliveryStatus ?? ''],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      return await APIService.private.get('/deliveries/admin', {
        params: {
          pageNum,
          pageSize,
          ...(kw ? { keyword: kw } : {}),
          ...(deliveryStatus ? { deliveryStatus } : {}),
        },
      });
    },
  });

  return { data, isLoading, error };
};
