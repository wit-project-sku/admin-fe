import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './ShopsManageModal.module.css';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { unwrapList } from '../../utils/unwrapApi';
import { scalarToInputString } from '../../utils/modalFormMapping';
import { useAddShop } from '../../hooks/shop-api/useAddShop';
import { useUpdateShop } from '../../hooks/shop-api/useUpdateShop';
import { useAddShopImages } from '../../hooks/shop-api/useAddShopImages';
import { useDeleteShopImage } from '../../hooks/shop-api/useDeleteShopImage';
import type { ShopWriteBody } from '../../hooks/shop-api/shopApiTypes';
import type { ShopRow } from '../../features/shops/shopsListMappers';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  TextAreaField,
  type SelectOption,
} from './ModalElements';

const LANGS = [
  { code: 'Kr', label: '한국어 (KR)' },
  { code: 'En', label: '영어 (EN)' },
  { code: 'Jp', label: '일본어 (JP)' },
  { code: 'Ch', label: '중국어 (CH)' },
] as const;

const LANG_FIELDS: { base: string; label: string; textarea?: boolean }[] = [
  { base: 'shopName', label: '상점명' },
  { base: 'baseCategory', label: '1차 카테고리' },
  { base: 'secondCategory', label: '2차 카테고리' },
  { base: 'aiCategory', label: 'AI 카테고리' },
  { base: 'address', label: '주소' },
  { base: 'hashTag', label: '해시태그' },
  { base: 'description', label: '설명', textarea: true },
];

const COMMON_FIELDS = [
  { key: 'openTime', label: '영업시간', placeholder: '예: Open> Mon~Sun 11:30-22:00' },
  { key: 'tel', label: '전화번호', placeholder: '예: 82-2-733-0853' },
  { key: 'naverLink', label: '네이버 링크', placeholder: 'https://naver.me/...' },
] as const;

/** kioskId·naverRating 을 제외한 모든 텍스트 필드 키. */
const ALL_TEXT_KEYS: string[] = [
  'no',
  ...LANGS.flatMap((l) => LANG_FIELDS.map((f) => `${f.base}${l.code}`)),
  ...COMMON_FIELDS.map((f) => f.key),
];

const MAX_IMAGE_COUNT = 10;

type ServerImage = { id: number; url: string };
type NewImage = { url: string; file: File };

type ShopsManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  shop: ShopRow | null;
  /** 생성 시 기본 선택할 키오스크(목록에서 보고 있던 키오스크). */
  defaultKioskId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

function emptyForm(defaultKioskId?: number | null): Record<string, string> {
  const form: Record<string, string> = { kioskId: defaultKioskId != null ? String(defaultKioskId) : '', naverRating: '' };
  ALL_TEXT_KEYS.forEach((k) => {
    form[k] = '';
  });
  return form;
}

function populateForm(raw: Record<string, unknown>, defaultKioskId?: number | null): Record<string, string> {
  const form: Record<string, string> = {
    kioskId: scalarToInputString(raw.kioskId ?? defaultKioskId ?? ''),
    naverRating: scalarToInputString(raw.naverRating),
  };
  ALL_TEXT_KEYS.forEach((k) => {
    form[k] = scalarToInputString(raw[k]);
  });
  return form;
}

type ShopFieldErrors = Record<string, string>;

function validateShopForm(form: Record<string, string>): ShopFieldErrors {
  const e: ShopFieldErrors = {};
  const kioskId = Number(form.kioskId);
  if (!Number.isFinite(kioskId) || kioskId <= 0) e.kioskId = '키오스크(지역)를 선택해 주세요.';
  if (!form.shopNameKr.trim()) e.shopNameKr = '한국어 상점명을 입력해 주세요.';
  const nr = (form.naverRating ?? '').trim();
  if (nr !== '') {
    const n = Number(nr);
    if (!Number.isFinite(n) || n < 0 || n > 9.99) e.naverRating = '0.00 ~ 9.99 사이의 숫자를 입력해 주세요.';
  }
  return e;
}

function buildShopWriteBody(form: Record<string, string>): ShopWriteBody | null {
  const kioskId = Number(form.kioskId);
  if (!Number.isFinite(kioskId) || kioskId <= 0) return null;
  if (!form.shopNameKr.trim()) return null;

  const body: Record<string, unknown> = { kioskId };
  ALL_TEXT_KEYS.forEach((k) => {
    body[k] = (form[k] ?? '').trim();
  });
  const nr = (form.naverRating ?? '').trim();
  if (nr !== '') {
    const n = Number(nr);
    if (Number.isFinite(n)) body.naverRating = n;
  }
  return body as unknown as ShopWriteBody;
}

function readServerImages(raw: Record<string, unknown>): ServerImage[] {
  const imgs = Array.isArray(raw.images) ? raw.images : [];
  return imgs
    .map((img) => {
      if (!img || typeof img !== 'object') return null;
      const o = img as Record<string, unknown>;
      const id = Number(o.id);
      const url = String(o.imageUrl ?? o.url ?? o.image_url ?? '');
      if (!Number.isFinite(id) || !url) return null;
      return { id, url };
    })
    .filter((x): x is ServerImage => x != null);
}

export default function ShopsManageModal({ open, mode, shop, defaultKioskId, onClose, onSuccess }: ShopsManageModalProps) {
  const { data: kiosksData } = useGetKiosks();
  const kiosks = useMemo(() => unwrapList(kiosksData) as SelectOption[], [kiosksData]);
  const { addShopAsync } = useAddShop();
  const { updateShopAsync } = useUpdateShop();
  const { addShopImagesAsync } = useAddShopImages();
  const { deleteShopImageAsync } = useDeleteShopImage();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(defaultKioskId));
  const [serverImages, setServerImages] = useState<ServerImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [fieldErrors, setFieldErrors] = useState<ShopFieldErrors>({});

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && shop) {
      setForm(populateForm(shop.raw, defaultKioskId));
      setServerImages(readServerImages(shop.raw));
    } else {
      setForm(emptyForm(defaultKioskId));
      setServerImages([]);
    }
    setRemovedImageIds([]);
    setNewImages([]);
    setFieldErrors({});
  }, [open, mode, shop, defaultKioskId]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const previewUrls = useMemo(
    () => [...serverImages.map((s) => s.url), ...newImages.map((n) => n.url)],
    [serverImages, newImages],
  );

  if (!open) return null;

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    setNewImages((prev) => [...prev, ...files.map((file) => ({ url: URL.createObjectURL(file), file }))]);
  };

  const handleDeleteImage = (url: string | undefined) => {
    if (!url) return;
    const sv = serverImages.find((s) => s.url === url);
    if (sv) {
      setRemovedImageIds((prev) => (prev.includes(sv.id) ? prev : [...prev, sv.id]));
      setServerImages((prev) => prev.filter((s) => s.url !== url));
      return;
    }
    setNewImages((prev) => {
      const target = prev.find((n) => n.url === url);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((n) => n.url !== url);
    });
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const validation = validateShopForm(form);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    setFieldErrors({});

    const shopData = buildShopWriteBody(form);
    if (!shopData) {
      alert('입력값을 다시 확인해 주세요.');
      return;
    }

    const filesToAdd = newImages.map((n) => n.file);
    setSaving(true);
    try {
      if (mode === 'create') {
        await addShopAsync({ shopData, images: filesToAdd });
      } else if (shop?.id != null) {
        // 1) 텍스트 데이터 갱신 (keepImageIds 미전송 → 기존 이미지 유지)
        await updateShopAsync({ shopId: shop.id, updatedData: shopData });
        // 2) 제거한 기존 이미지를 개별 삭제
        for (const imageId of removedImageIds) {
          await deleteShopImageAsync({ shopId: shop.id, imageId });
        }
        // 3) 새 이미지 추가
        if (filesToAdd.length > 0) {
          await addShopImagesAsync({ shopId: shop.id, images: filesToAdd });
        }
      }
      onSuccess?.();
    } catch {
      alert('저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalContainer>
      <ModalHeader title={mode === 'create' ? '상점 등록' : '상점 수정'} onClose={onClose} />

      <form style={{ display: 'contents' }} onSubmit={handleSubmit}>
        <div className={styles.body}>
          <DropDownField
            label="키오스크(지역)"
            options={kiosks}
            required
            error={fieldErrors.kioskId}
            value={form.kioskId}
            onChange={(e) => setField('kioskId', e.target.value)}
          />

          <InputField
            label="NO (업무 코드)"
            placeholder="예: 인사 뭐먹지=1-코리안바베큐=01"
            value={form.no}
            onChange={(e) => setField('no', e.target.value)}
          />

          {LANGS.map((lang) => (
            <div key={lang.code} style={{ display: 'contents' }}>
              <div className={styles.sectionLabel}>{lang.label}</div>
              {LANG_FIELDS.map((field) => {
                const key = `${field.base}${lang.code}`;
                const required = key === 'shopNameKr';
                if (field.textarea) {
                  return (
                    <TextAreaField
                      key={key}
                      label={`${field.label} (${lang.code})`}
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  );
                }
                return (
                  <InputField
                    key={key}
                    label={`${field.label} (${lang.code})`}
                    required={required}
                    error={fieldErrors[key]}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                );
              })}
            </div>
          ))}

          <div className={styles.sectionLabel}>공통 정보</div>
          {COMMON_FIELDS.map((field) => (
            <InputField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          ))}
          <InputField
            label="네이버 평점 (0.00~9.99)"
            type="number"
            min="0"
            max="9.99"
            step="0.01"
            error={fieldErrors.naverRating}
            placeholder="예: 4.64"
            value={form.naverRating}
            onChange={(e) => setField('naverRating', e.target.value)}
          />

          <ImageUploadField
            label={`상점 이미지 (최대 ${MAX_IMAGE_COUNT}개)`}
            spanFull
            previewUrls={previewUrls}
            onUpload={handleFileChange}
            onDelete={(img) => handleDeleteImage(img)}
            maxCount={MAX_IMAGE_COUNT}
            isEdit
          />
        </div>

        <div>
          <ModalFooter
            onCancel={onClose}
            cancelText="취소"
            onSubmit={handleSubmit}
            submitText={saving ? '처리 중...' : mode === 'create' ? '상점 등록' : '수정 완료'}
          />
        </div>
      </form>
    </ModalContainer>
  );
}
