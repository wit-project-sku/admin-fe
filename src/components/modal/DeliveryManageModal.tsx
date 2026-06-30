import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import m from './DeliveryManageModal.module.css'; // 분리된 CSS 적용
import { useGetDeliveryById } from '../../hooks/delivery-api/useGetDeliveryById';
import { useUpdateDelivery } from '../../hooks/delivery-api/useUpdateDelivery';
import { normalizePhone } from '../../utils/normalizePhone';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
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

type DeliveryFormFieldProps = {
  isEdit: boolean;
  label: string;
  value: ReactNode;
  field?: string;
  required?: boolean;
  fullWidth?: boolean;
  form: Record<string, string>;
  setForm: Dispatch<SetStateAction<Record<string, string>>>;
};

/** Must be module-scoped: an inner component would remount on every keystroke and drop input focus. */
function DeliveryFormField({
  isEdit,
  label,
  value,
  field,
  required = false,
  fullWidth = false,
  form,
  setForm,
}: DeliveryFormFieldProps) {
  return (
    <div className={`${m.field} ${fullWidth ? m.fieldFull : ''}`}>
      {isEdit && field ? (
        field === 'deliveryStatus' ? (
          <DropDownField
            label={label}
            options={STATUS_OPTIONS}
            required={required}
            value={form.deliveryStatus ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, deliveryStatus: v }));
            }}
          />
        ) : (
          <InputField
            label={label}
            required={required}
            value={field ? String(form[field] ?? '') : value == null ? '' : String(value)}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, [field]: v }));
            }}
          />
        )
      ) : (
        <InfoField label={label} value={value} />
      )}
    </div>
  );
}

function buildFormFromDelivery(data: Record<string, any>) {
  return {
    deliveryStatus: data.deliveryStatus ?? data.status ?? 'ORDERED',
    receiverName: data.receiverName ?? '',
    phoneNumber: data.phoneNumber ?? '',
    address: data.address ?? '',
    addressDetail: data.addressDetail ?? data.detailAddress ?? '',
    trackingNumber: data.trackingNumber ?? '',
    zipCode: data.zipCode != null ? String(data.zipCode) : '',
  };
}

export default function DeliveryManageModal({ open, mode, deliveryId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const { data: deliveryData, error: deliveryError, isLoading: loading } = useGetDeliveryById(open ? deliveryId : null);
  const { updateDeliveryAsync } = useUpdateDelivery();
  const data = ((deliveryData as { data?: unknown } | undefined)?.data ?? deliveryData) as Record<string, any> | null;
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  /** Only re-hydrate form when opening or switching delivery — not when React Query returns a new `data` ref while editing. */
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      hydratedKeyRef.current = null;
      return;
    }
    if (!data) return;
    const id = data.deliveryId ?? deliveryId;
    const key = id != null ? String(id) : '';
    if (!key) return;
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;
    setForm(buildFormFromDelivery(data));
  }, [open, data, deliveryId]);

  useEffect(() => {
    setError(deliveryError ? '배송 정보를 불러오지 못했습니다.' : '');
  }, [deliveryError]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const deliveryData = {
        deliveryStatus: form.deliveryStatus,
        trackingNumber: form.trackingNumber,
        receiverName: form.receiverName,
        phoneNumber: form.phoneNumber,
        zipCode: form.zipCode,
        address: form.address,
        addressDetail: form.addressDetail,
        detailAddress: form.addressDetail,
      };
      await updateDeliveryAsync({ deliveryId, deliveryData });
      await queryClient.invalidateQueries({ queryKey: ['deliveries-all'] });
      await queryClient.invalidateQueries({ queryKey: ['delivery-by-id', deliveryId] });
      onSuccess?.();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isEdit = mode === 'edit';

  const orderItems: Array<Record<string, any>> =
    (data?.productListResponses as Array<Record<string, any>> | undefined) ??
    (data?.orderProducts as Array<Record<string, any>> | undefined) ??
    [];

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
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='송장 번호'
                  value={data?.trackingNumber ?? '-'}
                  field='trackingNumber'
                />
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='주문 날짜'
                  value={data?.orderDate ?? '-'}
                  required
                />
              </div>
              <div className={m.fieldRow}>
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='휴대폰 번호'
                  value={normalizePhone(data?.phoneNumber)}
                  field='phoneNumber'
                  required
                />
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='수령인 이름'
                  value={data?.receiverName}
                  field='receiverName'
                />
              </div>
              <div className={m.fieldRow}>
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='우편번호'
                  value={data?.zipCode != null ? String(data.zipCode) : '-'}
                  field='zipCode'
                />
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='도로명 주소'
                  value={data?.address}
                  field='address'
                  required
                />
              </div>
              <DeliveryFormField
                isEdit={isEdit}
                form={form}
                setForm={setForm}
                label='상세주소'
                value={data?.addressDetail ?? data?.detailAddress ?? '-'}
                field='addressDetail'
                fullWidth
              />
              <DeliveryFormField
                isEdit={isEdit}
                form={form}
                setForm={setForm}
                label='배송 상태'
                value={currentStatusLabel}
                field='deliveryStatus'
                fullWidth
              />
              <div className={m.fieldRow}>
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='총 결제 금액'
                  value={`${Number(data?.totalAmount ?? 0).toLocaleString()}원`}
                  required
                />
                <DeliveryFormField
                  isEdit={isEdit}
                  form={form}
                  setForm={setForm}
                  label='총 상품 개수'
                  value={`${orderItems.length}개`}
                  required
                />
              </div>
            </div>

            <div className={m.section}>
              <label className={m.label} style={{ fontWeight: 500 }}>
                주문 내역
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orderItems.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 13 }}>주문 내역이 없습니다.</div>
                ) : (
                  orderItems.map((item, i) => {
                    const name = item.productName ?? '-';
                    const quantity = item.productQuantity ?? item.quantity ?? 0;
                    const price = item.productPrice ?? item.price ?? 0;
                    return (
                      <div key={item.productId ?? i} className={m.orderItem}>
                        <div className={m.orderItemDot} />
                        <div className={m.orderItemName}>{name}</div>
                        <div className={m.orderItemInfo}>
                          <div className={m.infoTag}>
                            수량 <b>{quantity}개</b>
                          </div>
                          <div className={m.infoTag}>
                            가격 <b>{Number(price).toLocaleString()}원</b>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
