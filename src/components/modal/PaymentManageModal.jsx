import { useEffect } from 'react';
import m from './PaymentManageModal.module.css'; // 분리된 CSS 임포트
import shared from '@commons/shared.module.css';

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : String(v);
};

const fmtDate = (date, time) => {
  if (!date || date.length !== 8) return '-';
  const y = date.slice(0, 4),
    mo = date.slice(4, 6),
    d = date.slice(6, 8);
  if (!time || time.length < 4) return `${y}.${mo}.${d}`;
  return `${y}.${mo}.${d} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6) || '00'}`;
};

const STATUS_MAP = {
  APPROVED: { label: '결제완료', color: '#16a34a', bg: '#dcfce7' },
  CANCELED: { label: '결제취소', color: '#dc2626', bg: '#fef2f2' },
};

export default function PaymentManageModal({ open, payment: p, onClose }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open || !p) return null;

  const si = STATUS_MAP[p.paymentStatus] ?? { label: p.paymentStatus ?? '-', color: '#64748b', bg: '#f1f5f9' };
  const items = p.paymentProducts ?? [];

  // 정보 표시를 위한 공통 로우 컴포넌트
  const InfoField = ({ label, value }) => (
    <div className={m.field}>
      <label className={m.label}>{label}</label>
      <div className={`${m.valueText}`}>{value ?? '-'}</div>
    </div>
  );

  return (
    <div className={m.overlay} onClick={onClose}>
      <div className={m.modal} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <span className={m.title}>결제 상세 정보</span>
          <button className={m.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={m.body}>
          {/* 그룹 1: 거래 식별 정보 */}
          <div className={m.section}>
            <div className={m.fieldRow}>
              <InfoField label='주문번호' value={p.transactionId} />
              <InfoField label='승인번호' value={p.approvalNumber} />
            </div>
            <div className={m.fieldRow}>
              <InfoField label='단말기 ID' value={p.terminalId} />
              <InfoField label='승인일시' value={fmtDate(p.approvedDate, p.approvedTime)} />
            </div>
          </div>

          {/* 그룹 2: 결제 수단 및 금액 */}
          <div className={m.section}>
            <div className={m.fieldRow}>
              <InfoField label='전화번호' value={normalizePhone(p.phoneNumber)} />
              <InfoField
                label='카드번호'
                value={p.cardNumber ? `${p.cardNumber.slice(0, 4)}-****-****-${p.cardNumber.slice(-4)}` : '-'}
              />
            </div>
            <div className={m.fieldRow}>
              <div className={m.field}>
                <label className={m.label}>결제금액</label>
                <div className={`${m.valueText}`}>{Number(p.totalAmount).toLocaleString()}원</div>
              </div>
              <div className={m.field}>
                <label className={m.label}>상태</label>
                <div style={{ marginTop: '4px' }}>
                  <span className={m.badge} style={{ background: si.bg, color: si.color }}>
                    {si.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 그룹 3: 구매 상품 내역 */}
          {items.length > 0 && (
            <div className={m.section}>
              <div className={m.sectionTitle}>Ordered Products</div>
              <div className={m.productList}>
                {items.map((item, i) => (
                  <div key={i} className={m.productItem}>
                    <span style={{ fontWeight: 700 }}>{item.productName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.quantity}개</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={m.footer}>
          <button className={shared.btnPrimary} style={{ width: '100px', textAlign: 'center' }} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
