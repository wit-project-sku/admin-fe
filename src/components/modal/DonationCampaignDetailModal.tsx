import { useEffect } from 'react';
import m from './DonationCampaignDetailModal.module.css';
import { InfoField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';
import { CAMPAIGN_STATUS_MAP } from '../../features/donations/donationListConfig';
import { formatAmountOptions, formatIsoDateTime } from '../../features/donations/donationFormatters';
import shared from '@commons/shared.module.css';

type Props = {
  open: boolean;
  campaign: DonationCampaign | null;
  onClose: () => void;
};

export default function DonationCampaignDetailModal({ open, campaign, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !campaign) return null;

  const statusInfo = CAMPAIGN_STATUS_MAP[campaign.status] ?? {
    label: campaign.status ?? '-',
    cls: 'badgeGray',
  };

  return (
    <ModalContainer onClose={onClose} modalClassName={m.wideModal}>
      <ModalHeader title='캠페인 상세' onClose={onClose} />

      <div className={m.body}>
        {campaign.imageUrl ? (
          <div className={m.imageWrap}>
            <img src={campaign.imageUrl} alt={campaign.name} className={m.campaignImage} />
          </div>
        ) : null}

        <div className={m.section}>
          <div className={m.fieldRow}>
            <InfoField label='캠페인 ID' value={String(campaign.id)} />
            <div className={m.field}>
              <label className={m.label}>상태</label>
              <div className={m.valueText}>
                <span className={`${shared.badge} ${shared[statusInfo.cls]}`}>{statusInfo.label}</span>
              </div>
            </div>
          </div>
          <InfoField label='캠페인명' value={campaign.name} />
          <InfoField label='설명' value={campaign.description || '-'} />
          <div className={m.fieldRow}>
            <InfoField label='기부 금액 옵션' value={formatAmountOptions(campaign.amountOptions)} />
            <InfoField label='등록일' value={formatIsoDateTime(campaign.createdAt)} />
          </div>
        </div>
      </div>

      <ModalFooter onCancel={onClose} cancelText='닫기' />
    </ModalContainer>
  );
}
