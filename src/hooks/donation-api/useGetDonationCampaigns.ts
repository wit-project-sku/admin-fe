import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type {
  CampaignAmountOption,
  CampaignProgram,
  CampaignSection,
  DonationOrganizationSummary,
  DonationTypeCode,
} from './donationApiTypes';

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
  amountOptions: CampaignAmountOption[];
  sections: CampaignSection[];
  programs: CampaignProgram[];
  createdAt: string;
};

export type GetDonationCampaignsParams = {
  pageNum: number;
  pageSize: number;
  /** 기부 종류 필터 (미전송 시 전체). */
  type?: DonationTypeCode | '';
  /** 단체 ID 필터 (미전송 시 전체). */
  organizationId?: number | null;
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
  const type = params.type || undefined;
  const organizationId = params.organizationId ?? undefined;

  return useQuery<GetDonationCampaignsResponse>({
    queryKey: [DONATION_CAMPAIGNS_QUERY_KEY, pageNum, pageSize, type ?? '', organizationId ?? ''],
    queryFn: () =>
      APIService.private.get<GetDonationCampaignsResponse>('/donations/campaigns/admin', {
        params: {
          pageNum,
          pageSize,
          ...(type ? { type } : {}),
          ...(organizationId != null ? { organizationId } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};
