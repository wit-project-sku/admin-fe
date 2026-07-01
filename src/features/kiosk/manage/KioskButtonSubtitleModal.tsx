import { useCallback, useEffect, useMemo, useState } from 'react';
import shared from '@commons/shared.module.css';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import type { KioskSubtitleDto, KioskSubtitlePayload } from '@/hooks/kiosk-api/kioskSubtitleTypes';
import {
  useKioskButtonSubtitles,
  useKioskSubtitleMutations,
} from '@/hooks/kiosk-api/useKioskButtonSubtitles';
import styles from './KioskAppManagePage.module.css';

type Props = {
  open: boolean;
  kioskId?: number;
  button: KioskButtonDto | null;
  onClose: () => void;
  onNotice?: (message: string) => void;
};

type FormState = {
  videoFileName: string;
  mainKr: string;
  mainEn: string;
  mainJp: string;
  mainCn: string;
  rtKr: string;
  rtEn: string;
  rtJp: string;
  rtCn: string;
};

const EMPTY_FORM: FormState = {
  videoFileName: '',
  mainKr: '',
  mainEn: '',
  mainJp: '',
  mainCn: '',
  rtKr: '',
  rtEn: '',
  rtJp: '',
  rtCn: '',
};

function toForm(s: KioskSubtitleDto): FormState {
  return {
    videoFileName: s.videoKey ?? '',
    mainKr: s.mainKr ?? '',
    mainEn: s.mainEn ?? '',
    mainJp: s.mainJp ?? '',
    mainCn: s.mainCn ?? '',
    rtKr: s.rtKr ?? '',
    rtEn: s.rtEn ?? '',
    rtJp: s.rtJp ?? '',
    rtCn: s.rtCn ?? '',
  };
}

export function KioskButtonSubtitleModal({ open, kioskId, button, onClose, onNotice }: Props) {
  const buttonId = button?.id;
  const { data: subtitles, isLoading } = useKioskButtonSubtitles({
    kioskId,
    buttonId,
    enabled: open,
  });
  const { createSubtitle, updateSubtitle, deleteSubtitle, isPending } = useKioskSubtitleMutations(
    kioskId,
    buttonId,
  );

  // null = 편집 안 함, 'new' = 새 자막, number = 해당 자막 수정
  const [editing, setEditing] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormError(null);
    }
  }, [open]);

  const list = useMemo(() => subtitles ?? [], [subtitles]);

  const startAdd = useCallback(() => {
    setEditing('new');
    setForm(EMPTY_FORM);
    setFormError(null);
  }, []);

  const startEdit = useCallback((s: KioskSubtitleDto) => {
    setEditing(s.id);
    setForm(toForm(s));
    setFormError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }, []);

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = useCallback(async () => {
    if (typeof kioskId !== 'number' || typeof buttonId !== 'number') return;
    const vfn = form.videoFileName.trim();
    const hasSubtitle = [form.mainKr, form.mainEn, form.mainJp, form.mainCn].some((v) => v.trim());
    if (!vfn && !hasSubtitle) {
      setFormError('영상 파일명 또는 자막 중 하나 이상을 입력해주세요.');
      return;
    }
    const payload: KioskSubtitlePayload = {
      kioskId,
      buttonId,
      videoFileName: vfn || null,
      mainKr: form.mainKr.trim() || null,
      mainEn: form.mainEn.trim() || null,
      mainJp: form.mainJp.trim() || null,
      mainCn: form.mainCn.trim() || null,
      rtKr: form.rtKr.trim() || null,
      rtEn: form.rtEn.trim() || null,
      rtJp: form.rtJp.trim() || null,
      rtCn: form.rtCn.trim() || null,
    };
    try {
      if (editing === 'new') {
        await createSubtitle(payload);
        onNotice?.('자막/영상이 등록되었습니다.');
      } else if (typeof editing === 'number') {
        await updateSubtitle({ id: editing, payload });
        onNotice?.('자막/영상이 수정되었습니다.');
      }
      cancelEdit();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    }
  }, [kioskId, buttonId, form, editing, createSubtitle, updateSubtitle, onNotice, cancelEdit]);

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteSubtitle(id);
        onNotice?.('자막/영상이 삭제되었습니다.');
        if (editing === id) cancelEdit();
      } catch (err) {
        onNotice?.(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      }
    },
    [deleteSubtitle, onNotice, editing, cancelEdit],
  );

  if (!open || !button) return null;

  return (
    <div className={styles.overlay} role='presentation' onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role='dialog'
        aria-modal='true'
        aria-label='버튼 자막/영상 관리'
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>자막 / 영상 — {button.buttonType}</span>
          <button type='button' className={shared.btnOutline} onClick={onClose} aria-label='닫기'>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.formHint} style={{ marginTop: 0 }}>
            줄 {button.line}·{button.position} · 버튼 ID <code className={styles.monoCode}>{button.id}</code> · 이
            버튼에 재생될 안내 영상(파일명)과 4개 언어 자막을 등록/수정/삭제합니다.
          </p>

          {/* 기존 자막 세그먼트 목록 */}
          {isLoading ? (
            <p className={styles.formHint}>불러오는 중…</p>
          ) : list.length === 0 ? (
            <p className={styles.formHint}>등록된 자막/영상이 없습니다.</p>
          ) : (
            <div className={styles.subtitleList}>
              {list.map((s) => (
                <div key={s.id} className={styles.subtitleRow}>
                  <div className={styles.subtitleRowMain}>
                    <div className={styles.subtitleVideoName}>🎬 {s.videoKey || '(영상 없음)'}</div>
                    <div className={styles.subtitleText}>{s.mainKr || s.mainEn || '(자막 없음)'}</div>
                  </div>
                  <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                    <button type='button' className={shared.btnOutline} onClick={() => startEdit(s)} disabled={isPending}>
                      수정
                    </button>
                    <button type='button' className={shared.btnOutline} onClick={() => onDelete(s.id)} disabled={isPending}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 추가/수정 폼 */}
          {editing === null ? (
            <button type='button' className={shared.btnPrimary} onClick={startAdd} style={{ marginTop: 12 }}>
              새 자막/영상 추가
            </button>
          ) : (
            <div className={styles.subtitleForm}>
              <div className={styles.subtitleFormTitle}>{editing === 'new' ? '새 자막/영상' : '자막/영상 수정'}</div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>영상 파일명 (videoFileName)</label>
                <input
                  className={styles.input}
                  value={form.videoFileName}
                  onChange={setField('videoFileName')}
                  placeholder='예: guide_toeat.mp4'
                  autoComplete='off'
                />
              </div>
              <div className={styles.subtitleFormTitle}>자막 (하단중앙)</div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>한국어</label>
                  <input className={styles.input} value={form.mainKr} onChange={setField('mainKr')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>English</label>
                  <input className={styles.input} value={form.mainEn} onChange={setField('mainEn')} />
                </div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>日本語</label>
                  <input className={styles.input} value={form.mainJp} onChange={setField('mainJp')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>中文</label>
                  <input className={styles.input} value={form.mainCn} onChange={setField('mainCn')} />
                </div>
              </div>
              <div className={styles.subtitleFormTitle}>자막 (우측상단, 선택)</div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>한국어</label>
                  <input className={styles.input} value={form.rtKr} onChange={setField('rtKr')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>English</label>
                  <input className={styles.input} value={form.rtEn} onChange={setField('rtEn')} />
                </div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>日本語</label>
                  <input className={styles.input} value={form.rtJp} onChange={setField('rtJp')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>中文</label>
                  <input className={styles.input} value={form.rtCn} onChange={setField('rtCn')} />
                </div>
              </div>
              {formError ? <p className={styles.fieldError}>{formError}</p> : null}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type='button' className={shared.btnOutline} onClick={cancelEdit} disabled={isPending}>
                  취소
                </button>
                <button type='button' className={shared.btnPrimary} onClick={onSubmit} disabled={isPending}>
                  {isPending ? '저장 중…' : '저장'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button type='button' className={shared.btnOutline} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
