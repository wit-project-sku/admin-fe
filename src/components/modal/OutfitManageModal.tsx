import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import m from './OutfitManageModal.module.css';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { useGetOutfitById } from '../../hooks/inventory-api/useGetOutfitById';
import { useAddOutfit } from '../../hooks/inventory-api/useAddOutfit';
import { useUpdateOutfit } from '../../hooks/inventory-api/useUpdateOutfit';
import { useGetAllOutfitCategories } from '../../hooks/inventory-api/useGetAllOutfitCategories';
import { useGetDonationSchools } from '../../hooks/donation-api/useDonationSchools';
import type { OutfitType, OutfitWriteBody } from '../../hooks/inventory-api/outfitApiTypes';
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

const OUTFIT_TYPE_OPTIONS: { value: OutfitType; label: string }[] = [
  { value: 'NORMAL', label: '일반 (NORMAL)' },
  { value: 'PREMIUM', label: '프리미엄 (PREMIUM)' },
  { value: 'SCHOOL_UNIFORM', label: '교복 (SCHOOL_UNIFORM)' },
];

const UNIFORM: OutfitType = 'SCHOOL_UNIFORM';

type OutfitFormState = {
  outfitCode: string;
  categoryId: string;
  schoolId: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: OutfitType;
  kioskIds: (string | number)[];
  startDate: string;
  endDate: string;
};

type OutfitFieldErrors = Partial<
  Record<
    'outfitCode' | 'categoryId' | 'schoolId' | 'status' | 'kioskIds' | 'startDate' | 'endDate' | 'image',
    string
  >
>;

function validateOutfitForm(form: OutfitFormState, previewCount: number): OutfitFieldErrors {
  const e: OutfitFieldErrors = {};
  const isUniform = form.type === UNIFORM;

  // 코드: 일반/프리미엄은 필수, 교복은 선택
  if (!isUniform && !form.outfitCode.trim()) e.outfitCode = '의상 코드를 입력해 주세요.';

  // 분류: 교복이면 학교, 그 외는 카테고리
  if (isUniform) {
    const schoolId = Number(form.schoolId);
    if (!Number.isFinite(schoolId) || schoolId <= 0) e.schoolId = '학교를 선택해 주세요.';
  } else {
    const categoryId = Number(form.categoryId);
    if (!Number.isFinite(categoryId) || categoryId <= 0) e.categoryId = '의상 카테고리를 선택해 주세요.';
  }

  if (form.status !== 'ACTIVE' && form.status !== 'INACTIVE') {
    e.status = '상태를 선택해 주세요.';
  }

  const kioskIds = form.kioskIds.map((k) => Number(k)).filter((n) => Number.isFinite(n) && n > 0);
  if (kioskIds.length === 0) e.kioskIds = '설치 키오스크를 1개 이상 선택해 주세요.';

  const start = form.startDate.trim();
  const end = form.endDate.trim();
  if (!start) e.startDate = '운영 시작일을 선택해 주세요.';
  if (start && end && end < start) {
    e.endDate = '운영 종료일은 시작일 이후여야 합니다.';
  }

  if (previewCount <= 0) e.image = '의상 이미지를 등록해 주세요.';

  return e;
}

function buildOutfitWriteBody(form: OutfitFormState): OutfitWriteBody {
  const end = form.endDate.trim();
  const code = form.outfitCode.trim();
  const isUniform = form.type === UNIFORM;

  const body: OutfitWriteBody = {
    status: form.status,
    type: form.type,
    kioskIds: form.kioskIds.map((k) => Number(k)).filter((n) => Number.isFinite(n) && n > 0),
    startDate: form.startDate.trim(),
    endDate: end ? end : null,
  };
  if (code) body.outfitCode = code;
  if (isUniform) body.schoolId = Number(form.schoolId);
  else body.categoryId = Number(form.categoryId);
  return body;
}

type OutfitManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  outfitId: number | string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const EMPTY_FORM: OutfitFormState = {
  outfitCode: '',
  categoryId: '',
  schoolId: '',
  status: 'ACTIVE',
  type: 'NORMAL',
  kioskIds: [],
  startDate: '',
  endDate: '',
};

export default function OutfitManageModal({ open, mode, outfitId, onClose, onSuccess }: OutfitManageModalProps) {
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetAllOutfitCategories();
  const categories = useMemo(() => unwrapList(categoriesData) as SelectOption[], [categoriesData]);
  // 교복 학교 선택용 — 현재 학교(비활성 포함)도 항상 해석되도록 전체 조회
  const { data: schoolsData } = useGetDonationSchools({ pageSize: 500, includeInactive: true });
  const schoolOptions = useMemo<SelectOption[]>(() => {
    const list = schoolsData?.data?.content ?? [];
    return list.map((s) => ({ value: s.id, label: s.active ? s.name : `${s.name} (비활성)` }));
  }, [schoolsData]);
  const { data: kiosksData } = useGetKiosks();
  const kiosks = unwrapList(kiosksData) as MultiSelectItem[];
  const { data: detailData, isLoading: detailLoading } = useGetOutfitById(open && mode === 'edit' ? outfitId : null);
  const { addOutfitAsync } = useAddOutfit();
  const { updateOutfitAsync } = useUpdateOutfit();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<OutfitFormState>(EMPTY_FORM);

  const [image, setImage] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<OutfitFieldErrors>({});

  const isEdit = mode === 'edit';
  const isUniformType = form.type === UNIFORM;

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setForm(EMPTY_FORM);
      setPreviewUrl([]);
      setImage([]);
    }
    setFieldErrors({});
  }, [open, mode, outfitId, isEdit]);

  useEffect(() => {
    if (!open || !isEdit || !detailData || outfitId == null) return;
    const d = unwrapDetailBody(detailData);
    if (d.id != null && String(d.id) !== String(outfitId)) return;

    const rawType = d.type;
    const type: OutfitType =
      rawType === 'PREMIUM' || rawType === 'SCHOOL_UNIFORM' ? rawType : 'NORMAL';
    const schoolId = d.schoolId ?? d.school_id;

    setForm({
      outfitCode: pickOutfitCodeForInput(d),
      categoryId: resolveOutfitCategoryId(d, categories),
      schoolId: schoolId != null ? String(schoolId) : '',
      status: normalizeOutfitStatus(d.status),
      type,
      kioskIds: extractKioskIdsFromDetail(d),
      startDate: pickOperationStartFromDetail(d),
      endDate: pickOperationEndFromDetail(d),
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

  // 유형 변경: 교복 ↔ 일반/프리미엄 경계는 수정에서 막는다(생성에서만 자유 선택).
  // 수정 시 교복이면 교복만, 일반/프리미엄이면 그 둘만 노출한다.
  const typeOptions = useMemo(() => {
    if (!isEdit) return OUTFIT_TYPE_OPTIONS;
    return isUniformType
      ? OUTFIT_TYPE_OPTIONS.filter((o) => o.value === UNIFORM)
      : OUTFIT_TYPE_OPTIONS.filter((o) => o.value !== UNIFORM);
  }, [isEdit, isUniformType]);

  const formDisabled = categoriesLoading || (isEdit && detailLoading);
  const typeSelectDisabled = formDisabled || (isEdit && isUniformType);
  // 교복은 카테고리 로딩 실패와 무관하게 저장 가능
  const needCategories = !isUniformType;
  const submitDisabled =
    formDisabled || saving || (needCategories && (categories.length === 0 || Boolean(categoriesError)));

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as OutfitType;
    clearFieldError('categoryId');
    clearFieldError('schoolId');
    clearFieldError('outfitCode');
    setForm((prev) => ({ ...prev, type: next }));
  };

  if (!open) return null;

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={mode === 'create' ? '신규 의상 등록' : '의상 정보 수정'} onClose={onClose} />

      {isEdit && detailLoading ? (
        <div className={m.loadingState}>의상 정보를 불러오는 중…</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={m.body}>
            {categoriesError && !isUniformType ? (
              <p className={m.inlineError} role='alert'>
                의상 카테고리를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
              </p>
            ) : null}
            <div className={m.mainFields}>
              {/* 1) 의상 유형을 먼저 선택 → 유형에 따라 아래 카테고리/학교가 바뀐다 */}
              <DropDownField
                label='의상 유형'
                required
                options={typeOptions}
                value={String(form.type)}
                disabled={typeSelectDisabled}
                onChange={handleTypeChange}
              />
              {isEdit ? (
                <p className={m.fieldHint}>
                  {isUniformType
                    ? '교복은 유형을 변경할 수 없습니다. 학교만 변경할 수 있어요.'
                    : '일반 ↔ 프리미엄 간에만 변경할 수 있습니다. 교복으로는 전환할 수 없어요.'}
                </p>
              ) : null}

              {/* 2) 유형별 분류: 교복이면 학교, 그 외는 카테고리 */}
              <div className={m.gridRow}>
                {isUniformType ? (
                  <DropDownField
                    label='학교'
                    required
                    error={fieldErrors.schoolId}
                    options={schoolOptions}
                    value={form.schoolId === '' ? '' : String(form.schoolId)}
                    disabled={formDisabled}
                    onChange={(e) => {
                      clearFieldError('schoolId');
                      setForm({ ...form, schoolId: e.target.value });
                    }}
                  />
                ) : (
                  <DropDownField
                    label='의상 카테고리'
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
                )}
                <DropDownField
                  label='상태'
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

              {/* 3) 의상 코드 — 교복은 선택값 */}
              <InputField
                label={isUniformType ? '의상 코드 (선택)' : '의상 코드'}
                required={!isUniformType}
                error={fieldErrors.outfitCode}
                placeholder={isUniformType ? '교복은 비워둘 수 있습니다' : '예: OB-2024-001'}
                value={form.outfitCode}
                disabled={formDisabled}
                onChange={(e) => {
                  clearFieldError('outfitCode');
                  setForm({ ...form, outfitCode: e.target.value });
                }}
              />

              <div className={m.scheduleSection}>
                <span className={m.sectionLabel}>운영 일정</span>
                <div className={m.gridRow}>
                  <InputField
                    label='운영 시작일'
                    required
                    error={fieldErrors.startDate}
                    type='date'
                    value={form.startDate}
                    disabled={formDisabled}
                    onChange={(e) => {
                      clearFieldError('startDate');
                      clearFieldError('endDate');
                      setForm({ ...form, startDate: e.target.value });
                    }}
                  />
                  <InputField
                    label='운영 종료일'
                    error={fieldErrors.endDate}
                    type='date'
                    value={form.endDate}
                    disabled={formDisabled}
                    onChange={(e) => {
                      clearFieldError('endDate');
                      clearFieldError('startDate');
                      setForm({ ...form, endDate: e.target.value });
                    }}
                  />
                </div>
                <p className={m.fieldHint}>
                  운영 시작일은 필수입니다. 종료일은 선택이며, 비우면 무기한으로 저장됩니다. 입력 시 시작일 이후여야
                  합니다.
                </p>
              </div>
              <MultiSelectField
                label='설치 키오스크'
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
              label='의상 이미지 (1장)'
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
