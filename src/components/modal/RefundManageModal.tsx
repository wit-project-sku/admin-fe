import { useEffect } from 'react';
import m from './RefundManageModal.module.css';
import shared from '@commons/shared.module.css';
import { normalizePhone } from '../../utils/normalizePhone';

const STATUS_MAP = {
  WAITING: { label: '대기', bg: '#fff7ed', color: '#c2410c' },
  APPROVED: { label: '승인', bg: '#f0fdf4', color: '#16a34a' },
  ACCEPTED: { label: '승인', bg: '#f0fdf4', color: '#16a34a' },
  REJECTED: { label: '반려', bg: '#fef2f2', color: '#dc2626' },
  COMPLETED: { label: '완료', bg: '#eff6ff', color: '#2563eb' },
  DONE: { label: '완료', bg: '#eff6ff', color: '#2563eb' },
};

const REASON_MAP = { ETC: '기타', DEFECT: '상품불량', CHANGE_OF_MIND: '단순변심', WRONG_ORDER: '오주문' };

export default function RefundManageModal({ open, refund: r, onClose }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !r) return null;
  const si = STATUS_MAP[r.refundStatus] ?? { label: r.refundStatus ?? '-', bg: '#f8fafc', color: '#64748b' };

  const InfoField = ({ label, value }) => (
    <div className={m.field}>
      <label className={m.label}>{label}</label>
      <div className={m.valueText}>{value ?? '-'}</div>
    </div>
  );

  return (
    <div className={m.overlay} onClick={onClose}>
      <div className={m.modal} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <span className={m.title}>환불 상세 내역</span>
          <button className={m.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={m.body}>
          <div className={m.fieldRow}>
            <InfoField label='주문번호' value={r.transactionId} />
            <InfoField label='전화번호' value={normalizePhone(r.phoneNumber)} />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='환불 사유' value={REASON_MAP[r.refundReason] ?? r.refundReason} />
            <div className={m.field}>
              <label className={m.label}>환불 상태</label>
              <div style={{ marginTop: '4px' }}>
                <span className={m.badge} style={{ background: si.bg, color: si.color }}>
                  {si.label}
                </span>
              </div>
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>설명</label>
            <div className={m.textarea}>{r.description ?? '설명 내용이 없습니다.'}</div>
          </div>
        </div>
        <div className={m.footer}>
          <button className={shared.btnPrimary} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
