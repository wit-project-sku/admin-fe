// 배너 등록/수정 모달. 등록은 이미지 여러 장 + 같은 대상·기간, 수정은 대상·기간만(이미지는 별도 교체).
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
  /** 있으면 수정 모드(이미지 선택 없음) */
  editing?: BannerDto | null;
  submitting: boolean;
  onClose: () => void;
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

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = '';
    const tooBig = picked.find((f) => f.size > MAX_BANNER_FILE_BYTES);
    if (tooBig) {
      setError(`‘${tooBig.name}’ 이(가) 너무 큽니다(${(tooBig.size / MB).toFixed(1)}MB).`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...picked]);
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
          <span>{isEdit ? '노출 대상·기간 수정' : '배너 등록'}</span>
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={s.modalBody}>
          {error ? <div className={`${s.notice} ${s.noticeErr}`}>{error}</div> : null}

          {isEdit ? (
            <div className={s.warn}>
              이미지는 그대로 두고 <b>노출 대상과 기간만</b> 바꿉니다. 이미지를 바꾸려면 목록에서 <b>이미지 교체</b>를
              쓰세요.
            </div>
          ) : (
            <div className={s.field}>
              <span className={s.fieldLabel}>배너 이미지</span>
              <label className={s.uploadArea}>
                + 이미지 추가
                <span className={s.uploadSub}>여러 장 선택 가능 · 권장 2160 × 573px · 장당 최대 20MB</span>
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
            </div>
          )}

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
            {submitting ? '저장 중…' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
