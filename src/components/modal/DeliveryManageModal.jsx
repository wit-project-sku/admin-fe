import { useState, useEffect } from 'react';
import m from './DeliveryManageModal.module.css'; // 분리된 CSS 적용
import shared from '@commons/shared.module.css';
import { fetchDeliveryByIdAdmin, updateDeliveryByAdmin } from '@apis/deliveryApi';

// 상태 옵션 키값 수정 (SHIPPING -> DELIVERING, COMPLETE -> COMPLETED 등 페이지와 통일)
const STATUS_OPTIONS = [
  { value: 'ORDERED', label: '주문완료' },
  { value: 'READY', label: '배송준비' },
  { value: 'DELIVERING', label: '배송중' },
  { value: 'COMPLETED', label: '배송완료' },
  { value: 'PICKED_UP', label: '직접수령' },
  { value: 'CANCELED', label: '취소' },
];

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : String(v);
};

export default function DeliveryManageModal({ open, mode, deliveryId, onClose, onSuccess }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !deliveryId) return;
    setLoading(true);
    fetchDeliveryByIdAdmin(deliveryId)
      .then((res) => {
        const d = res?.data?.data ?? res?.data ?? res;
        setData(d);
        setForm({
          deliveryStatus: d.deliveryStatus ?? d.status ?? 'ORDERED',
          receiverName: d.receiverName ?? '',
          phoneNumber: d.phoneNumber ?? '',
          address: d.address ?? '',
          addressDetail: d.addressDetail ?? '',
          trackingNumber: d.trackingNumber ?? '',
        });
      })
      .catch(() => setError('배송 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [open, deliveryId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeliveryByAdmin(deliveryId, form);
      onSuccess?.();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isEdit = mode === 'edit';

  // 주문 내역 더미 데이터
  const orderItems =
    data?.orderProducts && data.orderProducts.length > 0
      ? data.orderProducts
      : [
          { productName: 'WITH > AR합성 아크릴 키링', quantity: 1, price: 14900 },
          { productName: 'WITH > AR합성 머그컵', quantity: 1, price: 24900 },
        ];

  const FormField = ({ label, value, field, required = false, fullWidth = false }) => (
    <div className={`${m.field} ${fullWidth ? m.fieldFull : ''}`}>
      <label className={m.label} style={{ fontWeight: 500 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {isEdit && field ? (
        field === 'deliveryStatus' ? (
          <select
            className={m.select}
            value={form.deliveryStatus}
            onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={m.input}
            style={{ fontWeight: 400 }}
            value={form[field] ?? ''}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        )
      ) : (
        <div className={m.valueText}>{value ?? '-'}</div>
      )}
    </div>
  );

  return (
    <div className={m.overlay} onClick={onClose}>
      <div className={`${m.modal} ${m.modalLg}`} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <span className={m.title}>{isEdit ? '배송 정보 수정' : '배송 정보 상세'}</span>
          <button className={m.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={m.body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>불러오는 중...</div>
          ) : (
            <>
              <div className={m.section}>
                <div className={m.fieldRow}>
                  <FormField
                    label='주문번호'
                    value={`DEL-${String(data?.deliveryId || '003').padStart(3, '0')}`}
                    required
                  />
                  <FormField label='주문 날짜' value={data?.orderDate ?? '2026-01-30'} required />
                </div>
                <div className={m.fieldRow}>
                  <FormField
                    label='휴대폰 번호'
                    value={normalizePhone(data?.phoneNumber)}
                    field='phoneNumber'
                    required
                  />
                  <FormField label='수령인 이름' value={data?.receiverName} field='receiverName' />
                </div>
                <div className={m.fieldRow}>
                  <FormField label='우편번호' value={data?.zipCode ?? '-'} field='zipCode' />
                  <FormField label='도로명 주소' value={data?.address} field='address' required />
                </div>
                <FormField label='상세주소' value={data?.addressDetail} field='addressDetail' fullWidth />
                <div className={m.fieldRow}>
                  <FormField
                    label='배송 상태'
                    value={STATUS_OPTIONS.find((o) => o.value === data?.deliveryStatus)?.label}
                    field='deliveryStatus'
                  />
                  <FormField label='송장번호' value={data?.trackingNumber} field='trackingNumber' />
                </div>
                <div className={m.fieldRow}>
                  <FormField
                    label='총 결제 금액'
                    value={`${Number(data?.totalAmount ?? 0).toLocaleString()}원`}
                    required
                  />
                  <FormField label='총 상품 개수' value={`${data?.orderProducts?.length ?? 0}개`} required />
                </div>
              </div>

              <div className={m.section}>
                <label className={m.label} style={{ marginBottom: '8px', fontWeight: 500 }}>
                  주문 내역
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orderItems.map((item, i) => (
                    <div key={i} className={m.orderItem}>
                      <div className={m.orderItemDot} />
                      <div className={m.orderItemName}>{item.productName}</div>
                      <div className={m.orderItemInfo}>
                        <div className={m.infoTag}>
                          수량 <b>{item.quantity}개</b>
                        </div>
                        <div className={m.infoTag}>
                          가격 <b>{Number(item.price).toLocaleString()}원</b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className={m.footer}>
          {isEdit ? (
            <>
              <button className={shared.btnOutline} onClick={onClose}>
                취소
              </button>
              <button className={`${m.btnPrimaryCustom}`} onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '수정 완료'}
              </button>
            </>
          ) : (
            <button className={m.btnPrimaryCustom} onClick={onClose}>
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
