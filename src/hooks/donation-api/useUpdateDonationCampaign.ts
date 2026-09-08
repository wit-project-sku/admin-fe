import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildDataImageMultipart } from '../../utils/formDataBuilder';
import type { CampaignWriteBody, DonationCampaignMultipartFiles } from './donationApiTypes';
import { DONATION_CAMPAIGNS_QUERY_KEY } from './useGetDonationCampaigns';

export type UpdateDonationCampaignPayload = {
  campaignId: number | string;
  campaignData: CampaignWriteBody;
} & DonationCampaignMultipartFiles;

/**
 * PUT `/admin/donations/campaigns/{id}` — multipart/form-data
 * - `data`: 캠페인 JSON (effects 는 전송 시 통째로 교체, 미전송 시 기존 유지)
 * - `image`: 새 썸네일(미전송 시 기존 유지)
 */
export const useUpdateDonationCampaign = () => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ campaignId, campaignData, image }: UpdateDonationCampaignPayload) => {
      const formData = buildDataImageMultipart(campaignData, image ?? null);
      return await APIService.private.put(`/admin/donations/campaigns/${campaignId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_CAMPAIGNS_QUERY_KEY] });
    },
  });

  return { updateCampaign: mutate, updateCampaignAsync: mutateAsync, isPending, error };
};
