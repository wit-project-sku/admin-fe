import { useEffect } from 'react';
import m from './DonationCampaignDetailModal.module.css';
import { InfoField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import ImageZoom from '@components/common/ImageZoom';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';
import { CAMPAIGN_STATUS_MAP } from '../../features/donations/donationListConfig';
import {
  formatAmountOptions,
  formatCampaignProgress,
  formatIsoDateTime,
  formatKrw,
} from '../../features/donations/donationFormatters';
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

  const effects = (campaign.effects ?? []).filter((e) => e && e.trim());

  return (
    <ModalContainer onClose={onClose} modalClassName={m.wideModal}>
      <ModalHeader title='캠페인 상세' onClose={onClose} />

      <div className={m.body}>
        <div className={m.imageWrap}>
          {campaign.imageUrl ? (
            <ImageZoom src={campaign.imageUrl} alt={campaign.name} title={campaign.name} className={m.campaignImage} />
          ) : (
            <div className={m.imagePlaceholder}>등록된 이미지가 없습니다.</div>
          )}
        </div>
        <p className={m.imageHint}>이미지는 캠페인 수정에서 등록·변경할 수 있습니다.</p>

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
          <InfoField label='주최 단체' value={campaign.organization?.name ?? '미지정'} />
          <InfoField label='설명' value={campaign.description || '-'} />
          <InfoField label='배너 상단 문구' value={campaign.bannerSubtitle || '-'} />
          <InfoField label='배너 큰 문구' value={campaign.bannerTitle || '-'} />
          <div className={m.fieldRow}>
            <InfoField label='목표 금액' value={formatKrw(campaign.targetAmount)} />
            <InfoField label='모금 금액' value={formatKrw(campaign.accumulatedAmount)} />
          </div>
          <div className={m.fieldRow}>
            <InfoField
              label='달성률'
              value={formatCampaignProgress(campaign.accumulatedAmount, campaign.targetAmount)}
            />
            <InfoField label='등록일' value={formatIsoDateTime(campaign.createdAt)} />
          </div>
          <InfoField label='기부 금액 옵션' value={formatAmountOptions(campaign.amountOptions)} />
        </div>

        {effects.length ? (
          <div className={m.section}>
            <h3 className={m.sectionTitle}>기대효과</h3>
            <div className={m.effectChips}>
              {effects.map((effect, index) => (
                <div key={`effect-${index}`} className={m.effectChip}>
                  <span className={m.effectNumber}>{index + 1}</span>
                  <span className={m.effectText}>{effect}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ModalFooter onCancel={onClose} cancelText='닫기' />
    </ModalContainer>
  );
}
