import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type DonationHistoryStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | string;
export type DonationPaymentMethod = 'CARD' | 'TRANSFER' | string;

/** 결제 대상 유형 스냅샷 값(payment-be DonationPayment.targetType). NGO 캠페인=CAMPAIGN, 학교=SCHOOL. */
export type DonationTargetType = 'CAMPAIGN' | 'SCHOOL';

export type DonationHistoryItem = {
  id: number;
  /** 대상(캠페인/학교) 이름 스냅샷. */
  targetName: string;
  /** 대상 유형 (CAMPAIGN/SCHOOL). */
  targetType?: DonationTargetType | null;
  merchantUid: string;
  totalAmount: number;
  status: DonationHistoryStatus;
  paymentMethod: DonationPaymentMethod;
  donatorName: string;
  /** 학교 기부 시 졸업연도. */
  graduationYear?: number | null;
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
  /** 대상 유형 필터 (CAMPAIGN/SCHOOL). NGO 세그먼트→CAMPAIGN, 학교→SCHOOL. */
  targetType?: DonationTargetType | '';
};

export const DONATION_HISTORY_QUERY_KEY = 'donation-history';

/** payment-be `GET /api/admin/donations/payment/history` — keyword(대상명·기부자명 통합) + targetType. */
export const useGetDonationHistory = (params: GetDonationHistoryParams) => {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const keyword = params.keyword?.trim() || undefined;
  const targetType = params.targetType || undefined;

  return useQuery<GetDonationHistoryResponse>({
    queryKey: [DONATION_HISTORY_QUERY_KEY, pageNum, pageSize, keyword ?? '', targetType ?? ''],
    queryFn: () =>
      APIService.private.get<GetDonationHistoryResponse>('/admin/donations/payment/history', {
        params: {
          pageNum,
          pageSize,
          ...(keyword ? { keyword } : {}),
          ...(targetType ? { targetType } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};
