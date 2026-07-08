import { useEffect } from 'react';
import m from './DonationSchoolDetailModal.module.css';
import { InfoField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import ImageZoom from '@components/common/ImageZoom';
import type { DonationSchool } from '../../hooks/donation-api/useDonationSchools';
import { formatIsoDateTime, formatKrw } from '../../features/donations/donationFormatters';
import shared from '@commons/shared.module.css';

type Props = {
  open: boolean;
  school: DonationSchool | null;
  onClose: () => void;
};

export default function DonationSchoolDetailModal({ open, school, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !school) return null;

  const activeInfo = school.active
    ? { label: '활성', cls: 'badgeGreen' }
    : { label: '비활성', cls: 'badgeGray' };

  return (
    <ModalContainer onClose={onClose} modalClassName={m.wideModal}>
      <ModalHeader title='학교 상세' onClose={onClose} />

      <div className={m.body}>
        <div className={m.imageWrap}>
          {school.imageUrl ? (
            <ImageZoom src={school.imageUrl} alt={school.name} title={school.name} className={m.schoolImage} />
          ) : (
            <div className={m.imagePlaceholder}>등록된 이미지가 없습니다.</div>
          )}
        </div>
        <p className={m.imageHint}>이미지는 학교 수정에서 등록·변경할 수 있습니다.</p>

        <div className={m.section}>
          <div className={m.fieldRow}>
            <InfoField label='학교 ID' value={String(school.id)} />
            <div className={m.field}>
              <label className={m.label}>상태</label>
              <div className={m.valueText}>
                <span className={`${shared.badge} ${shared[activeInfo.cls]}`}>{activeInfo.label}</span>
              </div>
            </div>
          </div>
          <InfoField label='학교명' value={school.name} />
          <div className={m.fieldRow}>
            <InfoField label='지역' value={school.regionLabel || '-'} />
            <InfoField label='초성' value={school.initial || '-'} />
          </div>
          <InfoField label='주소' value={school.address || '-'} />
          <InfoField label='설명' value={school.description || '-'} />
          <div className={m.fieldRow}>
            <InfoField label='누적 기부액' value={formatKrw(school.accumulatedAmount)} />
            <InfoField label='등록일' value={formatIsoDateTime(school.createdAt)} />
          </div>
        </div>
      </div>

      <ModalFooter onCancel={onClose} cancelText='닫기' />
    </ModalContainer>
  );
}
