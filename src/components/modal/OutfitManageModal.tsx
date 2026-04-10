import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import m from './OutfitManageModal.module.css';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { useGetOutfitById } from '../../hooks/inventory-api/useGetOutfitById';
import { useAddOutfit } from '../../hooks/inventory-api/useAddOutfit';
import { useUpdateOutfit } from '../../hooks/inventory-api/useUpdateOutfit';
import { useGetAllOutfitCategories } from '../../hooks/inventory-api/useGetAllOutfitCategories';
import type { OutfitWriteBody } from '../../hooks/inventory-api/outfitApiTypes';
import {
  extractKioskIdsFromDetail,
  normalizeOutfitStatus,
  pickOutfitCodeForInput,
  resolveOutfitCategoryId,
  unwrapDetailBody,
} from '../../utils/modalFormMapping';
import { pickOperationEndFromDetail, pickOperationStartFromDetail } from '../../utils/outfitScheduleUtils';
import { unwrapList } from '../../utils/unwrapApi';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  MultiSelectField,
  type MultiSelectItem,
  type SelectOption,
} from './ModalElements';

const OUTFIT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '활성화' },
  { value: 'INACTIVE', label: '비활성화' },
];

type OutfitFormState = {
  outfitCode: string;
  categoryId: string;
  status: 'ACTIVE' | 'INACTIVE';
  kioskIds: (string | number)[];
  operationStartDate: string;
  operationEndDate: string;
};

type OutfitFieldErrors = Partial<
  Record<
    | 'outfitCode'
    | 'categoryId'
    | 'status'
    | 'kioskIds'
    | 'operationStartDate'
    | 'operationEndDate'
    | 'image',
    string
  >
>;

function validateOutfitForm(form: OutfitFormState, previewCount: number): OutfitFieldErrors {
  const e: OutfitFieldErrors = {};
  if (!form.outfitCode.trim()) e.outfitCode = '의상 코드를 입력해 주세요.';

  const categoryId = Number(form.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    e.categoryId = '의상 카테고리를 선택해 주세요.';
  }

  if (form.status !== 'ACTIVE' && form.status !== 'INACTIVE') {
    e.status = '상태를 선택해 주세요.';
  }

  const kioskIds = form.kioskIds.map((k) => Number(k)).filter((n) => Number.isFinite(n) && n > 0);
  if (kioskIds.length === 0) e.kioskIds = '설치 키오스크를 1개 이상 선택해 주세요.';

  const start = form.operationStartDate.trim();
  const end = form.operationEndDate.trim();
  if (!start) e.operationStartDate = '운영 시작일을 선택해 주세요.';
  if (!end) e.operationEndDate = '운영 종료일을 선택해 주세요.';
  if (start && end && end < start) {
    e.operationEndDate = '운영 종료일은 시작일 이후여야 합니다.';
  }

  if (previewCount <= 0) e.image = '의상 이미지를 등록해 주세요.';

  return e;
}

function buildOutfitWriteBody(form: OutfitFormState): OutfitWriteBody {
  return {
    outfitCode: form.outfitCode.trim(),
    status: form.status,
    categoryId: Number(form.categoryId),
    kioskIds: form.kioskIds.map((k) => Number(k)).filter((n) => Number.isFinite(n) && n > 0),
    operationStartDate: form.operationStartDate.trim(),
    operationEndDate: form.operationEndDate.trim(),
  };
}

type OutfitManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  outfitId: number | string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function OutfitManageModal({ open, mode, outfitId, onClose, onSuccess }: OutfitManageModalProps) {
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetAllOutfitCategories();
  const categories = useMemo(() => unwrapList(categoriesData) as SelectOption[], [categoriesData]);
  const { data: kiosksData } = useGetKiosks();
  const kiosks = unwrapList(kiosksData) as MultiSelectItem[];
  const { data: detailData, isLoading: detailLoading } = useGetOutfitById(open && mode === 'edit' ? outfitId : null);
  const { addOutfitAsync } = useAddOutfit();
  const { updateOutfitAsync } = useUpdateOutfit();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<OutfitFormState>({
    outfitCode: '',
    categoryId: '',
    status: 'ACTIVE',
    kioskIds: [],
    operationStartDate: '',
    operationEndDate: '',
  });

  const [image, setImage] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<OutfitFieldErrors>({});

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setForm({
        outfitCode: '',
        categoryId: '',
        status: 'ACTIVE',
        kioskIds: [],
        operationStartDate: '',
        operationEndDate: '',
      });
      setPreviewUrl([]);
      setImage([]);
    }
    setFieldErrors({});
  }, [open, mode, outfitId, isEdit]);

  useEffect(() => {
    if (!open || !isEdit || !detailData || outfitId == null) return;
    const d = unwrapDetailBody(detailData);
    if (d.id != null && String(d.id) !== String(outfitId)) return;

    setForm({
      outfitCode: pickOutfitCodeForInput(d),
      categoryId: resolveOutfitCategoryId(d, categories),
      status: normalizeOutfitStatus(d.status),
      kioskIds: extractKioskIdsFromDetail(d),
      operationStartDate: pickOperationStartFromDetail(d),
      operationEndDate: pickOperationEndFromDetail(d),
    });

    const imgs = Array.isArray(d.images) ? d.images : [];
    const urlsFromImages = imgs
      .map((img) => {
        if (!img || typeof img !== 'object') return '';
        const o = img as Record<string, unknown>;
        return String(o.imageUrl ?? o.url ?? o.image_url ?? '');
      })
      .filter(Boolean);

    const topUrl = d.imageUrl ?? d.image_url ?? d.thumbnailUrl ?? d.thumbnail_url;
    const fallback =
      typeof topUrl === 'string' && topUrl.trim()
        ? [topUrl.trim()]
        : Array.isArray(d.imageUrls)
          ? (d.imageUrls as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim() !== '')
          : [];

    setPreviewUrl(urlsFromImages.length > 0 ? urlsFromImages : fallback);
    setImage([]);
  }, [open, isEdit, detailData, outfitId, categories]);

  const clearFieldError = (key: keyof OutfitFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage([file]);
      setPreviewUrl([URL.createObjectURL(file)]);
      clearFieldError('image');
    }
  };

  const handleDeleteImage = () => {
    setImage([]);
    setPreviewUrl([]);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const validation = validateOutfitForm(form, previewUrl.length);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    setFieldErrors({});

    const outfitData = buildOutfitWriteBody(form);

    setSaving(true);
    try {
      if (mode === 'create') {
        await addOutfitAsync({ outfitData, images: image });
      } else if (outfitId != null) {
        await updateOutfitAsync({ outfitId, outfitData, images: image });
      }
      onSuccess?.();
    } catch {
      alert('저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const formDisabled = categoriesLoading || (isEdit && detailLoading);
  const submitDisabled = formDisabled || saving || categories.length === 0 || Boolean(categoriesError);

  if (!open) return null;

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={mode === 'create' ? '신규 의상 등록' : '의상 정보 수정'} onClose={onClose} />

      {isEdit && detailLoading ? (
        <div className={m.loadingState}>의상 정보를 불러오는 중…</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={m.body}>
            {categoriesError ? (
              <p className={m.inlineError} role="alert">
                의상 카테고리를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
              </p>
            ) : null}
            <div className={m.mainFields}>
              <InputField
                label="의상 코드"
                required
                error={fieldErrors.outfitCode}
                placeholder="예: OB-2024-001"
                value={form.outfitCode}
                disabled={formDisabled}
                onChange={(e) => {
                  clearFieldError('outfitCode');
                  setForm({ ...form, outfitCode: e.target.value });
                }}
              />
              <div className={m.gridRow}>
                <DropDownField
                  label="의상 카테고리"
                  required
                  error={fieldErrors.categoryId}
                  options={categories}
                  value={form.categoryId === '' ? '' : String(form.categoryId)}
                  disabled={formDisabled || categoriesLoading}
                  onChange={(e) => {
                    clearFieldError('categoryId');
                    setForm({ ...form, categoryId: e.target.value });
                  }}
                />
                <DropDownField
                  label="상태"
                  required
                  error={fieldErrors.status}
                  options={OUTFIT_STATUS_OPTIONS}
                  value={String(form.status)}
                  disabled={formDisabled}
                  onChange={(e) => {
                    clearFieldError('status');
                    setForm({
                      ...form,
                      status: e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    });
                  }}
                />
              </div>
              <div className={m.scheduleSection}>
                <span className={m.sectionLabel}>운영 일정</span>
                <div className={m.gridRow}>
                  <InputField
                    label="운영 시작일"
                    required
                    error={fieldErrors.operationStartDate}
                    type="date"
                    value={form.operationStartDate}
                    disabled={formDisabled}
                    onChange={(e) => {
                      clearFieldError('operationStartDate');
                      clearFieldError('operationEndDate');
                      setForm({ ...form, operationStartDate: e.target.value });
                    }}
                  />
                  <InputField
                    label="운영 종료일"
                    required
                    error={fieldErrors.operationEndDate}
                    type="date"
                    value={form.operationEndDate}
                    disabled={formDisabled}
                    onChange={(e) => {
                      clearFieldError('operationEndDate');
                      clearFieldError('operationStartDate');
                      setForm({ ...form, operationEndDate: e.target.value });
                    }}
                  />
                </div>
                <p className={m.fieldHint}>시작일과 종료일을 모두 선택해 주세요. 종료일은 시작일 이후여야 합니다.</p>
              </div>
              <MultiSelectField
                label="설치 키오스크"
                required
                error={fieldErrors.kioskIds}
                items={kiosks}
                selectedIds={form.kioskIds}
                onChange={(newIds) => {
                  clearFieldError('kioskIds');
                  setForm({ ...form, kioskIds: newIds });
                }}
                isEdit={!formDisabled}
              />
              <p className={m.fieldHint}>노출할 키오스크를 최소 1개 이상 선택해야 합니다.</p>
            </div>
            <ImageUploadField
              label="의상 이미지 (1장)"
              required
              error={fieldErrors.image}
              previewUrls={previewUrl}
              onUpload={handleFileChange}
              onDelete={handleDeleteImage}
              isEdit={!formDisabled}
              maxCount={1}
            />
          </div>
          <ModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            isLoading={saving}
            submitDisabled={submitDisabled}
            submitText={mode === 'create' ? '등록' : '수정 완료'}
          />
        </form>
      )}
    </ModalContainer>
  );
}
