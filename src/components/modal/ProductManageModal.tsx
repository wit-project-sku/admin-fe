import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './ProductManageModal.module.css';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import {
  extractKioskIdsFromDetail,
  normalizeProductStatus,
  resolveProductCategoryId,
  scalarToInputString,
  unwrapDetailBody,
} from '../../utils/modalFormMapping';
import { unwrapList } from '../../utils/unwrapApi';
import { useGetProductById } from '../../hooks/product-api/useGetProductById';
import { useAddProduct } from '../../hooks/product-api/useAddProduct';
import { useUpdateProduct } from '../../hooks/product-api/useUpdateProduct';
import type { ProductStatus, ProductWriteBody } from '../../hooks/product-api/productApiTypes';
import type { ProductRow } from '../../features/products/productListMappers';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  MultiSelectField,
  TextAreaField,
  type MultiSelectItem,
  type SelectOption,
} from './ModalElements';
import { useGetAllProductCategories } from '@/hooks/product-api/useGetAllProductCategories';

const PRODUCT_STATUS_ALLOWED = ['ON_SALE', 'SOLD_OUT', 'HIDDEN'] as const;

type ProductFormState = {
  name: string;
  subTitle: string;
  categoryId: string;
  price: string;
  stock: string;
  description: string;
  status: ProductStatus;
  kioskIds: (string | number)[];
};

type ProductManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  product: ProductRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

function emptyForm(): ProductFormState {
  return {
    name: '',
    subTitle: '',
    categoryId: '',
    price: '',
    stock: '',
    description: '',
    status: 'ON_SALE',
    kioskIds: [],
  };
}

type ProductFieldErrors = Partial<
  Record<
    'name' | 'subTitle' | 'categoryId' | 'price' | 'stock' | 'status' | 'kioskIds' | 'description' | 'images',
    string
  >
>;

function validateProductForm(form: ProductFormState, imageCount: number): ProductFieldErrors {
  const e: ProductFieldErrors = {};
  if (!form.name.trim()) e.name = '상품명을 입력해 주세요.';
  if (!form.subTitle.trim()) e.subTitle = '상품 소제목을 입력해 주세요.';

  const categoryId = Number(form.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) e.categoryId = '카테고리를 선택해 주세요.';

  const price = Number(form.price);
  if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) {
    e.price = '0 이상의 가격을 입력해 주세요.';
  }

  const stock = Number(form.stock);
  if (form.stock.trim() === '' || !Number.isFinite(stock) || stock < 0) {
    e.stock = '0 이상의 재고를 입력해 주세요.';
  }

  if (!PRODUCT_STATUS_ALLOWED.includes(form.status)) e.status = '판매 상태를 선택해 주세요.';

  const kioskIds = (form.kioskIds ?? []).map((id) => Number(id)).filter((n) => Number.isFinite(n));
  if (kioskIds.length === 0) e.kioskIds = '판매 키오스크를 1개 이상 선택해 주세요.';

  if (!form.description.trim()) e.description = '상품 상세 설명을 입력해 주세요.';
  if (imageCount <= 0) e.images = '상품 이미지를 1장 이상 등록해 주세요.';

  return e;
}

function buildProductWriteBody(form: ProductFormState): ProductWriteBody | null {
  const name = form.name.trim();
  if (!name) return null;

  const subTitle = form.subTitle.trim();
  if (!subTitle) return null;

  const categoryId = Number(form.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;

  const kioskIds = (form.kioskIds ?? []).map((id) => Number(id)).filter((n) => Number.isFinite(n));
  if (kioskIds.length === 0) return null;

  const price = Number(form.price);
  const stock = Number(form.stock);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) return null;

  if (!PRODUCT_STATUS_ALLOWED.includes(form.status)) return null;

  const description = form.description.trim();
  if (!description) return null;

  return {
    name,
    subTitle,
    description,
    price,
    stock,
    status: form.status,
    categoryId,
    kioskIds,
  };
}

export default function ProductManageModal({ open, mode, product, onClose, onSuccess }: ProductManageModalProps) {
  const { data: categoriesData } = useGetAllProductCategories();
  const categories = useMemo(() => unwrapList(categoriesData) as SelectOption[], [categoriesData]);
  const { data: kiosksData } = useGetKiosks();
  const kiosks = unwrapList(kiosksData) as MultiSelectItem[];
  const { data: detailData, isLoading: loading } = useGetProductById(open && mode === 'edit' ? product?.id : null);
  const { addProductAsync } = useAddProduct();
  const { updateProductAsync } = useUpdateProduct();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  /** Number of leading preview URLs from the server (edit mode); new uploads are appended after this. */
  const [serverPreviewCount, setServerPreviewCount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});

  useEffect(() => {
    if (!open) return;
    if (mode !== 'edit') {
      setForm(emptyForm());
      setImages([]);
      setPreviewUrls([]);
      setServerPreviewCount(0);
    }
    setFieldErrors({});
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== 'edit' || !detailData || product?.id == null) return;
    const d = unwrapDetailBody(detailData);
    if (d.id != null && String(d.id) !== String(product.id)) return;

    setForm({
      name: scalarToInputString(d.name),
      subTitle: scalarToInputString(d.subTitle ?? d.sub_title),
      categoryId: resolveProductCategoryId(d, categories),
      price: scalarToInputString(d.price),
      stock: scalarToInputString(d.stock),
      description: scalarToInputString(d.description),
      status: normalizeProductStatus(d.status, PRODUCT_STATUS_ALLOWED, 'ON_SALE') as ProductStatus,
      kioskIds: (() => {
        const fromDetail = extractKioskIdsFromDetail(d);
        if (fromDetail.length > 0) return fromDetail;
        const fromList = product?.kioskIds;
        if (Array.isArray(fromList) && fromList.length > 0) return fromList;
        return [];
      })(),
    });

    const imgs = Array.isArray(d.images) ? d.images : [];
    const urls = imgs
      .map((img) => {
        if (!img || typeof img !== 'object') return '';
        const o = img as Record<string, unknown>;
        return String(o.imageUrl ?? o.url ?? o.image_url ?? '');
      })
      .filter(Boolean);
    setPreviewUrls(urls);
    setServerPreviewCount(urls.length);
    setImages([]);
  }, [open, mode, detailData, product?.id, product?.kioskIds, categories]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const clearFieldError = (key: keyof ProductFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    setImages((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    clearFieldError('images');
  };

  const handleDeleteImage = (url: string | undefined) => {
    if (!url) return;
    setPreviewUrls((prev) => {
      const idx = prev.indexOf(url);
      if (idx < 0) return prev;
      if (idx < serverPreviewCount) {
        setServerPreviewCount((c) => Math.max(0, c - 1));
      } else {
        const fileIdx = idx - serverPreviewCount;
        setImages((files) => files.filter((_, i) => i !== fileIdx));
      }
      return prev.filter((each) => each !== url);
    });
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const validation = validateProductForm(form, previewUrls.length);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    setFieldErrors({});

    const productData = buildProductWriteBody(form);
    if (!productData) {
      alert('입력값을 다시 확인해 주세요.');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        await addProductAsync({ productData, images });
      } else if (product?.id != null) {
        await updateProductAsync({ productId: product.id, updatedData: productData, images });
      }
      onSuccess?.();
    } catch {
      alert('저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.');
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
        <form style={{ display: 'contents' }} onSubmit={handleSubmit}>
          <div className={styles.body}>
            <InputField
              label='상품명'
              required
              error={fieldErrors.name}
              placeholder='예: [신규] 한복 합성 폰케이스'
              value={form.name}
              onChange={(e) => {
                clearFieldError('name');
                setForm({ ...form, name: e.target.value });
              }}
            />

            <InputField
              label='상품 소제목'
              required
              error={fieldErrors.subTitle}
              placeholder='리스트에 노출될 짧은 설명'
              value={form.subTitle}
              onChange={(e) => {
                clearFieldError('subTitle');
                setForm({ ...form, subTitle: e.target.value });
              }}
            />

            <DropDownField
              label='카테고리'
              options={categories}
              required
              error={fieldErrors.categoryId}
              value={form.categoryId === '' ? '' : String(form.categoryId)}
              onChange={(e) => {
                clearFieldError('categoryId');
                setForm({ ...form, categoryId: e.target.value });
              }}
            />

            <InputField
              label='가격 (KRW)'
              required
              error={fieldErrors.price}
              type='number'
              min='0'
              placeholder='0'
              value={form.price}
              onChange={(e) => {
                clearFieldError('price');
                setForm({ ...form, price: e.target.value });
              }}
            />

            <InputField
              label='현재 재고'
              required
              error={fieldErrors.stock}
              type='number'
              min='0'
              placeholder='0'
              value={form.stock}
              onChange={(e) => {
                clearFieldError('stock');
                setForm({ ...form, stock: e.target.value });
              }}
            />

            <DropDownField
              label='판매 상태'
              options={STATUS_OPTIONS}
              required
              error={fieldErrors.status}
              value={String(form.status)}
              onChange={(e) => {
                clearFieldError('status');
                setForm({ ...form, status: e.target.value as ProductStatus });
              }}
            />

            <MultiSelectField
              label='판매 키오스크 설정'
              required
              error={fieldErrors.kioskIds}
              items={kiosks}
              selectedIds={form.kioskIds || []}
              onChange={(newIds) => {
                clearFieldError('kioskIds');
                setForm({ ...form, kioskIds: newIds });
              }}
            />

            <TextAreaField
              label='상품 상세 설명'
              required
              error={fieldErrors.description}
              placeholder='상품에 대한 자세한 정보를 입력하세요'
              value={form.description}
              onChange={(e) => {
                clearFieldError('description');
                setForm({ ...form, description: e.target.value });
              }}
            />

            <ImageUploadField
              label='상품 이미지 (최대 4개)'
              required
              error={fieldErrors.images}
              spanFull
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
