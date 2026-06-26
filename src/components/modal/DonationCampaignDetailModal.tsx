import { useEffect } from 'react';
import m from './DonationCampaignDetailModal.module.css';
import { InfoField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';
import { CAMPAIGN_STATUS_MAP, DONATION_TYPE_LABEL } from '../../features/donations/donationListConfig';
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
          <div className={m.fieldRow}>
            <InfoField label='주최 단체' value={campaign.organization?.name ?? '미지정'} />
            <InfoField
              label='기부 종류'
              value={
                campaign.organization
                  ? (DONATION_TYPE_LABEL[campaign.organization.type] ?? campaign.organization.type)
                  : '-'
              }
            />
          </div>
          <InfoField label='설명' value={campaign.description || '-'} />
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

        {campaign.programs?.length ? (
          <div className={m.section}>
            <h3 className={m.sectionTitle}>하단 카드</h3>
            {campaign.programs.map((program, index) => (
              <div key={`program-${index}`} className={m.contentCard}>
                <p className={m.cardTitle}>{program.title}</p>
                <p className={m.cardDesc}>{program.desc}</p>
              </div>
            ))}
          </div>
        ) : null}

        {campaign.sections?.length ? (
          <div className={m.section}>
            <h3 className={m.sectionTitle}>콘텐츠 섹션</h3>
            {campaign.sections.map((section, index) => (
              <div key={`section-${index}`} className={m.contentCard}>
                <p className={m.cardTitle}>
                  {section.titleRuns?.length ? (
                    <SectionTitle title={section.title} titleRuns={section.titleRuns} />
                  ) : (
                    section.title
                  )}
                </p>
                <p className={m.cardDesc}>{section.desc}</p>
                {section.img ? (
                  <img src={section.img} alt='' className={m.sectionImage} />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <ModalFooter onCancel={onClose} cancelText='닫기' />
    </ModalContainer>
  );
}

type SectionTitleProps = {
  title: string;
  titleRuns: NonNullable<DonationCampaign['sections'][number]['titleRuns']>;
};

function SectionTitle({ title, titleRuns }: SectionTitleProps) {
  if (!titleRuns.length) return <>{title}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  titleRuns.forEach((run, index) => {
    const idx = title.indexOf(run.text, cursor);
    if (idx === -1) return;

    if (idx > cursor) {
      parts.push(<span key={`plain-${index}`}>{title.slice(cursor, idx)}</span>);
    }

    parts.push(
      <span
        key={`run-${index}`}
        style={{
          fontWeight: run.bold ? 700 : undefined,
          color: run.color || undefined,
        }}
      >
        {run.text}
      </span>,
    );
    cursor = idx + run.text.length;
  });

  if (cursor < title.length) {
    parts.push(<span key='tail'>{title.slice(cursor)}</span>);
  }

  return <>{parts.length ? parts : title}</>;
}
