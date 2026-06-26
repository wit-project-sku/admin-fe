import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { DonationTypeCode } from './donationApiTypes';

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
  /** 캠페인이 속한 단체(미지정 시 null). */
  organizationId?: number | null;
  organizationName?: string | null;
  /** 기부 종류 (NGO/SCHOOL). */
  type?: DonationTypeCode | null;
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
  type?: DonationTypeCode | '';
  organizationId?: number | null;
  campaignId?: number | null;
};

export const DONATION_HISTORY_QUERY_KEY = 'donation-history';

export const useGetDonationHistory = (params: GetDonationHistoryParams) => {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const keyword = params.keyword?.trim() || undefined;
  const type = params.type || undefined;
  const organizationId = params.organizationId ?? undefined;
  const campaignId = params.campaignId ?? undefined;

  return useQuery<GetDonationHistoryResponse>({
    queryKey: [
      DONATION_HISTORY_QUERY_KEY,
      pageNum,
      pageSize,
      keyword ?? '',
      type ?? '',
      organizationId ?? '',
      campaignId ?? '',
    ],
    queryFn: () =>
      APIService.private.get<GetDonationHistoryResponse>('/donations/admin/payment/history', {
        params: {
          pageNum,
          pageSize,
          ...(keyword ? { keyword } : {}),
          ...(type ? { type } : {}),
          ...(organizationId != null ? { organizationId } : {}),
          ...(campaignId != null ? { campaignId } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};
