import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { DonationCampaign } from './useGetDonationCampaigns';
import { DONATION_CAMPAIGNS_QUERY_KEY } from './useGetDonationCampaigns';

export type GetDonationCampaignByIdResponse = {
  success: boolean;
  code: number;
  message: string;
  data: DonationCampaign;
};

export const useGetDonationCampaignById = (campaignId: number | string | null | undefined, enabled = true) => {
  return useQuery<GetDonationCampaignByIdResponse>({
    queryKey: [DONATION_CAMPAIGNS_QUERY_KEY, 'detail', campaignId],
    queryFn: () => APIService.private.get(`/donations/campaigns/${campaignId}`),
    enabled: enabled && campaignId != null && campaignId !== '',
  });
};
