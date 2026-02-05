import React, { useEffect } from 'react';
import styles from './DeleteModal.module.css';
import warnIcon from '@assets/images/warn.png';

export default function DeleteModal({
  open = false,
  title = '상품을 삭제하시겠습니까?',
  message = '삭제 이후에는 복구할 수 없습니다.',
  cancelText = '취소',
  confirmText = '삭제하기',
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => onClose?.()}>
      <div className={styles.modal} role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap} aria-hidden='true'>
          <img src={warnIcon} alt='' className={styles.icon} />
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button type='button' className={styles.cancelBtn} onClick={() => onClose?.()}>
            {cancelText}
          </button>
          <button type='button' className={styles.confirmBtn} onClick={() => onConfirm?.()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
