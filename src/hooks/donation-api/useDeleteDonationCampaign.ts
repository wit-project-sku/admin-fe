import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { DONATION_CAMPAIGNS_QUERY_KEY } from './useGetDonationCampaigns';

export const useDeleteDonationCampaign = () => {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (campaignId: number | string) => {
      return await APIService.private.delete(`/admin/donations/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_CAMPAIGNS_QUERY_KEY] });
    },
  });

  return { deleteCampaign: mutate, deleteCampaignAsync: mutateAsync, isPending, error };
};
