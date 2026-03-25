import { useState, useEffect } from 'react';
import m from './Modal.module.css';
import shared from '@commons/shared.module.css';
import { fetchDeliveryByIdAdmin, updateDeliveryByAdmin } from '@apis/deliveryApi';

const STATUS_OPTIONS = [
  { value:'ORDERED',  label:'주문완료' },
  { value:'READY',    label:'배송준비' },
  { value:'SHIPPING', label:'배송중' },
  { value:'COMPLETE', label:'배송완료' },
  { value:'PICKED_UP',label:'직접수령' },
  { value:'CANCEL',   label:'취소' },
];

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : String(v);
};

export default function DeliveryManageModal({ open, mode, deliveryId, onClose, onSuccess }) {
  const [data, setData]       = useState(null);
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!open || !deliveryId) return;
    setLoading(true);
    setError('');
    fetchDeliveryByIdAdmin(deliveryId)
      .then((res) => {
        const d = res?.data?.data ?? res?.data ?? res;
        setData(d);
        setForm({
          deliveryStatus: d.deliveryStatus ?? d.status ?? 'ORDERED',
          recipientName:  d.recipientName ?? '',
          phoneNumber:    d.phoneNumber ?? '',
          address:        d.address ?? '',
          trackingNumber: d.trackingNumber ?? '',
        });
      })
      .catch(() => setError('배송 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [open, deliveryId]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeliveryByAdmin(deliveryId, form);
      onSuccess?.();
    } catch { setError('저장에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const isEdit = mode === 'edit';
  const Row = ({ label, value, field, type='text' }) => (
    <div className={m.field}>
      <label className={m.label}>{label}</label>
      {isEdit && field ? (
        field === 'status' ? (
          <select className={m.select} value={form.deliveryStatus} onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input type={type} className={m.input} value={form[field] ?? ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
        )
      ) : (
        <input className={m.input} value={value ?? '-'} disabled readOnly />
      )}
    </div>
  );

  return (
    <div className={m.overlay} onClick={onClose}>
      <div className={m.modal} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <span className={m.title}>{isEdit ? '배송 정보 수정' : '배송 상세'}</span>
          <button className={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={m.body}>
          {loading ? (
            <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>불러오는 중...</p>
          ) : error ? (
            <p style={{ fontSize:12, color:'#dc2626', textAlign:'center', padding:'20px 0' }}>{error}</p>
          ) : (
            <>
              <div className={m.fieldRow}>
                <Row label="수령인" value={data?.recipientName} field="recipientName" />
                <Row label="전화번호" value={normalizePhone(data?.phoneNumber)} field="phoneNumber" />
              </div>
              <Row label="주소" value={data?.address} field="address" />
              <div className={m.fieldRow}>
                <Row label="배송 상태" value={data?.deliveryStatus} field="status" />
                <Row label="운송장 번호" value={data?.trackingNumber} field="trackingNumber" />
              </div>
              <Row label="결제 금액" value={data?.payment?.totalAmount ? `${Number(data.payment.totalAmount).toLocaleString()}원` : '-'} />
            </>
          )}
        </div>
        <div className={m.footer}>
          <button className={shared.btnOutline} onClick={onClose}>닫기</button>
          {isEdit && (
            <button className={shared.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
