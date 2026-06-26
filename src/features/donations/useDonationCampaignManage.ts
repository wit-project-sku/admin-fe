import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';
import { DONATION_CAMPAIGNS_QUERY_KEY } from '../../hooks/donation-api/useGetDonationCampaigns';
import { useDeleteDonationCampaign } from '../../hooks/donation-api/useDeleteDonationCampaign';
import { CAMPAIGN_TABLE_MESSAGES } from './donationListConfig';

export function useDonationCampaignManage() {
  const queryClient = useQueryClient();
  const { deleteCampaignAsync, isPending: isDeleting } = useDeleteDonationCampaign();

  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [DONATION_CAMPAIGNS_QUERY_KEY] });
  }, [queryClient]);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedCampaign(null);
    setShowManageModal(true);
  }, []);

  const openEdit = useCallback((campaign: DonationCampaign) => {
    setModalMode('edit');
    setSelectedCampaign(campaign);
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((campaign: DonationCampaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedCampaign?.id == null) return;
    try {
      await deleteCampaignAsync(selectedCampaign.id);
      setShowDeleteModal(false);
      refetch();
    } catch {
      alert(CAMPAIGN_TABLE_MESSAGES.deleteFailed);
    }
  }, [selectedCampaign, deleteCampaignAsync, refetch]);

  return {
    showManageModal,
    setShowManageModal,
    showDeleteModal,
    setShowDeleteModal,
    modalMode,
    selectedCampaign,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
    refetch,
  };
}
