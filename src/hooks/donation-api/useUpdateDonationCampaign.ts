import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildDonationCampaignMultipart } from '../../utils/formDataBuilder';
import type { CampaignWriteBody, DonationCampaignMultipartFiles } from './donationApiTypes';
import { DONATION_CAMPAIGNS_QUERY_KEY } from './useGetDonationCampaigns';

export type UpdateDonationCampaignPayload = {
  campaignId: number | string;
  campaignData: CampaignWriteBody;
} & DonationCampaignMultipartFiles;

/**
 * PUT `/donations/campaigns/{id}` — multipart/form-data
 * - `data`: full campaign JSON (lists replace existing when sent)
 * - `image`: optional new thumbnail (omit to keep)
 * - `sectionImage_<i>`: optional new image for section index i (omit to keep data.sections[i].img)
 * - `sections[i].img: null` removes section image without uploading a file
 */
export const useUpdateDonationCampaign = () => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ campaignId, campaignData, image, sectionImages }: UpdateDonationCampaignPayload) => {
      const formData = buildDonationCampaignMultipart(campaignData, { image: image ?? null, sectionImages });
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
