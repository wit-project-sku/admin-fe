import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

/** Row shape from `GET /payments/admin` `data.content[]`. */
export type AdminPaymentListRow = {
  paymentId: number;
  terminalId: string;
  transactionId: string;
  paymentStatus: string;
  approvedDate: string;
  approvedTime: string;
  totalAmount: string;
  approvalNumber: string;
  cardNumber: string;
  phoneNumber: string;
  customImageUrl: string | null;
  deliveryStatus: string | null;
  productIds: number[];
};

type PaymentsAdminPage = {
  content: AdminPaymentListRow[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetAllPaymentsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: PaymentsAdminPage;
};

export type GetAllPaymentsQueryParams = {
  pageNum: number;
  pageSize: number;
  /** 검색: 전화번호, 주문번호 */
  keyword?: string;
  /** yyyy-MM-dd */
  startDate?: string;
  /** yyyy-MM-dd */
  endDate?: string;
};

export const useGetAllPayments = (params: GetAllPaymentsQueryParams) => {
  const { pageNum, pageSize, keyword, startDate, endDate } = params;
  const kw = keyword || undefined;

  const { data, isLoading, error } = useQuery<GetAllPaymentsResponse>({
    queryKey: ['payments', pageNum, pageSize, kw ?? '', startDate ?? '', endDate ?? ''],
    queryFn: async () => {
      return await APIService.private.get('/payments/admin', {
        params: {
          pageNum,
          pageSize,
          ...(kw ? { keyword: kw } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      });
    },
  });
  return { data, isLoading, error };
};
