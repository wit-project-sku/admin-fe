import React, { useEffect, useMemo, useState } from 'react';
import styles from './DeliveryManageModal.module.css';

import { fetchDeliveryByIdAdmin, updateDeliveryByAdmin } from '@apis/deliveryApi';

export default function DeliveryManageModal({
  open = false,
  mode = 'view', // 'view' | 'edit'
  deliveryId,
  onClose,
  onSuccess,
}) {
  const isEdit = mode === 'edit';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    orderNumber: '',
    orderDate: '',
    phoneNumber: '',
    receiverName: '',
    zipCode: '',
    address: '',
    detailAddress: '',
    deliveryStatus: 'READY',
    trackingNumber: '',
    totalAmount: '',
    totalCount: '',
    productListResponses: [],
    items: [],
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const statusOptions = useMemo(
    () => [
      { value: 'PICKED_UP', label: '직접 수령' },
      { value: 'ORDERED', label: '주문 완료' },
      { value: 'READY', label: '배송 준비' },
      { value: 'SHIPPING', label: '배송 중' },
      { value: 'COMPLETE', label: '배송 완료' },
      { value: 'CANCEL', label: '배송 취소' },
    ],
    [],
  );

  const normalizeDate = (yyyyMMdd) => {
    if (!yyyyMMdd) return '';
    const s = String(yyyyMMdd);
    if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    return s;
  };

  const normalizePhone = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return String(value);
  };

  const formatWon = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return `${num.toLocaleString()}원`;
  };

  useEffect(() => {
    if (!open) return;
    if (!deliveryId) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDeliveryByIdAdmin(deliveryId);
        const wrapper = res?.data ?? res;
        const payload = wrapper?.data ?? wrapper;

        const orderNumber = payload?.orderNumber ?? payload?.orderNo ?? payload?.transactionId ?? '';
        const orderDate = normalizeDate(payload?.orderedDate ?? payload?.orderDate ?? payload?.createdAt ?? '');
        const phoneNumber = payload?.phoneNumber ?? payload?.phone ?? '';
        const receiverName = payload?.receiverName ?? payload?.receiver ?? payload?.name ?? '';
        const zipCode = payload?.zipCode ?? payload?.zipcode ?? payload?.postalCode ?? '';
        const address = payload?.address ?? payload?.deliveryAddress ?? '';
        const detailAddress = payload?.detailAddress ?? '';
        const deliveryStatus = payload?.deliveryStatus ?? payload?.status ?? 'READY';
        const trackingNumber = payload?.trackingNumber ?? payload?.invoiceNumber ?? payload?.waybillNumber ?? '';
        const totalAmount = payload?.totalAmount ?? payload?.amount ?? payload?.price ?? '';
        const totalCount = payload?.totalCount ?? payload?.productCount ?? payload?.count ?? '';
        const productListResponses = payload?.productListResponses ?? [];

        const items = payload?.items ?? payload?.products ?? payload?.paymentProducts ?? payload?.orderItems ?? [];

        setForm({
          orderNumber: String(orderNumber ?? ''),
          orderDate: String(orderDate ?? ''),
          phoneNumber: String(phoneNumber ?? ''),
          receiverName: String(receiverName ?? ''),
          zipCode: String(zipCode ?? ''),
          address: String(address ?? ''),
          detailAddress: String(detailAddress ?? ''),
          deliveryStatus: String(deliveryStatus ?? 'READY'),
          trackingNumber: String(trackingNumber ?? ''),
          totalAmount: String(totalAmount ?? ''),
          totalCount: String(totalCount ?? ''),
          productListResponses: Array.isArray(productListResponses) ? productListResponses : [],
          items: Array.isArray(items) ? items : [],
        });
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, deliveryId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const disabledAll = !isEdit || loading || saving;

  const buildPayloadForAdmin = () => ({
    receiverName: form.receiverName,
    zipCode: form.zipCode,
    detailAddress: form.detailAddress,
    deliveryStatus: form.deliveryStatus,
    trackingNumber: form.trackingNumber,
  });

  const handlePrimary = async () => {
    if (!isEdit) {
      onClose?.();
      return;
    }
    if (!deliveryId) return;

    setSaving(true);
    setError(null);
    try {
      await updateDeliveryByAdmin(deliveryId, buildPayloadForAdmin());
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => onClose?.()} role='presentation'>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role='dialog' aria-modal='true'>
        <div className={styles.header}>
          <div className={styles.headerTitle}>배송 정보</div>
          <button type='button' className={styles.closeBtn} onClick={() => onClose?.()} aria-label='닫기'>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={`${styles.field} ${styles.full}`}>
              <div className={styles.label}>상태</div>
              <div>불러오는 중...</div>
            </div>
          )}
          {!loading && error && (
            <div className={`${styles.field} ${styles.full}`}>
              <div className={styles.label}>상태</div>
              <div>오류가 발생했습니다.</div>
            </div>
          )}

          <div className={styles.field}>
            <div className={styles.label}>
              주문번호 <span className={styles.required}>*</span>
            </div>
            <input className={styles.input} value={form.orderNumber} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>
              주문 날짜 <span className={styles.required}>*</span>
            </div>
            <input className={styles.input} value={form.orderDate} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>
              휴대폰 번호 <span className={styles.required}>*</span>
            </div>
            <input className={styles.input} value={normalizePhone(form.phoneNumber)} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>수령인 이름</div>
            <input
              className={styles.input}
              value={form.receiverName}
              disabled={disabledAll}
              onChange={(e) => setField('receiverName', e.target.value)}
              placeholder='홍길동'
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>우편번호</div>
            <input
              className={styles.input}
              value={form.zipCode}
              disabled={disabledAll}
              onChange={(e) => setField('zipCode', e.target.value)}
              placeholder='00000'
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>
              도로명 주소 <span className={styles.required}>*</span>
            </div>
            <input className={styles.input} value={form.address} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>상세주소</div>
            <input
              className={styles.input}
              value={form.detailAddress}
              disabled={disabledAll}
              onChange={(e) => setField('detailAddress', e.target.value)}
              placeholder='상세주소'
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>배송 상태</div>
            <select
              className={styles.select}
              value={form.deliveryStatus}
              disabled={disabledAll}
              onChange={(e) => setField('deliveryStatus', e.target.value)}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>송장번호</div>
            <input
              className={styles.input}
              value={form.trackingNumber}
              disabled={disabledAll}
              onChange={(e) => setField('trackingNumber', e.target.value)}
              placeholder='송장번호'
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>
              총 결제 금액 <span className={styles.required}>*</span>
            </div>
            <input className={styles.input} value={formatWon(form.totalAmount)} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>
              총 상품 개수 <span className={styles.required}>*</span>
            </div>
            <input
              className={styles.input}
              value={Array.isArray(form.productListResponses) ? `${form.productListResponses.length}개` : '0개'}
              disabled
              readOnly
            />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <div className={styles.label}>주문 내역</div>

            {Array.isArray(form.productListResponses) && form.productListResponses.length > 0 ? (
              <div className={styles.orderList}>
                {form.productListResponses.map((p, idx) => {
                  const name = p?.productName ?? `상품 ${idx + 1}`;
                  const quantity = p?.productQuantity ?? 1;
                  const price = p?.productPrice ?? '';
                  const option = p?.option;

                  return (
                    <div className={styles.orderRow} key={p?.productId ?? `${name}-${idx}`}>
                      <div className={styles.orderDot} />
                      <div className={styles.orderCard}>
                        <div className={styles.orderTitle}>{name}</div>

                        {(option || price !== '' || quantity !== null) && (
                          <>
                            <div className={styles.orderDivider} />
                            <div className={styles.orderMeta}>
                              {option ? (
                                <>
                                  <span className={styles.metaPill}>옵션</span>
                                  <span className={styles.metaValue}>{option}</span>
                                </>
                              ) : null}
                              <span className={styles.metaPill}>수량</span>
                              <span className={styles.metaValue}>{quantity}개</span>
                              {price !== '' ? (
                                <>
                                  <span className={styles.metaPill}>가격</span>
                                  <span className={styles.metaValue}>{formatWon(price)}</span>
                                </>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>주문 내역이 없습니다.</div>
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <button type='button' className={styles.cancelBtn} onClick={() => onClose?.()}>
            취소
          </button>
          <button type='button' className={styles.submitBtn} onClick={handlePrimary} disabled={saving || loading}>
            {isEdit ? (saving ? '저장 중...' : '수정 완료') : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}
