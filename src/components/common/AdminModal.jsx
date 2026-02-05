import React from 'react';
import styles from './AdminModal.module.css';
import closeBtn from '@assets/images/close.png';

export default function AdminModal({
  title = '제목',
  onClose,
  onSubmit,
  children,
  submitText = '확인',
  cancelText = '취소',
  showFooter = true,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role='dialog' aria-modal='true'>
        <div className={styles.header}>
          <div className={styles.headerTitle}>{title}</div>
          <button type='button' className={styles.closeBtn} onClick={onClose} aria-label='닫기'>
            <img src={closeBtn} alt='닫기' />
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          {children}
        </form>

        {showFooter && (
          <div className={styles.footer}>
            <button type='button' className={styles.cancelBtn} onClick={onClose}>
              {cancelText}
            </button>
            <button type='submit' className={styles.submitBtn} onClick={handleSubmit}>
              {submitText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
