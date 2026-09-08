import { useEffect } from 'react';
import m from './PaymentManageModal.module.css'; // 분리된 CSS 임포트
import { InfoField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import { normalizePhone } from '../../utils/normalizePhone';
import { formatCompactDateTime } from '../../utils/dateUtils';

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

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title='결제 상세 정보' onClose={onClose} />

      <div className={m.body}>
        {/* 그룹 1: 거래 식별 정보 */}
        <div className={m.section}>
          <div className={m.fieldRow}>
            <InfoField label='주문번호' value={p.transactionId} />
            <InfoField label='승인번호' value={p.approvalNumber} />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='단말기 ID' value={p.terminalId} />
            <InfoField label='승인일시' value={formatCompactDateTime(p.approvedDate, p.approvedTime)} />
          </div>
        </div>

        {/* 그룹 2: 결제 수단 및 금액 */}
        <div className={m.section}>
          <div className={m.fieldRow}>
            <InfoField label='전화번호' value={normalizePhone(p.phoneNumber)} />
            <InfoField
              label='카드번호'
              value={p.cardNumber || '-'}
            />
          </div>
          <div className={m.fieldRow}>
            <InfoField label='결제금액' value={`${Number(p.totalAmount).toLocaleString()}원`} />

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

        {/* 그룹 3: 구매 상품 내역. 사용되는지 확인하기 */}
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

      <ModalFooter onCancel={onClose} cancelText='닫기' />
    </ModalContainer>
  );
}
