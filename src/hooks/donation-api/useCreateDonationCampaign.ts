import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildDonationCampaignMultipart } from '../../utils/formDataBuilder';
import type { CampaignWriteBody } from './donationApiTypes';
import { DONATION_CAMPAIGNS_QUERY_KEY } from './useGetDonationCampaigns';

export type CreateDonationCampaignPayload = {
  campaignData: CampaignWriteBody;
  image?: File | null;
};

export const useCreateDonationCampaign = () => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ campaignData, image }: CreateDonationCampaignPayload) => {
      const formData = buildDonationCampaignMultipart(campaignData, image);
      return await APIService.private.post('/donations/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_CAMPAIGNS_QUERY_KEY] });
    },
  });

  return { createCampaign: mutate, createCampaignAsync: mutateAsync, isPending, error };
};
