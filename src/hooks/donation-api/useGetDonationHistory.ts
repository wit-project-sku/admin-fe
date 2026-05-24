import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type DonationHistoryStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | string;
export type DonationPaymentMethod = 'CARD' | 'TRANSFER' | string;

export type DonationHistoryItem = {
  id: number;
  campaignName: string;
  merchantUid: string;
  totalAmount: number;
  status: DonationHistoryStatus;
  paymentMethod: DonationPaymentMethod;
  donatorName: string;
  photoUrl: string;
  donatedAt: string;
};

type DonationHistoryPage = {
  content: DonationHistoryItem[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetDonationHistoryResponse = {
  success: boolean;
  code: number;
  message: string;
  data: DonationHistoryPage;
};

export type GetDonationHistoryParams = {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
};

export const DONATION_HISTORY_QUERY_KEY = 'donation-history';

export const useGetDonationHistory = (params: GetDonationHistoryParams) => {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const keyword = params.keyword?.trim() || undefined;

  return useQuery<GetDonationHistoryResponse>({
    queryKey: [DONATION_HISTORY_QUERY_KEY, pageNum, pageSize, keyword ?? ''],
    queryFn: () =>
      APIService.private.get('/donations/admin/history', {
        params: {
          pageNum,
          pageSize,
          ...(keyword ? { keyword } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};
