import { useEffect, useState } from 'react';
import styles from './Modal.module.css';
import { createProduct, updateProduct, getProductDetail } from '@apis/productApi';
import { getCategories } from '@apis/categoryApi';
import { getKiosks } from '@apis/kioskApi';

export default function ProductManageModal({ open, mode, product, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [kiosks, setKiosks]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);

  const [form, setForm] = useState({
    name: '', subTitle: '', categoryId: '', price: '', stock: '',
    description: '', status: 'ON_SALE', kioskIds: [],
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (!open) return;
    getCategories().then((res) => setCategories(Array.isArray(res) ? res : res?.data ?? [])).catch(() => {});
    getKiosks().then((res) => {
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setKiosks(list);
    }).catch(() => {});

    if (mode === 'edit' && product?.id) {
      setLoading(true);
      getProductDetail(product.id)
        .then((res) => {
          const d = res?.data?.data ?? res?.data ?? res;
          setForm({
            name:       d.name       ?? '',
            subTitle:   d.subTitle   ?? '',
            categoryId: d.category?.id ?? '',
            price:      d.price      ?? '',
            stock:      d.stock      ?? '',
            description:d.description?? '',
            status:     d.status     ?? 'ON_SALE',
            kioskIds:   (d.kioskProducts ?? []).map((kp) => kp.kiosk?.id).filter(Boolean),
          });
          setPreviewUrls((d.images ?? []).map((img) => img.imageUrl ?? img.url ?? ''));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setForm({ name:'', subTitle:'', categoryId:'', price:'', stock:'', description:'', status:'ON_SALE', kioskIds:[] });
      setImages([]);
      setPreviewUrls([]);
    }
  }, [open, mode, product]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name:       form.name,
        subTitle:   form.subTitle,
        price:      Number(form.price),
        stock:      Number(form.stock),
        description:form.description,
        status:     form.status,
        kioskIds:   form.kioskIds,
      };
      if (mode === 'create') {
        await createProduct(form.categoryId, payload, images);
      } else {
        await updateProduct(product.id, payload, images);
      }
      onSuccess?.();
    } catch { /* handle */ }
    finally { setSaving(false); }
  };

  const STATUS_OPTIONS = [
    { value: 'ON_SALE',  label: '판매중' },
    { value: 'SOLD_OUT', label: '품절' },
    { value: 'HIDDEN',   label: '숨김' },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLg}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{mode === 'create' ? '상품 등록' : '상품 수정'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>불러오는 중...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.body}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>상품명</span>
                <input required className={styles.fieldInput} placeholder="상품명"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>부제목</span>
                <input className={styles.fieldInput} placeholder="부제목"
                  value={form.subTitle} onChange={(e) => setForm({ ...form, subTitle: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>카테고리</span>
                <select required className={styles.fieldSelect}
                  value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">카테고리 선택</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>상태</span>
                <select className={styles.fieldSelect}
                  value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>가격 (원)</span>
                <input required type="number" min="0" className={styles.fieldInput} placeholder="0"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>재고</span>
                <input required type="number" min="0" className={styles.fieldInput} placeholder="0"
                  value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>설명</span>
                <textarea className={styles.fieldTextarea} placeholder="상품 설명"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {/* Image upload */}
              <div className={`${styles.field} ${styles.fieldFull} ${styles.imageSection}`}>
                <span className={styles.fieldLabel}>상품 이미지</span>
                <div className={styles.imagesGrid}>
                  {previewUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className={styles.imageThumbnail} />
                  ))}
                  <div className={styles.imageUploadArea}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>취소</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? '저장 중...' : mode === 'create' ? '등록' : '수정'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
