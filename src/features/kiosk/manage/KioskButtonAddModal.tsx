import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import { useCreateKioskButton } from '@/hooks/kiosk-api/useCreateKioskButton';
import { SPAN_OPTIONS } from '@/features/kiosk/manage/constants';
import styles from '@/features/kiosk/manage/KioskAppManagePage.module.css';

export type KioskSelectOption = { value: string; label: string; sublabel?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  kioskOptions: KioskSelectOption[];
  /** When set (e.g. WITH별 탭), pre-fill WITH. */
  defaultKioskId?: string;
};

type FormErrors = {
  kioskId?: string;
  buttonType?: string;
  buttonName?: string;
};

function messageFromError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  const ax = err as AxiosError<{ message?: string }>;
  const msg = ax.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  return '버튼을 추가하지 못했습니다. 다시 시도해주세요.';
}

export function KioskButtonAddModal({ open, onClose, kioskOptions, defaultKioskId }: Props) {
  const uid = useId();
  const { createKioskButtonAsync, isPending, reset: resetMutation } = useCreateKioskButton();
  const [buttonType, setButtonType] = useState('');
  const [buttonName, setButtonName] = useState('');
  const [kioskId, setKioskId] = useState('');
  const [span, setSpan] = useState<number>(1);
  const [iconKey, setIconKey] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const firstKiosk = kioskOptions[0]?.value ?? '';

  useEffect(() => {
    if (!open) return;
    resetMutation();
    setFieldErrors({});
    setFormError(null);
    setButtonType('');
    setButtonName('');
    setSpan(1);
    setIconKey('');
    const initial =
      defaultKioskId && kioskOptions.some((o) => o.value === defaultKioskId)
        ? defaultKioskId
        : firstKiosk;
    setKioskId(initial);
  }, [open, defaultKioskId, firstKiosk, kioskOptions, resetMutation]);

  const canSubmit = useMemo(() => !isPending, [isPending]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const nextErrors: FormErrors = {};
      setFormError(null);
      if (kioskOptions.length === 0) {
        nextErrors.kioskId = '선택 가능한 WITH가 없습니다.';
      } else if (kioskId === '' || !kioskOptions.some((o) => o.value === kioskId)) {
        nextErrors.kioskId = 'WITH를 선택해주세요.';
      }
      const typeTrim = buttonType.trim();
      const nameTrim = buttonName.trim();
      if (!nameTrim) {
        nextErrors.buttonName = '버튼 이름을 입력해주세요.';
      }
      if (!typeTrim) {
        nextErrors.buttonType = '버튼 타입(별칭)을 입력해주세요.';
      }
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      const kid = Number(kioskId);
      const iconTrim = iconKey.trim();
      try {
        // 위치(열/칸)·상태는 보내지 않는다 — 서버가 다음 빈 칸에 자동 배치한다.
        // iconKey 는 비우면 null(미지정) — 추후 수정에서 지정 가능.
        await createKioskButtonAsync({
          kioskId: kid,
          buttonType: typeTrim,
          buttonName: nameTrim,
          span,
          iconKey: iconTrim ? iconTrim : null,
        });
        onClose();
      } catch (err) {
        setFormError(messageFromError(err));
      }
    },
    [kioskId, buttonType, buttonName, span, iconKey, kioskOptions, createKioskButtonAsync, onClose],
  );

  if (!open) return null;

  return (
    <div className={styles.overlay} role='presentation' onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={`${uid}-add-title`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <span id={`${uid}-add-title`} className={styles.modalTitle}>
            새 버튼 추가
          </span>
          <button type='button' className={shared.btnOutline} onClick={onClose} aria-label='닫기'>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className={styles.modalBody}>
            {kioskOptions.length === 0 ? (
              <p className={styles.formHint}>WITH 목록을 불러오는 중이거나 등록된 WITH가 없습니다.</p>
            ) : (
              <>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${uid}-kiosk`}>
                    WITH
                  </label>
                  <SearchableSelect
                    aria-label='WITH'
                    options={kioskOptions}
                    value={kioskId}
                    onChange={(v) => {
                      setKioskId(v);
                      setFieldErrors((prev) => ({ ...prev, kioskId: undefined }));
                    }}
                    className={fieldErrors.kioskId ? styles.selectError : undefined}
                    minWidth='100%'
                  />
                  {fieldErrors.kioskId ? <p className={styles.fieldError}>{fieldErrors.kioskId}</p> : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${uid}-name`}>
                    버튼 이름
                  </label>
                  <input
                    id={`${uid}-name`}
                    type='text'
                    className={`${styles.input} ${fieldErrors.buttonName ? styles.inputError : ''}`}
                    value={buttonName}
                    onChange={(e) => {
                      setButtonName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, buttonName: undefined }));
                    }}
                    placeholder='예: 맛집 추천'
                    autoComplete='off'
                    required
                  />
                  {fieldErrors.buttonName ? <p className={styles.fieldError}>{fieldErrors.buttonName}</p> : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${uid}-type`}>
                    버튼 타입 (별칭)
                  </label>
                  <input
                    id={`${uid}-type`}
                    type='text'
                    className={`${styles.input} ${fieldErrors.buttonType ? styles.inputError : ''}`}
                    value={buttonType}
                    onChange={(e) => {
                      setButtonType(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, buttonType: undefined }));
                    }}
                    placeholder='예: 뭐먹지'
                    autoComplete='off'
                    required
                  />
                  {fieldErrors.buttonType ? <p className={styles.fieldError}>{fieldErrors.buttonType}</p> : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${uid}-span`}>
                    폭
                  </label>
                  <select
                    id={`${uid}-span`}
                    className={styles.select}
                    value={span}
                    onChange={(e) => setSpan(Number(e.target.value))}
                  >
                    {SPAN_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${uid}-icon`}>
                    아이콘 key (선택)
                  </label>
                  <input
                    id={`${uid}-icon`}
                    type='text'
                    className={styles.input}
                    value={iconKey}
                    onChange={(e) => setIconKey(e.target.value)}
                    placeholder='예: map (비우면 미지정 — 추후 수정에서 지정 가능)'
                    autoComplete='off'
                  />
                </div>
                <p className={styles.formHint} style={{ marginTop: 0 }}>
                  위치는 지정하지 않아도 됩니다 — 그리드의 다음 빈 칸에 자동 배치됩니다.
                </p>
              </>
            )}
            {formError ? (
              <p className={styles.formError} role='alert'>
                {formError}
              </p>
            ) : null}
          </div>
          <div className={styles.modalFooter}>
            <button type='button' className={shared.btnOutline} onClick={onClose} disabled={isPending}>
              취소
            </button>
            <button type='submit' className={shared.btnPrimary} disabled={!canSubmit}>
              {isPending ? '추가 중…' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
