import { useEffect } from 'react';
import m from './Modal.module.css';
import shared from '@commons/shared.module.css';

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : String(v);
};
const STATUS_MAP = {
  WAITING:  { label:'대기',  bg:'#fef3c7', color:'#d97706' },
  APPROVED: { label:'승인',  bg:'#dcfce7', color:'#16a34a' },
  ACCEPTED: { label:'승인',  bg:'#dcfce7', color:'#16a34a' },
  REJECTED: { label:'반려',  bg:'#fef2f2', color:'#dc2626' },
  COMPLETED:{ label:'완료',  bg:'#dbeafe', color:'#2563eb' },
  DONE:     { label:'완료',  bg:'#dbeafe', color:'#2563eb' },
};
const REASON_MAP = { ETC:'기타', DEFECT:'상품불량', CHANGE_OF_MIND:'단순변심', WRONG_ORDER:'오주문' };

export default function RefundManageModal({ open, refund:r, onClose }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !r) return null;
  const si = STATUS_MAP[r.refundStatus] ?? { label:r.refundStatus??'-', bg:'#f1f5f9', color:'#64748b' };
  const Row = ({ label, value }) => (
    <div className={m.field}>
      <label className={m.label}>{label}</label>
      <input className={m.input} value={value??'-'} disabled readOnly />
    </div>
  );
  return (
    <div className={m.overlay} onClick={onClose}>
      <div className={m.modal} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <span className={m.title}>환불 상세</span>
          <button className={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={m.body}>
          <div className={m.fieldRow}><Row label="주문번호" value={r.transactionId} /><Row label="전화번호" value={normalizePhone(r.phoneNumber)} /></div>
          <div className={m.fieldRow}>
            <Row label="환불 사유" value={REASON_MAP[r.refundReason]??r.refundReason} />
            <div className={m.field}>
              <label className={m.label}>환불 상태</label>
              <span style={{ background:si.bg, color:si.color, fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20, display:'inline-block', marginTop:2 }}>{si.label}</span>
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>설명</label>
            <textarea className={m.textarea} value={r.description??'-'} disabled readOnly />
          </div>
        </div>
        <div className={m.footer}><button className={shared.btnOutline} onClick={onClose}>닫기</button></div>
      </div>
    </div>
  );
}
