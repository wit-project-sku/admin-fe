import React, { useEffect } from 'react';
import styles from './PaymentManageModal.module.css';

export default function PaymentManageModal({ open = false, payment = null, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const safe = payment ?? {};

  const formatApprovedAt = (approvedDate, approvedTime) => {
    if (!approvedDate || String(approvedDate).length !== 8) return '-';
    const s = String(approvedDate);
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);

    const t = String(approvedTime ?? '');
    if (t.length < 4) return `${y}.${m}.${d}`;
    const hh = t.slice(0, 2);
    const mm = t.slice(2, 4);
    const ss = t.length >= 6 ? t.slice(4, 6) : '00';
    return `${y}.${m}.${d} ${hh}:${mm}:${ss}`;
  };

  const formatWon = (value) => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return `${num.toLocaleString()}원`;
  };

  const normalizePhone = (value) => {
    if (!value) return '-';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return String(value);
  };

  const statusLabel = (status) => {
    if (status === 'CANCELED' || status === 'CANCELLED') return '결제 취소';
    if (status === 'APPROVED' || status === 'COMPLETED' || status === 'COMPLETE') return '결제 완료';
    return status ?? '-';
  };

  return (
    <div className={styles.overlay} onClick={() => onClose?.()} role='presentation'>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role='dialog' aria-modal='true'>
        <div className={styles.header}>
          <div className={styles.headerTitle}>결제 상세</div>
          <button type='button' className={styles.closeBtn} onClick={() => onClose?.()} aria-label='닫기'>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <div className={styles.label}>결제 ID</div>
            <input className={styles.input} value={safe.paymentId ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>결제 상태</div>
            <input className={styles.input} value={statusLabel(safe.paymentStatus)} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>단말기 ID</div>
            <input className={styles.input} value={safe.terminalId ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>주문번호</div>
            <input className={styles.input} value={safe.transactionId ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>승인번호</div>
            <input className={styles.input} value={safe.approvalNumber ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>거래 시각</div>
            <input
              className={styles.input}
              value={formatApprovedAt(safe.approvedDate, safe.approvedTime)}
              disabled
              readOnly
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>카드 번호</div>
            <input className={styles.input} value={safe.cardNumber ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>청구 금액</div>
            <input className={styles.input} value={formatWon(safe.totalAmount)} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>전화번호</div>
            <input className={styles.input} value={normalizePhone(safe.phoneNumber)} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>배송 상태</div>
            <input className={styles.input} value={safe.deliveryStatus ?? '-'} disabled readOnly />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <div className={styles.label}>촬영한 이미지 URL</div>
            <textarea className={styles.textarea} value={safe.customImageUrl ?? '-'} disabled readOnly />
          </div>
        </div>

        <div className={styles.footer}>
          <button type='button' className={styles.cancelBtn} onClick={() => onClose?.()}>
            닫기
          </button>
          <button type='button' className={styles.submitBtn} onClick={() => onClose?.()}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
