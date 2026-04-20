import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import { useCreateKioskButton } from '@/hooks/kiosk-api/useCreateKioskButton';
import { KioskIconPicker } from '@/features/kiosk/kioskAppIcons';
import { POSITIONS } from '@/features/kiosk/manage/constants';
import { resolveKioskButtonIconKey } from '@/features/kiosk/manage/kioskButtonDisplay';
import styles from '@/features/kiosk/manage/KioskAppManagePage.module.css';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type KioskSelectOption = { value: string; label: string; sublabel?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  kioskOptions: KioskSelectOption[];
  /** When set (e.g. 키오스크별 탭), pre-fill kiosk. */
  defaultKioskId?: string;
};

type FormErrors = {
  kioskId?: string;
  buttonType?: string;
  buttonName?: string;
  position?: string;
  status?: string;
  iconKey?: string;
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
  const [position, setPosition] = useState<number>(3);
  const [iconKey, setIconKey] = useState('map');
  const [status, setStatus] = useState<string>('ACTIVE');
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
    setPosition(3);
    setIconKey('map');
    setStatus('ACTIVE');
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
        nextErrors.kioskId = '선택 가능한 키오스크가 없습니다.';
      } else if (kioskId === '' || !kioskOptions.some((o) => o.value === kioskId)) {
        nextErrors.kioskId = '키오스크를 선택해주세요.';
      }
      const typeTrim = buttonType.trim();
      const nameTrim = buttonName.trim();
      if (!nameTrim) {
        nextErrors.buttonName = '버튼 이름을 입력해주세요.';
      }
      if (!typeTrim) {
        nextErrors.buttonType = '버튼 타입(별칭)을 입력해주세요.';
      }
      if (!POSITIONS.includes(position as (typeof POSITIONS)[number])) {
        nextErrors.position = '위치는 1~22 중에서 선택해주세요.';
      }
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        nextErrors.status = '상태를 선택해주세요.';
      }
      if (!iconKey.trim()) {
        nextErrors.iconKey = '아이콘을 선택해주세요.';
      }
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      const kid = Number(kioskId);
      try {
        await createKioskButtonAsync({
          kioskId: kid,
          buttonType: typeTrim,
          buttonName: nameTrim,
          position,
          iconKey: resolveKioskButtonIconKey(iconKey),
          status,
        });
        onClose();
      } catch (err) {
        setFormError(messageFromError(err));
      }
    },
    [kioskId, buttonType, buttonName, position, iconKey, status, createKioskButtonAsync, onClose],
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
              <p className={styles.formHint}>키오스크 목록을 불러오는 중이거나 등록된 키오스크가 없습니다.</p>
            ) : (
              <>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${uid}-kiosk`}>
                    키오스크
                  </label>
                  <SearchableSelect
                    aria-label='키오스크'
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
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor={`${uid}-pos`}>
                      위치 (1–22)
                    </label>
                    <select
                      id={`${uid}-pos`}
                      className={`${styles.select} ${fieldErrors.position ? styles.inputError : ''}`}
                      value={position}
                      onChange={(e) => {
                        setPosition(Number(e.target.value));
                        setFieldErrors((prev) => ({ ...prev, position: undefined }));
                      }}
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.position ? <p className={styles.fieldError}>{fieldErrors.position}</p> : null}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor={`${uid}-status`}>
                      상태
                    </label>
                    <select
                      id={`${uid}-status`}
                      className={`${styles.select} ${fieldErrors.status ? styles.inputError : ''}`}
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, status: undefined }));
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.status ? <p className={styles.fieldError}>{fieldErrors.status}</p> : null}
                  </div>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel} id={`${uid}-icon-hint`}>
                    아이콘
                  </span>
                  <p className={styles.iconPickerHint} id={`${uid}-icon-desc`}>
                    버튼에 표시할 아이콘을 선택하세요. 키는 <code className={styles.monoCode}>{iconKey}</code> 로 저장됩니다.
                  </p>
                  <div
                    className={`${styles.iconPickerWrap} ${fieldErrors.iconKey ? styles.inputError : ''}`}
                    role='group'
                    aria-labelledby={`${uid}-icon-hint`}
                    aria-describedby={`${uid}-icon-desc`}
                  >
                    <KioskIconPicker
                      value={iconKey}
                      onChange={(v) => {
                        setIconKey(v);
                        setFieldErrors((prev) => ({ ...prev, iconKey: undefined }));
                      }}
                    />
                  </div>
                  {fieldErrors.iconKey ? <p className={styles.fieldError}>{fieldErrors.iconKey}</p> : null}
                </div>
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
