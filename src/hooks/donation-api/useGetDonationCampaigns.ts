import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { CampaignAmountOption, DonationOrganizationSummary } from './donationApiTypes';

export type DonationCampaignStatus = 'ACTIVE' | 'INACTIVE' | string;

export type DonationCampaign = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  status: DonationCampaignStatus;
  /** 주최 단체. 미지정 캠페인은 null. */
  organization: DonationOrganizationSummary | null;
  targetAmount: number;
  accumulatedAmount: number;
  /** 전역 고정 프리셋(응답 전용). */
  amountOptions: CampaignAmountOption[];
  /** 기대효과 3개. */
  effects: string[];
  /** 메인 배너 상단 안내 문구(선택). */
  bannerSubtitle: string | null;
  /** 메인 배너 큰 캐치프레이즈(선택). */
  bannerTitle: string | null;
  createdAt: string;
};

export type GetDonationCampaignsParams = {
  pageNum: number;
  pageSize: number;
  /** 단체 ID 필터 (미전송 시 전체). */
  organizationId?: number | null;
  /** 비활성 포함 여부. 관리자는 true(전체), 미전송 시 활성만. */
  includeInactive?: boolean;
};

type DonationCampaignsPage = {
  content: DonationCampaign[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetDonationCampaignsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: DonationCampaign[] | DonationCampaignsPage;
};

export const DONATION_CAMPAIGNS_QUERY_KEY = 'donation-campaigns';

export const useGetDonationCampaigns = (params: GetDonationCampaignsParams) => {
  const { pageNum, pageSize } = params;
  const organizationId = params.organizationId ?? undefined;
  const includeInactive = params.includeInactive ?? true; // 관리자웹 기본: 전체 조회

  return useQuery<GetDonationCampaignsResponse>({
    queryKey: [DONATION_CAMPAIGNS_QUERY_KEY, pageNum, pageSize, organizationId ?? '', includeInactive],
    queryFn: () =>
      APIService.private.get<GetDonationCampaignsResponse>('/donations/campaigns', {
        params: {
          pageNum,
          pageSize,
          includeInactive,
          ...(organizationId != null ? { organizationId } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};
