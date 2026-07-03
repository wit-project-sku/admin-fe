import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import shared from '@commons/shared.module.css';
import { KioskIconPicker } from '@/features/kiosk/kioskAppIcons';
import { PLACEMENT_OPTIONS, SPAN_OPTIONS, positionLabel } from '@/features/kiosk/manage/constants';
import { resolveKioskButtonIconKey } from '@/features/kiosk/manage/kioskButtonDisplay';
import styles from '@/features/kiosk/manage/KioskAppManagePage.module.css';
import { useUpdateKioskButton } from '@/hooks/kiosk-api/useUpdateKioskButton';
import {
  useUpdateKioskButtonPlacement,
  type ButtonPlacement,
} from '@/hooks/kiosk-api/useUpdateKioskButtonPlacement';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  button: KioskButtonDto | null;
  onSuccess?: (message: string) => void;
};

type FormErrors = {
  buttonType?: string;
  buttonName?: string;
  status?: string;
  iconKey?: string;
};

function messageFromError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  const ax = err as AxiosError<{ message?: string }>;
  const msg = ax.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  return '버튼을 저장하지 못했습니다. 다시 시도해주세요.';
}

export function KioskButtonEditModal({ open, onClose, button, onSuccess }: Props) {
  const uid = useId();
  const { updateKioskButtonAsync, isPending, reset: resetMutation } = useUpdateKioskButton();
  const { updatePlacementAsync, isPending: placementPending } = useUpdateKioskButtonPlacement();
  const [buttonType, setButtonType] = useState('');
  const [buttonName, setButtonName] = useState('');
  const [iconKey, setIconKey] = useState('map');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [placement, setPlacement] = useState<ButtonPlacement>('MAIN');
  const [span, setSpan] = useState<number>(1);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !button) return;
    resetMutation();
    setFieldErrors({});
    setFormError(null);
    setButtonType(button.buttonType);
    setButtonName(button.buttonName ?? '');
    setIconKey(resolveKioskButtonIconKey(button.iconKey));
    setStatus(button.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setPlacement((button.placement as ButtonPlacement) ?? 'MAIN');
    setSpan(button.span === 2 ? 2 : 1);
  }, [open, button, resetMutation]);

  const busy = isPending || placementPending;
  const canSubmit = useMemo(() => !busy, [busy]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const nextErrors: FormErrors = {};
      setFormError(null);
      if (!button) return;
      const typeTrim = buttonType.trim();
      const nameTrim = buttonName.trim();
      if (!nameTrim) nextErrors.buttonName = '버튼 이름을 입력해주세요.';
      if (!typeTrim) nextErrors.buttonType = '버튼 타입(별칭)을 입력해주세요.';
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) nextErrors.status = '상태를 선택해주세요.';
      if (!iconKey.trim()) nextErrors.iconKey = '아이콘을 선택해주세요.';
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      try {
        // 위치(줄·칸)는 레이아웃 미리보기의 드래그로 변경한다. 여기서는 기존 슬롯을 그대로 유지.
        await updateKioskButtonAsync({
          buttonId: button.id,
          payload: {
            buttonType: typeTrim,
            buttonName: nameTrim,
            line: button.line,
            position: button.position,
            span,
            iconKey: resolveKioskButtonIconKey(iconKey),
            status,
          },
        });
        // 표시 여부(placement)가 바뀌면 별도 API 로 반영 (그리드 파킹/재진입 + 재배치).
        const originalPlacement = (button.placement as ButtonPlacement) ?? 'MAIN';
        if (placement !== originalPlacement) {
          await updatePlacementAsync({ buttonId: button.id, placement });
        }
        onSuccess?.('버튼이 저장되었습니다.');
        onClose();
      } catch (err) {
        setFormError(messageFromError(err));
      }
    },
    [
      button,
      buttonType,
      buttonName,
      iconKey,
      status,
      placement,
      span,
      updateKioskButtonAsync,
      updatePlacementAsync,
      onClose,
      onSuccess,
    ],
  );

  if (!open || !button) return null;

  return (
    <div className={styles.overlay} role='presentation' onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={`${uid}-edit-title`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <span id={`${uid}-edit-title`} className={styles.modalTitle}>
            버튼 상세
          </span>
          <button type='button' className={shared.btnOutline} onClick={onClose} aria-label='닫기'>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className={styles.modalBody}>
            <p className={styles.formHint} style={{ marginTop: 0 }}>
              버튼 ID <code className={styles.monoCode}>{button.id}</code>
              {button.kioskName != null ? ` · ${button.kioskName}` : button.kioskId != null ? ` · WITH #${button.kioskId}` : null}
            </p>
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
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`${uid}-placement`}>
                  표시 여부
                </label>
                <select
                  id={`${uid}-placement`}
                  className={styles.select}
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as ButtonPlacement)}
                >
                  {PLACEMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`${uid}-span`}>
                  폭 (칸 수)
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
            </div>
            <p className={styles.formHint} style={{ marginTop: 0 }}>
              {placement === 'MAIN'
                ? `그리드 표시 · 현재 ${positionLabel(button.line, button.position, button.span)} (위치 변경은 미리보기에서 드래그 · 폭 변경 시 자동 재배치)`
                : placement === 'FIXED'
                  ? '메인 화면에 표시되지만 위치는 고정(1·2·7열)'
                  : '메인 화면에 표시하지 않음'}
            </p>
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
            {formError ? (
              <p className={styles.formError} role='alert'>
                {formError}
              </p>
            ) : null}
          </div>
          <div className={styles.modalFooter}>
            <button type='button' className={shared.btnOutline} onClick={onClose} disabled={busy}>
              취소
            </button>
            <button type='submit' className={shared.btnPrimary} disabled={!canSubmit}>
              {busy ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
