import { useEffect } from 'react';
import m from './DonationHistoryDetailModal.module.css';
import { InfoField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import ImageZoom from '@components/common/ImageZoom';
import type { DonationHistoryItem } from '../../hooks/donation-api/useGetDonationHistory';
import {
  DONATION_STATUS_MAP,
  DONATION_TYPE_LABEL,
  PAYMENT_METHOD_MAP,
} from '../../features/donations/donationListConfig';
import { formatIsoDateTime, formatKrw } from '../../features/donations/donationFormatters';
import shared from '@commons/shared.module.css';

type Props = {
  open: boolean;
  item: DonationHistoryItem | null;
  onClose: () => void;
};

export default function DonationHistoryDetailModal({ open, item, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !item) return null;

  const statusInfo = DONATION_STATUS_MAP[item.status] ?? {
    label: item.status ?? '-',
    cls: 'badgeGray',
  };
  const paymentLabel = PAYMENT_METHOD_MAP[item.paymentMethod] ?? item.paymentMethod ?? '-';

  return (
    <ModalContainer onClose={onClose} modalClassName={m.wideModal}>
      <ModalHeader title='기부 내역 상세' onClose={onClose} />

      <div className={m.body}>
        {item.photoUrl ? (
          <div className={m.imageWrap}>
            <ImageZoom src={item.photoUrl} alt={item.donatorName} title={item.donatorName} className={m.photo} />
          </div>
        ) : null}

        <div className={m.section}>
          <div className={m.fieldRow}>
            <InfoField label='내역 ID' value={String(item.id)} />
            <InfoField label='주문번호' value={item.merchantUid} />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='캠페인' value={item.campaignName} />
            <InfoField label='기부자' value={item.donatorName} />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='주최 단체' value={item.organizationName ?? '미지정'} />
            <InfoField
              label='기부 종류'
              value={item.type ? (DONATION_TYPE_LABEL[item.type] ?? item.type) : '-'}
            />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='기부 금액' value={formatKrw(item.totalAmount)} />
            <InfoField label='결제 수단' value={paymentLabel} />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='기부 일시' value={formatIsoDateTime(item.donatedAt)} />
            <div className={m.field}>
              <label className={m.label}>상태</label>
              <div className={m.valueText}>
                <span className={`${shared.badge} ${shared[statusInfo.cls]}`}>{statusInfo.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter onCancel={onClose} cancelText='닫기' />
    </ModalContainer>
  );
}
