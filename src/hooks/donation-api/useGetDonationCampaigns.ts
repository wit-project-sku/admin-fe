import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type DonationCampaignStatus = 'ACTIVE' | 'INACTIVE' | string;

export type DonationCampaign = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  status: DonationCampaignStatus;
  amountOptions: number[];
  createdAt: string;
};

export type GetDonationCampaignsParams = {
  pageNum: number;
  pageSize: number;
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

  return useQuery<GetDonationCampaignsResponse>({
    queryKey: [DONATION_CAMPAIGNS_QUERY_KEY, pageNum, pageSize],
    queryFn: () =>
      APIService.private.get('/donations/campaigns/admin', {
        params: { pageNum, pageSize },
      }),
    placeholderData: keepPreviousData,
  });
};
