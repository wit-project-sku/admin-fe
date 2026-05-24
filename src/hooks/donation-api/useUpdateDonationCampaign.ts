import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildDonationCampaignMultipart } from '../../utils/formDataBuilder';
import type { CampaignWriteBody } from './donationApiTypes';
import { DONATION_CAMPAIGNS_QUERY_KEY } from './useGetDonationCampaigns';

export type UpdateDonationCampaignPayload = {
  campaignId: number | string;
  campaignData: CampaignWriteBody;
  image?: File | null;
};

/** PUT `/donations/campaigns/{id}` — multipart `data` (JSON) + optional `image` (omit to keep existing). */
export const useUpdateDonationCampaign = () => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ campaignId, campaignData, image }: UpdateDonationCampaignPayload) => {
      const formData = buildDonationCampaignMultipart(campaignData, image ?? null);
      return await APIService.private.put(`/donations/campaigns/${campaignId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_CAMPAIGNS_QUERY_KEY] });
    },
  });

  return { updateCampaign: mutate, updateCampaignAsync: mutateAsync, isPending, error };
};
