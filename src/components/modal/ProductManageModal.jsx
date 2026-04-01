import { useEffect, useState } from 'react';
import styles from './ProductManageModal.module.css';
import { createProduct, updateProduct, getProductDetail } from '@apis/productApi';
import { getCategories } from '@apis/categoryApi';
import { getKiosks } from '@apis/kioskApi';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  MultiSelectField,
  TextAreaField,
} from './ModalElements';

export default function ProductManageModal({ open, mode, product, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subTitle: '',
    categoryId: '',
    price: '',
    stock: '',
    description: '',
    status: 'ON_SALE',
    kioskIds: [],
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const toggleKiosk = (id) => {
    setForm((prev) => {
      const isSelected = prev.kioskIds.includes(id);
      return {
        ...prev,
        kioskIds: isSelected ? prev.kioskIds.filter((kId) => kId !== id) : [...prev.kioskIds, id],
      };
    });
  };

  useEffect(() => {
    if (!open) return;
    getCategories()
      .then((res) => setCategories(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(() => {});
    getKiosks()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setKiosks(list);
      })
      .catch(() => {});

    if (mode === 'edit' && product?.id) {
      setLoading(true);
      getProductDetail(product.id)
        .then((res) => {
          const d = res?.data?.data ?? res?.data ?? res;
          setForm({
            name: d.name ?? '',
            subTitle: d.subTitle ?? '',
            categoryId: d.category?.id ?? '',
            price: d.price ?? '',
            stock: d.stock ?? '',
            description: d.description ?? '',
            status: d.status ?? 'ON_SALE',
            kioskIds: (d.kioskProducts ?? []).map((kp) => kp.kiosk?.id).filter(Boolean),
          });
          setPreviewUrls((d.images ?? []).map((img) => img.imageUrl ?? img.url ?? ''));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setForm({
        name: '',
        subTitle: '',
        categoryId: '',
        price: '',
        stock: '',
        description: '',
        status: 'ON_SALE',
        kioskIds: [],
      });
      setImages([]);
      setPreviewUrls([]);
    }
  }, [open, mode, product]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleDeleteImage = (url) => {
    setPreviewUrls((prev) => [...prev.filter((each) => each !== url)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        subTitle: form.subTitle,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
        status: form.status,
        kioskIds: form.kioskIds,
      };
      if (mode === 'create') {
        await createProduct(form.categoryId, payload, images);
      } else {
        await updateProduct(product.id, payload, images);
      }
      onSuccess?.();
    } catch {
      /* handle */
    } finally {
      setSaving(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: 'ON_SALE', label: '판매중' },
    { value: 'SOLD_OUT', label: '품절' },
    { value: 'HIDDEN', label: '숨김' },
  ];

  return (
    <ModalContainer>
      <ModalHeader title={mode === 'create' ? '상품 등록' : '상품 수정'} onClose={onClose} />

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>데이터를 불러오는 중입니다...</div>
      ) : (
        <form style={{ display: 'contents' }}>
          <div className={styles.body}>
            <InputField
              label='상품명'
              required
              placeholder='예: [신규] 한복 합성 폰케이스'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <InputField
              label='상품 소제목'
              placeholder='리스트에 노출될 짧은 설명'
              value={form.subTitle}
              onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
            />

            <DropDownField
              label='카테고리'
              options={categories}
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            />

            <InputField
              label='가격 (KRW)'
              required
              type='number'
              min='0'
              placeholder='0'
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <InputField
              label='현재 재고'
              required
              type='number'
              min='0'
              placeholder='0'
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />

            <DropDownField
              label='판매 상태'
              options={STATUS_OPTIONS}
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />

            <MultiSelectField
              label='판매 키오스크 설정'
              required
              items={kiosks}
              selectedIds={form.kioskIds || []}
              onChange={(newIds) => setForm({ ...form, kioskIds: newIds })}
            />

            <TextAreaField
              label='상품 상세 설명'
              placeholder='상품에 대한 자세한 정보를 입력하세요'
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <ImageUploadField
              label='상품 이미지 (최대 4개)'
              previewUrls={previewUrls}
              onUpload={handleFileChange}
              onDelete={(img) => handleDeleteImage(img)}
              maxCount={4}
              isEdit
            />
          </div>

          <div>
            <ModalFooter
              onCancel={onClose}
              cancelText='취소'
              onSubmit={handleSubmit}
              submitText={saving ? '처리 중...' : mode === 'create' ? '상품 등록' : '수정 완료'}
            />
          </div>
        </form>
      )}
    </ModalContainer>
  );
}
