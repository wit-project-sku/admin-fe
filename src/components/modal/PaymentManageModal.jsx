import { useEffect } from 'react';
import m from './Modal.module.css';
import shared from '@commons/shared.module.css';

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : String(v);
};
const fmtDate = (date, time) => {
  if (!date || date.length !== 8) return '-';
  const y=date.slice(0,4),mo=date.slice(4,6),d=date.slice(6,8);
  if (!time||time.length<4) return `${y}.${mo}.${d}`;
  return `${y}.${mo}.${d} ${time.slice(0,2)}:${time.slice(2,4)}:${time.slice(4,6)||'00'}`;
};
const STATUS_MAP = {
  APPROVED:{ label:'결제완료', color:'#16a34a', bg:'#dcfce7' },
  CANCELED:{ label:'결제취소', color:'#dc2626', bg:'#fef2f2' },
};

export default function PaymentManageModal({ open, payment:p, onClose }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !p) return null;
  const si = STATUS_MAP[p.paymentStatus] ?? { label: p.paymentStatus??'-', color:'#64748b', bg:'#f1f5f9' };
  const items = p.paymentProducts ?? [];
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
          <span className={m.title}>결제 상세</span>
          <button className={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={m.body}>
          <div className={m.fieldRow}><Row label="주문번호" value={p.transactionId} /><Row label="승인번호" value={p.approvalNumber} /></div>
          <div className={m.fieldRow}><Row label="전화번호" value={normalizePhone(p.phoneNumber)} /><Row label="승인일시" value={fmtDate(p.approvedDate, p.approvedTime)} /></div>
          <div className={m.fieldRow}>
            <Row label="카드번호" value={p.cardNumber ? `${p.cardNumber.slice(0,4)}-****-****-${p.cardNumber.slice(-4)}` : '-'} />
            <Row label="단말기 ID" value={p.terminalId} />
          </div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>결제금액</label>
              <input className={m.input} value={Number(p.totalAmount)?`${Number(p.totalAmount).toLocaleString()}원`:'-'} disabled readOnly />
            </div>
            <div className={m.field}>
              <label className={m.label}>상태</label>
              <span style={{ background:si.bg, color:si.color, fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20, display:'inline-block', marginTop:2 }}>{si.label}</span>
            </div>
          </div>
          {items.length > 0 && (
            <div className={m.field}>
              <label className={m.label}>구매 상품</label>
              <div style={{ background:'var(--bg-page)', borderRadius:9, border:'1px solid var(--border-md)', overflow:'hidden' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', borderBottom:i<items.length-1?'1px solid var(--border)':'none', fontSize:11 }}>
                    <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{item.productName??`상품 ${i+1}`}</span>
                    <span style={{ color:'var(--text-secondary)' }}>수량 {item.quantity??1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={m.footer}><button className={shared.btnOutline} onClick={onClose}>닫기</button></div>
      </div>
    </div>
  );
}
