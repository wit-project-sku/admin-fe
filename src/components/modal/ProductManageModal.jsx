import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ProductManageModal.module.css';
import AdminModal from '@commons/AdminModal';
import { getCategories } from '@apis/categoryApi';
import { getKiosks } from '@apis/kioskApi';
import { createProduct, updateProduct, getProductDetail } from '@apis/productApi';

export default function ProductManageModal({ onClose, mode = 'create', initialProduct = null, onSuccess }) {
  const fileInputRef = useRef(null);

  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    status: '판매중',
    kiosks: [],
    shortDesc: '',
    longDesc: '',
    files: [],
  });

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [kiosks, setKiosks] = useState([]);
  const [kioskLoading, setKioskLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCategoryName, setDetailCategoryName] = useState('');
  const [existingImages, setExistingImages] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    const productId = initialProduct?.id;
    if (!productId) return;

    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await getProductDetail(productId);
        // axios response 또는 response.data 형태 둘 다 대응
        const wrapper = res?.data ?? res;
        const payload = wrapper?.data ?? wrapper;

        setDetailCategoryName(payload?.categoryName ?? '');
        setExistingImages(Array.isArray(payload?.images) ? payload.images : []);

        setForm((prev) => ({
          ...prev,
          name: payload?.name ?? '',
          // category는 목록을 불러온 뒤 name으로 id를 찾아 매핑할 예정
          price: String(payload?.price ?? ''),
          stock: String(payload?.stock ?? ''),
          status: mapStatusToLabel(payload?.status),
          shortDesc: payload?.subTitle ?? '',
          longDesc: payload?.description ?? '',
          kiosks: Array.isArray(payload?.kioskIds) ? payload.kioskIds : [],
          files: [],
        }));
      } catch (e) {
        setSubmitError(e);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [isEdit, initialProduct?.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const res = await getCategories();
        const list = Array.isArray(res) ? res : res?.data;
        setCategories(Array.isArray(list) ? list : []);
      } catch (e) {
        console.log(e);
        setCategories([]);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    if (!detailCategoryName) return;
    if (!Array.isArray(categories) || categories.length === 0) return;

    const found = categories.find((c) => c?.name === detailCategoryName);
    if (!found) return;

    setForm((prev) => ({
      ...prev,
      category: String(found.id),
    }));
  }, [isEdit, detailCategoryName, categories]);

  const statusOptions = useMemo(() => ['판매중', '품절', '숨김'], []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleKiosk = (kioskId) => {
    setForm((prev) => {
      const has = prev.kiosks.includes(kioskId);
      const next = has ? prev.kiosks.filter((id) => id !== kioskId) : [...prev.kiosks, kioskId];
      return { ...prev, kiosks: next };
    });
  };

  const mapStatusToLabel = (status) => {
    if (status === 'ON_SALE') return '판매중';
    if (status === 'SOLD_OUT') return '품절';
    if (status === 'HIDDEN') return '숨김';
    return '판매중';
  };

  const mapStatusToEnum = (label) => {
    if (label === '판매중') return 'ON_SALE';
    if (label === '품절') return 'SOLD_OUT';
    if (label === '숨김') return 'HIDDEN';
    return 'ON_SALE';
  };

  const buildProductRequest = () => {
    return {
      name: form.name,
      subTitle: form.shortDesc,
      description: form.longDesc,
      price: Number(form.price),
      stock: Number(form.stock),
      status: mapStatusToEnum(form.status),
      categoryId: Number(form.category) || null,
      kioskIds: form.kiosks,
    };
  };
  useEffect(() => {
    const fetchKiosks = async () => {
      setKioskLoading(true);
      try {
        const res = await getKiosks();
        const list = Array.isArray(res) ? res : res?.data;
        setKiosks(Array.isArray(list) ? list : []);
      } catch (e) {
        console.log(e);
        setKiosks([]);
      } finally {
        setKioskLoading(false);
      }
    };

    fetchKiosks();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setExistingImages([]);
    }
  }, [isEdit]);

  const previewUrls = useMemo(() => {
    return (form.files || []).map((file) => URL.createObjectURL(file));
  }, [form.files]);

  // 메모리 누수 방지
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (isEdit && selectedFiles.length > 0) {
      setExistingImages([]);
    }
    setForm((prev) => {
      const merged = [...prev.files, ...selectedFiles];
      return {
        ...prev,
        files: merged.slice(0, 4),
      };
    });
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    try {
      const productRequest = buildProductRequest();

      if (!isEdit) {
        // create
        const categoryId = Number(form.category);
        if (!categoryId) {
          setSubmitError(new Error('카테고리를 선택해주세요.'));
          return;
        }

        // 이미지 최소 1장, 최대 4장 (백엔드 제약)
        if (!form.files || form.files.length === 0) {
          setSubmitError(new Error('상품 이미지를 최소 1장 업로드해주세요.'));
          return;
        }

        await createProduct(categoryId, productRequest, form.files);
      } else {
        // edit
        const productId = initialProduct?.id;
        if (!productId) {
          setSubmitError(new Error('수정할 상품 정보가 없습니다.'));
          return;
        }

        // 수정은 images가 optional이므로, 선택된 파일이 없으면 undefined로 보내서 파트 자체를 생략
        const images = form.files && form.files.length > 0 ? form.files : undefined;
        await updateProduct(productId, productRequest, images);
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      title={isEdit ? '상품 수정' : '상품 등록'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={submitting ? (isEdit ? '수정 중...' : '추가 중...') : isEdit ? '수정' : '추가'}
      cancelText='취소'
      isSubmitting={submitting}
      submitDisabled={submitting}
    >
      {submitError && (
        <div className={styles.noData} role='alert'>
          {isEdit ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.'}
        </div>
      )}
      {isEdit && detailLoading && (
        <div className={styles.noData} role='status'>
          상품 정보를 불러오는 중...
        </div>
      )}
      {/* 상품명 */}
      <div className={`${styles.field} ${styles.full}`}>
        <label className={styles.label}>
          상품명 <span className={styles.required}>*</span>
        </label>
        <input
          className={styles.input}
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder='상품 이름을 작성해주세요'
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          카테고리 <span className={styles.required}>*</span>
        </label>
        <select
          className={styles.select}
          value={form.category}
          onChange={(e) => setField('category', e.target.value)}
          required
          disabled={categoryLoading}
        >
          <option value=''>선택</option>
          {categoryLoading && <option disabled>불러오는 중...</option>}
          {!categoryLoading &&
            categories.map((c) => (
              <option key={c.id ?? c} value={c.id ?? c}>
                {c.name ?? c}
              </option>
            ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          가격 <span className={styles.required}>*</span>
        </label>
        <div className={styles.currencyBox}>
          <span className={styles.currency}>₩</span>
          <input
            className={styles.input}
            type='number'
            min='0'
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
            placeholder='10,000'
            required
          />
        </div>
      </div>

      {/* 현재 재고 / 상태 */}
      <div className={styles.field}>
        <label className={styles.label}>
          현재 재고 <span className={styles.required}>*</span>
        </label>
        <input
          className={styles.input}
          type='number'
          min='0'
          value={form.stock}
          onChange={(e) => setField('stock', e.target.value)}
          placeholder='100'
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          상태 <span className={styles.required}>*</span>
        </label>
        <select className={styles.select} value={form.status} onChange={(e) => setField('status', e.target.value)}>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 판매중인 키오스크 */}
      <div className={`${styles.field} ${styles.full}`}>
        <div className={styles.label}>판매할 키오스크</div>
        <div className={styles.kioskRow}>
          {kioskLoading && <div className={styles.noData}>키오스크 불러오는 중...</div>}
          {!kioskLoading && kiosks.length === 0 && <div className={styles.noData}>키오스크가 없습니다.</div>}
          {!kioskLoading &&
            kiosks.map((k) => {
              const active = form.kiosks.includes(k.id);
              return (
                <button
                  key={k.id}
                  type='button'
                  className={active ? `${styles.kioskBtn} ${styles.kioskActive}` : styles.kioskBtn}
                  onClick={() => toggleKiosk(k.id)}
                  aria-pressed={active}
                >
                  {k.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* 상품 소제목 */}
      <div className={`${styles.field} ${styles.full}`}>
        <label className={styles.label}>
          상품 소제목
          <span className={styles.charCount}>{form.shortDesc.length}/50</span>
        </label>
        <textarea
          className={styles.textarea}
          value={form.shortDesc}
          onChange={(e) => {
            if (e.target.value.length <= 50) {
              setField('shortDesc', e.target.value);
            }
          }}
          placeholder='상품에 대한 소제목을 작성해주세요'
          rows={3}
          maxLength={50}
        />
      </div>

      {/* 상품 설명 */}
      <div className={`${styles.field} ${styles.full}`}>
        <label className={styles.label}>
          상품 설명
          <span className={styles.charCount}>{form.longDesc.length}/200</span>
        </label>
        <textarea
          className={`${styles.textarea} ${styles.textareaTall}`}
          value={form.longDesc}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              setField('longDesc', e.target.value);
            }
          }}
          placeholder='상품에 대한 설명을 작성해주세요'
          rows={6}
          maxLength={200}
        />
      </div>

      {/* 상품 사진 */}
      <div className={`${styles.field} ${styles.full}`}>
        <label className={styles.label}>상품 사진</label>
        <div className={styles.fileBox} onClick={() => fileInputRef.current?.click()} role='button' tabIndex={0}>
          <div className={styles.fileHint}>
            {form.files.length > 0 ? `선택된 파일 ${form.files.length} / 4` : '이미지는 최대 4개까지 업로드 가능합니다'}
          </div>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type='file'
            accept='image/*'
            multiple
            onChange={handleFileChange}
          />
        </div>

        {/* 수정 모드: 기존 이미지 미리보기 */}
        {isEdit && Array.isArray(existingImages) && existingImages.length > 0 && (
          <div className={styles.previewGrid}>
            {existingImages
              .slice()
              .sort((a, b) => (a?.orderNum ?? 0) - (b?.orderNum ?? 0))
              .map((img, idx) => (
                <img
                  key={img?.id ?? `${img?.imageUrl}-${idx}`}
                  className={styles.previewImg}
                  src={img?.imageUrl}
                  alt={`기존 이미지 ${idx + 1}`}
                  width={200}
                  height={200}
                />
              ))}
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className={styles.previewGrid}>
            {previewUrls.map((url, idx) => (
              <img
                key={`${url}-${idx}`}
                className={styles.previewImg}
                src={url}
                alt={`선택 이미지 ${idx + 1}`}
                width={200}
                height={200}
              />
            ))}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
