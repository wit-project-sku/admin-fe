import { useEffect, useState, type ReactNode } from 'react';
import { Copy, Trash2, User } from 'lucide-react';
import { ModalContainer, ModalHeader } from '@modals/ModalElements';
import zoom from '@components/common/ImageZoom.module.css';

import type {
  BodyMeasurementDetail,
  BodyMeasurementListItem,
} from '../../hooks/body-measurement-api/bodyMeasurementTypes';
import {
  fmtCm,
  fmtConfidenceVersion,
  fmtGenderNationality,
  fmtHeightDiff,
  fmtOutfitShot,
  fmtShotSecond,
  kioskShortName,
  shortEventId,
} from './bodyMeasurementFormat';
import s from './BodyMeasurements.module.css';

type Props = {
  /** 목록에서 고른 행 — 상세가 오기 전에도 값을 먼저 보여 준다. */
  row: BodyMeasurementListItem;
  detail: BodyMeasurementDetail | null;
  detailPending: boolean;
  detailError: boolean;
  /** 다시 받은 주소로도 원본 사진이 깨졌다. */
  photoBroken: boolean;
  onPhotoError: () => void;
  onCopyEventId: (eventId: string) => void;
  onDelete: () => void;
  deleting: boolean;
};

function Kv({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.kvItem}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** 표 아래 상세 — 왼쪽 원본 사진(누르면 크게), 오른쪽 값들, 오른쪽 아래 삭제. */
export function BodyMeasurementDetailPanel({
  row,
  detail,
  detailPending,
  detailError,
  photoBroken,
  onPhotoError,
  onCopyEventId,
  onDelete,
  deleting,
}: Props) {
  const [zoomOpen, setZoomOpen] = useState(false);
  // 상세가 오면 상세 값을, 오기 전엔 목록 값을 쓴다(모양이 같다).
  const d: BodyMeasurementListItem = detail ?? row;
  const photoUrl = detail?.photoUrl ?? null;
  const showPhoto = !!photoUrl && !photoBroken;

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen]);

  const inputHeight = d.shooter?.heightCm ?? null;
  const diff = fmtHeightDiff(d.heightCm, inputHeight);
  const genderNat = fmtGenderNationality(d.shooter, 'name');
  const kioskName = kioskShortName(d.kioskName);

  let photo: ReactNode;
  if (detailPending) {
    photo = <div className={s.photoBox} aria-busy='true' />;
  } else if (showPhoto) {
    photo = (
      <button type='button' className={s.photoBox} onClick={() => setZoomOpen(true)} title='크게 보기'>
        <img src={photoUrl} alt='원본 촬영 사진' className={s.photoImg} onError={onPhotoError} />
      </button>
    );
  } else {
    photo = (
      <div className={s.photoBox}>
        <span className={s.photoEmpty}>
          <User size={28} />
          {photoBroken ? '사진을 불러오지 못했습니다' : '사진 없음'}
        </span>
      </div>
    );
  }

  return (
    <section className={s.detailCard} aria-label='선택한 촬영 상세'>
      {photo}

      <div className={s.detailBody}>
        <div className={s.detailHead}>
          <h2 className={s.detailTitle}>
            {fmtShotSecond(d.shotAt)} · {kioskName}
          </h2>
          <button
            type='button'
            className={s.eventChip}
            title={`${d.eventId} — 눌러서 전체 복사`}
            aria-label='eventId 전체 복사'
            onClick={() => onCopyEventId(d.eventId)}
          >
            {shortEventId(d.eventId)}
            <Copy size={12} />
          </button>
          {detailError ? (
            <span className={`${s.detailState} ${s.detailStateError}`}>상세 정보를 불러오지 못했습니다.</span>
          ) : null}
        </div>

        <dl className={s.kvGrid}>
          <Kv label='측정 키'>{fmtCm(d.heightCm)}</Kv>
          <Kv label='입력 키'>
            {fmtCm(inputHeight)}
            {diff != null ? (
              <span className={s.diff} title='측정 키 − 입력 키'>
                ({diff})
              </span>
            ) : null}
          </Kv>
          <Kv label='어깨 폭'>{fmtCm(d.shoulderWidthCm)}</Kv>
          <Kv label='가슴 폭'>{fmtCm(d.chestWidthCm)}</Kv>
          <Kv label='허리 폭'>{fmtCm(d.waistWidthCm)}</Kv>
          <Kv label='엉덩이 폭'>{fmtCm(d.hipWidthCm)}</Kv>
          <Kv label='신뢰도 · 방식 버전'>{fmtConfidenceVersion(d.confidence, d.version)}</Kv>
          <Kv label='의상 · 촬영'>{fmtOutfitShot(d.outfitCode, d.shotType, d.isSuccess)}</Kv>
          <Kv label='성별 · 국적'>{genderNat ?? <span className={s.muted}>미입력</span>}</Kv>
        </dl>

        <div className={s.detailFooter}>
          <button type='button' className={s.btnDangerOutline} onClick={onDelete} disabled={deleting}>
            <Trash2 size={13} />
            이 촬영 데이터 삭제
          </button>
        </div>
      </div>

      {zoomOpen && showPhoto ? (
        <ModalContainer onClose={() => setZoomOpen(false)} modalClassName={zoom.previewModal}>
          <ModalHeader title={`${fmtShotSecond(d.shotAt)} · ${kioskName}`} onClose={() => setZoomOpen(false)} />
          <div className={zoom.previewBody}>
            <img src={photoUrl} alt='원본 촬영 사진' className={zoom.previewImg} onError={onPhotoError} />
          </div>
        </ModalContainer>
      ) : null}
    </section>
  );
}
