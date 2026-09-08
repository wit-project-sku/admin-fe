// 배너 등록/수정 모달.
//  · 등록: 이미지 여러 장 + 같은 대상·기간 → 장수만큼 배너 생성
//  · 수정: 이미지·대상·기간을 한 화면에서 고치고 한 번에 저장(의상/기부 정보 수정과 동일한 방식)
import { useEffect, useRef, useState } from 'react';

import type { BannerDto, BannerTargetType } from '@/hooks/kiosk-api/bannerTypes';
import { MAX_BANNER_FILE_BYTES } from '@/hooks/kiosk-api/bannerTypes';
import type { BannerTargetPayload } from '@/hooks/kiosk-api/useBannerMutations';
import type { ParsedKiosk } from './bannerKiosk';
import { BannerTargetPicker } from './BannerTargetPicker';
import s from './BannerManage.module.css';

const MB = 1024 * 1024;

type Props = {
  kiosks: ParsedKiosk[];
  /** 있으면 수정 모드 */
  editing?: BannerDto | null;
  submitting: boolean;
  onClose: () => void;
  /** 수정 모드에서 images 는 0장(유지) 또는 1장(교체) */
  onSubmit: (payload: BannerTargetPayload, images: File[]) => void;
};

export function BannerFormModal({ kiosks, editing, submitting, onClose, onSubmit }: Props) {
  const isEdit = !!editing;
  const [targetType, setTargetType] = useState<BannerTargetType>(editing?.targetType ?? 'ALL');
  const [selectedIds, setSelectedIds] = useState<number[]>(editing?.kioskIds ?? []);
  const [startDate, setStartDate] = useState(editing?.startDate ?? '');
  const [endDate, setEndDate] = useState(editing?.endDate ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 수정 모드에서 고른 새 이미지 미리보기(revoke 까지 책임진다).
  const [replaceUrl, setReplaceUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isEdit || files.length === 0) return setReplaceUrl(null);
    const url = URL.createObjectURL(files[0]);
    setReplaceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isEdit, files]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = '';
    const tooBig = picked.find((f) => f.size > MAX_BANNER_FILE_BYTES);
    if (tooBig) {
      setError(`‘${tooBig.name}’ 이(가) 너무 큽니다(${(tooBig.size / MB).toFixed(1)}MB).`);
      return;
    }
    setError(null);
    // 수정은 1장만 교체한다 — 마지막에 고른 것으로 덮어쓴다.
    setFiles(isEdit ? picked.slice(-1) : (prev) => [...prev, ...picked]);
  };

  const submit = () => {
    if (!isEdit && files.length === 0) return setError('배너 이미지를 1장 이상 선택해 주세요.');
    if (targetType === 'SELECTED' && selectedIds.length === 0)
      return setError('노출할 키오스크를 1곳 이상 선택해 주세요.');
    if (startDate && endDate && endDate < startDate)
      return setError('종료일은 시작일보다 빠를 수 없습니다.');
    setError(null);
    onSubmit(
      {
        targetType,
        ...(targetType === 'SELECTED' ? { kioskIds: selectedIds } : {}),
        startDate: startDate || null,
        endDate: endDate || null,
      },
      files,
    );
  };

  return (
    <div className={s.dim} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <span>{isEdit ? '배너 정보 수정' : '배너 등록'}</span>
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={s.modalBody}>
          {error ? <div className={`${s.notice} ${s.noticeErr}`}>{error}</div> : null}

          <div className={s.sizeGuide}>
            배너 이미지 사이즈는 <b>2160 × 573</b> 으로 맞춰주세요.
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>배너 이미지</span>

            {isEdit ? (
              <>
                <div className={s.detailImgWrap}>
                  <img
                    className={s.detailImg}
                    src={replaceUrl ?? editing!.imageUrl}
                    alt="배너 이미지"
                  />
                </div>
                <div className={s.modalActions}>
                  <label className={s.iconBtn} style={{ lineHeight: '30px' }}>
                    이미지 변경
                    <input
                      ref={fileRef}
                      type="file"
                      className={s.fileInput}
                      accept="image/*"
                      onChange={pick}
                    />
                  </label>
                  {files.length > 0 ? (
                    <button type="button" className={s.iconBtn} onClick={() => setFiles([])}>
                      되돌리기
                    </button>
                  ) : null}
                  <span className={s.uploadSub} style={{ alignSelf: 'center' }}>
                    {files.length > 0
                      ? `새 이미지: ${files[0].name} · 저장 시 교체됩니다`
                      : '바꾸지 않으면 기존 이미지가 유지됩니다'}
                  </span>
                </div>
                {files.length > 0 ? (
                  <div className={s.warn}>
                    이미지를 교체하면 이 배너가 걸린 <b>{editing!.kioskCount}개 키오스크에 즉시 반영</b>됩니다.
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <label className={s.uploadArea}>
                  + 이미지 추가
                  <span className={s.uploadSub}>여러 장 선택 가능 · 2160 × 573px · 장당 최대 20MB</span>
                  <input
                    ref={fileRef}
                    type="file"
                    className={s.fileInput}
                    accept="image/*"
                    multiple
                    onChange={pick}
                  />
                </label>
                {files.length > 0 ? (
                  <div className={s.pickedList}>
                    {files.map((f, i) => (
                      <div className={s.pickedItem} key={`${f.name}-${i}`}>
                        <img className={s.pickedThumb} src={URL.createObjectURL(f)} alt="" />
                        <span style={{ flex: 1 }}>{f.name}</span>
                        <span className={s.checkCode}>{(f.size / MB).toFixed(1)}MB</span>
                        <button
                          type="button"
                          className={s.iconBtn}
                          onClick={() => setFiles(files.filter((_, x) => x !== i))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <span className={s.uploadSub}>{files.length}장 → 각각 배너로 등록됩니다</span>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>노출 대상</span>
            <BannerTargetPicker
              kiosks={kiosks}
              targetType={targetType}
              selectedIds={selectedIds}
              onChangeType={setTargetType}
              onChangeIds={setSelectedIds}
            />
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>노출 기간</span>
            <div className={s.dateRow}>
              <input
                type="date"
                className={s.dateInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className={s.checkCode}>~</span>
              <input
                type="date"
                className={s.dateInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <span className={s.uploadSub}>비워 두면 상시 노출(시작=즉시, 종료=무기한)</span>
          </div>
        </div>

        <div className={s.modalFoot}>
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            취소
          </button>
          <button type="button" className={s.primaryBtn} onClick={submit} disabled={submitting}>
            {submitting ? '저장 중…' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
