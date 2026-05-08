import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type AdminRefundImage = {
  id: number;
  imageUrl: string;
};

export type AdminRefundListRow = {
  id: number;
  transactionId: string;
  receiverName: string;
  phoneNumber: string;
  refundReason: string;
  refundStatus: string;
  description?: string;
  images?: AdminRefundImage[];
};

type RefundsAdminPage = {
  content: AdminRefundListRow[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetAllRefundsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: RefundsAdminPage;
};

export type RefundListStatusFilter = 'WAITING' | 'COMPLETE';

export type GetAllRefundsQueryParams = {
  pageNum: number;
  pageSize: number;
  /** 환불 상태 필터 (백엔드: WAITING | COMPLETE) */
  refundStatus?: RefundListStatusFilter;
};

export const useGetAllRefunds = (params: GetAllRefundsQueryParams) => {
  const { pageNum, pageSize, refundStatus } = params;

  const { data, isLoading, error } = useQuery<GetAllRefundsResponse>({
    queryKey: ['all-refunds', pageNum, pageSize, refundStatus ?? ''],
    queryFn: async () => {
      return await APIService.private.get('/refunds/admin', {
        params: {
          pageNum,
          pageSize,
          ...(refundStatus ? { refundStatus } : {}),
        },
      });
    },
  });
  return { data, isLoading, error };
};
