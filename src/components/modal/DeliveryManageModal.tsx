import { useState, useEffect } from 'react';
import m from './DeliveryManageModal.module.css'; // 분리된 CSS 적용
import { useGetDeliveryById } from '../../hooks/delivery-api/useGetDeliveryById';
import { useUpdateDelivery } from '../../hooks/delivery-api/useUpdateDelivery';
import { normalizePhone } from '../../utils/normalizePhone';

import type { ReactNode } from 'react';
import { DropDownField, InfoField, InputField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';

// 상태 옵션 키값
const STATUS_OPTIONS = [
  { value: 'ORDERED', label: '주문완료' },
  { value: 'READY', label: '배송준비' },
  { value: 'DELIVERING', label: '배송중' },
  { value: 'COMPLETED', label: '배송완료' },
  { value: 'PICKED_UP', label: '직접수령' },
  { value: 'CANCELED', label: '취소' },
];

export default function DeliveryManageModal({ open, mode, deliveryId, onClose, onSuccess }) {
  const { data: deliveryData, error: deliveryError, isLoading: loading } = useGetDeliveryById(open ? deliveryId : null);
  const { updateDeliveryAsync } = useUpdateDelivery();
  const data = ((deliveryData as { data?: unknown } | undefined)?.data ?? deliveryData) as Record<string, any> | null;
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !data) return;
    setForm({
      deliveryStatus: data.deliveryStatus ?? data.status ?? 'ORDERED',
      receiverName: data.receiverName ?? '',
      phoneNumber: data.phoneNumber ?? '',
      address: data.address ?? '',
      addressDetail: data.addressDetail ?? '',
      trackingNumber: data.trackingNumber ?? '',
    });
  }, [open, data]);

  useEffect(() => {
    setError(deliveryError ? '배송 정보를 불러오지 못했습니다.' : '');
  }, [deliveryError]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeliveryAsync({ deliveryId, deliveryData: form as Record<string, unknown> });
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

  const FormField = ({
    label,
    value,
    field,
    required = false,
    fullWidth = false,
  }: {
    label: string;
    value: ReactNode;
    field?: string;
    required?: boolean;
    fullWidth?: boolean;
  }) => {
    return (
      <div className={`${m.field} ${fullWidth ? m.fieldFull : ''}`}>
        {isEdit && field ? (
          field === 'deliveryStatus' ? (
            <DropDownField
              label={label}
              options={STATUS_OPTIONS}
              required={required}
              value={form.deliveryStatus ?? ''}
              onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}
            />
          ) : (
            <InputField
              label={label}
              required={required}
              value={value == null ? '' : String(value)}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          )
        ) : (
          <InfoField label={label} value={value} />
        )}
      </div>
    );
  };

  // 상세 보기 시 라벨 표시용
  const currentStatusLabel = STATUS_OPTIONS.find((o) => o.value === data?.deliveryStatus)?.label || '-';

  return (
    <ModalContainer>
      <ModalHeader title={isEdit ? '배송 정보 수정' : '배송 정보 상세'} onClose={onClose} />
      {error ? (
        <div style={{ padding: '12px 20px', color: '#b91c1c', fontSize: 13 }}>{error}</div>
      ) : null}
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
                <FormField label='휴대폰 번호' value={normalizePhone(data?.phoneNumber)} field='phoneNumber' required />
                <FormField label='수령인 이름' value={data?.receiverName} field='receiverName' />
              </div>
              <div className={m.fieldRow}>
                <FormField label='우편번호' value={data?.zipCode ?? '-'} field='zipCode' />
                <FormField label='도로명 주소' value={data?.address} field='address' required />
              </div>
              <FormField label='상세주소' value={data?.addressDetail ?? '-'} field='addressDetail' fullWidth />
              <div className={m.fieldRow}>
                <FormField label='배송 상태' value={currentStatusLabel} field='deliveryStatus' />
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
              <label className={m.label} style={{ fontWeight: 500 }}>
                주문 내역
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      <ModalFooter
        onCancel={onClose}
        cancelText={isEdit ? '취소' : '확인'}
        onSubmit={isEdit ? handleSave : onClose}
        submitText={isEdit ? (saving ? '저장 중...' : '수정 완료') : '확인'}
      />
    </ModalContainer>
  );
}
