import shared from '@commons/shared.module.css';
import ImageZoom from '@components/common/ImageZoom';
import { InfoField, ModalContainer, ModalHeader } from './ModalElements';
import s from '../../features/installations/Installations.module.css';
import { INSTALLATION_MESSAGES } from '../../features/installations/installationConfig';
import { useInstallation } from '../../hooks/installation-api/useInstallations';
import type { InstallationDetailDto } from '../../hooks/installation-api/installationTypes';

/** `2026-11-02T10:30:00` → `2026-11-02 10:30` */
const formatDateTime = (value: string): string => value.replace('T', ' ').slice(0, 16);

type InstallationDetailModalProps = {
  installationId: number;
  onClose: () => void;
  onEdit: (row: InstallationDetailDto) => void;
  onDelete: (row: InstallationDetailDto) => void;
};

/** 설치 정보 상세(읽기 전용). 담당자 연락처는 여기서만 보인다. 사진을 누르면 크게 본다. */
export default function InstallationDetailModal({
  installationId,
  onClose,
  onEdit,
  onDelete,
}: InstallationDetailModalProps) {
  const { installation, isPending, isError } = useInstallation(installationId);

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title='설치 정보 상세' onClose={onClose} />
      {isPending ? (
        <div className={s.loading}>불러오는 중...</div>
      ) : isError || !installation ? (
        <div className={s.loading}>{INSTALLATION_MESSAGES.detailLoadError}</div>
      ) : (
        <>
          <div className={s.body}>
            {installation.imageUrls.length > 0 ? (
              <div className={s.detailImages}>
                {installation.imageUrls.map((url) => (
                  <ImageZoom
                    key={url}
                    src={url}
                    alt={`${installation.clientName} 설치 사진`}
                    title='설치 사진'
                    className={s.detailImage}
                  />
                ))}
              </div>
            ) : null}
            <div className={s.row}>
              <InfoField label='키오스크' value={installation.kioskName} />
              <InfoField label='설치일' value={installation.installedAt} />
            </div>
            <InfoField label='클라이언트' value={installation.clientName} />
            <InfoField label='설치 주소' value={installation.address} />
            <InfoField label='설치 지점' value={installation.siteName || '—'} />
            <div className={s.row}>
              <InfoField label='담당자 이름' value={installation.managerName || '—'} />
              <InfoField label='담당자 연락처' value={installation.managerPhone || '—'} />
            </div>
            <InfoField label='상세 내용'>
              <span className={s.detailText}>{installation.detail?.trim() || '—'}</span>
            </InfoField>
            <InfoField label='관리 메모'>
              <span className={s.detailText}>{installation.memo?.trim() || '—'}</span>
            </InfoField>
            <div className={s.row}>
              <InfoField label='등록 시각' value={formatDateTime(installation.createdAt)} />
              <InfoField label='수정 시각' value={formatDateTime(installation.updatedAt)} />
            </div>
          </div>
          <div className={s.detailActions}>
            <button type='button' className={shared.btnOutline} onClick={() => onDelete(installation)}>
              삭제
            </button>
            <button type='button' className={shared.btnPrimary} onClick={() => onEdit(installation)}>
              수정
            </button>
          </div>
        </>
      )}
    </ModalContainer>
  );
}
