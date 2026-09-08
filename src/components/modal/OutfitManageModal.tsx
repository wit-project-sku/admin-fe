import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import m from './OutfitManageModal.module.css';
import { isTestKiosk, useGetKiosks } from '../../hooks/useGetKiosks';
import { useGetOutfitById } from '../../hooks/inventory-api/useGetOutfitById';
import { useAddOutfit } from '../../hooks/inventory-api/useAddOutfit';
import { useUpdateOutfit } from '../../hooks/inventory-api/useUpdateOutfit';
import { useGetAllOutfitCategories } from '../../hooks/inventory-api/useGetAllOutfitCategories';
import SchoolSearchSelect from '@components/common/SchoolSearchSelect';
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

/** 카테고리 목록 응답 한 건 — 대분류 + 그 안의 세부(남/여 등). 세부가 없으면 빈 배열. */
// 의상 이름 입력 언어. 상점 모달과 같은 순서를 쓴다 — 관리자가 두 화면을 오갈 때 칸 위치가 같아야 한다.
const LABEL_LANGS = [
  { key: 'labelKr', label: '한국어 (KR)' },
  { key: 'labelEn', label: '영어 (EN)' },
  { key: 'labelJp', label: '일본어 (JP)' },
  { key: 'labelCh', label: '중국어 (CH)' },
  { key: 'labelVn', label: '베트남어 (VN)' },
  { key: 'labelId', label: '인도네시아어 (ID)' },
  { key: 'labelTh', label: '태국어 (TH)' },
  { key: 'labelRu', label: '러시아어 (RU)' },
] as const;

type LabelKey = (typeof LABEL_LANGS)[number]['key'];

type OutfitCategoryOption = {
  id: number;
  name?: string;
  labelKr?: string;
  subCategories?: { id: number; labelKr?: string }[];
};

type OutfitFormState = Record<LabelKey, string> & {
  outfitCode: string;
  categoryId: string;
  subCategoryId: string;
  schoolId: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: OutfitType;
  kioskIds: (string | number)[];
  startDate: string;
  endDate: string;
};

type OutfitFieldErrors = Partial<
  Record<
    | 'outfitCode'
    | 'labelKr'
    | 'categoryId'
    | 'subCategoryId'
    | 'schoolId'
    | 'status'
    | 'kioskIds'
    | 'startDate'
    | 'endDate'
    | 'image',
    string
  >
>;

function validateOutfitForm(
  form: OutfitFormState,
  previewCount: number,
  subCategoryRequired: boolean,
): OutfitFieldErrors {
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
    // 세부가 있는 대분류(한복·직업의상·일상의상)는 남/여까지 골라야 키오스크에서 제대로 걸린다.
    else if (subCategoryRequired) {
      const subId = Number(form.subCategoryId);
      if (!Number.isFinite(subId) || subId <= 0) e.subCategoryId = '하위 분류를 선택해 주세요.';
    }
  }

  if (form.status !== 'ACTIVE' && form.status !== 'INACTIVE') {
    e.status = '상태를 선택해 주세요.';
  }

  const kioskIds = form.kioskIds.map((k) => Number(k)).filter((n) => Number.isFinite(n) && n > 0);
  if (kioskIds.length === 0) e.kioskIds = '설치 키오스크를 1개 이상 선택해 주세요.';

  // 운영 일정은 둘 다 선택값이다(비우면 상시 운영). 순서만 검사한다.
  const start = form.startDate.trim();
  const end = form.endDate.trim();
  if (start && end && end < start) {
    e.endDate = '운영 종료일은 시작일 이후여야 합니다.';
  }

  // 한국어 이름은 필수다. 비워 두면 화면에 코드(1.1)만 나가 이용자가 무슨 옷인지 알 수 없다.
  if (!form.labelKr.trim()) e.labelKr = '의상 이름(한국어)을 입력해 주세요.';

  if (previewCount <= 0) e.image = '의상 이미지를 등록해 주세요.';

  return e;
}

function buildOutfitWriteBody(form: OutfitFormState): OutfitWriteBody {
  const end = form.endDate.trim();
  const code = form.outfitCode.trim();
  const isUniform = form.type === UNIFORM;

  const start = form.startDate.trim();
  const body: OutfitWriteBody = {
    status: form.status,
    type: form.type,
    kioskIds: form.kioskIds.map((k) => Number(k)).filter((n) => Number.isFinite(n) && n > 0),
    startDate: start ? start : null,
    endDate: end ? end : null,
  };
  if (code) body.outfitCode = code;
  // 8칸을 항상 함께 보낸다(빈 칸은 빈 문자열). 일부만 보내면 서버가 통째 교체하면서 나머지를 지운다.
  LABEL_LANGS.forEach(({ key }) => {
    body[key] = form[key].trim();
  });
  if (isUniform) {
    body.schoolId = Number(form.schoolId);
  } else {
    body.categoryId = Number(form.categoryId);
    const subId = Number(form.subCategoryId);
    if (Number.isFinite(subId) && subId > 0) body.subCategoryId = subId;
  }
  return body;
}

type OutfitManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  outfitId: number | string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const EMPTY_LABELS = Object.fromEntries(LABEL_LANGS.map(({ key }) => [key, ''])) as Record<
  LabelKey,
  string
>;

const EMPTY_FORM: OutfitFormState = {
  ...EMPTY_LABELS,
  outfitCode: '',
  categoryId: '',
  subCategoryId: '',
  schoolId: '',
  status: 'ACTIVE',
  type: 'NORMAL',
  kioskIds: [],
  startDate: '',
  endDate: '',
};

export default function OutfitManageModal({ open, mode, outfitId, onClose, onSuccess }: OutfitManageModalProps) {
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetAllOutfitCategories();
  const categoryList = useMemo(
    () => unwrapList(categoriesData) as OutfitCategoryOption[],
    [categoriesData],
  );
  // 드롭다운에는 코드(name)가 아니라 한국어 라벨을 보여준다 — 'hanbok' 보다 '한복'이 고르기 쉽다.
  const categories = useMemo<SelectOption[]>(
    () =>
      categoryList.map((c) => ({
        value: c.id,
        label: c.labelKr ?? c.name ?? String(c.id),
        name: c.name,
      })),
    [categoryList],
  );
  const { data: kiosksData } = useGetKiosks();
  // 사내 테스트 단말(#P001~003)은 매장이 아니라 의상을 걸 대상이 아니다.
  const kiosks = useMemo(
    () => (unwrapList(kiosksData) as MultiSelectItem[]).filter((k) => !isTestKiosk(k.name)),
    [kiosksData],
  );
  const { data: detailData, isLoading: detailLoading } = useGetOutfitById(open && mode === 'edit' ? outfitId : null);
  const { addOutfitAsync } = useAddOutfit();
  const { updateOutfitAsync } = useUpdateOutfit();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<OutfitFormState>(EMPTY_FORM);

  const [image, setImage] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [schoolLabel, setSchoolLabel] = useState('');
  const [fieldErrors, setFieldErrors] = useState<OutfitFieldErrors>({});

  const isEdit = mode === 'edit';
  const isUniformType = form.type === UNIFORM;

  const selectedCategory = useMemo(
    () => categoryList.find((c) => String(c.id) === String(form.categoryId)),
    [categoryList, form.categoryId],
  );
  const subCategories = useMemo<SelectOption[]>(
    () =>
      (selectedCategory?.subCategories ?? []).map((sub) => ({
        value: sub.id,
        label: sub.labelKr ?? String(sub.id),
      })),
    [selectedCategory],
  );

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setForm(EMPTY_FORM);
      setPreviewUrl([]);
      setImage([]);
      setSchoolLabel('');
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
    const rawSchoolName = d.schoolName ?? d.school_name;
    setSchoolLabel(typeof rawSchoolName === 'string' ? rawSchoolName : '');

    setForm({
      ...EMPTY_LABELS,
      ...(Object.fromEntries(
        LABEL_LANGS.map(({ key }) => [key, typeof d[key] === 'string' ? (d[key] as string) : '']),
      ) as Record<LabelKey, string>),
      outfitCode: pickOutfitCodeForInput(d),
      categoryId: resolveOutfitCategoryId(d, categories),
      subCategoryId: d.subCategoryId != null ? String(d.subCategoryId) : '',
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
    const validation = validateOutfitForm(form, previewUrl.length, subCategories.length > 0);
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
                  <SchoolSearchSelect
                    value={form.schoolId === '' ? '' : String(form.schoolId)}
                    label={schoolLabel}
                    error={fieldErrors.schoolId}
                    disabled={formDisabled}
                    onSelect={(id, name) => {
                      clearFieldError('schoolId');
                      setForm((prev) => ({ ...prev, schoolId: id }));
                      setSchoolLabel(name);
                    }}
                  />
                ) : (
                  <>
                    <DropDownField
                      label='의상 카테고리'
                      required
                      error={fieldErrors.categoryId}
                      options={categories}
                      value={form.categoryId === '' ? '' : String(form.categoryId)}
                      disabled={formDisabled || categoriesLoading}
                      onChange={(e) => {
                        clearFieldError('categoryId');
                        clearFieldError('subCategoryId');
                        // 대분류가 바뀌면 이전 세부는 남길 수 없다(다른 대분류의 세부는 서버가 거부한다).
                        setForm({ ...form, categoryId: e.target.value, subCategoryId: '' });
                      }}
                    />
                    {subCategories.length > 0 ? (
                      <DropDownField
                        label='하위 분류'
                        required
                        error={fieldErrors.subCategoryId}
                        options={subCategories}
                        value={form.subCategoryId === '' ? '' : String(form.subCategoryId)}
                        disabled={formDisabled}
                        onChange={(e) => {
                          clearFieldError('subCategoryId');
                          setForm({ ...form, subCategoryId: e.target.value });
                        }}
                      />
                    ) : null}
                  </>
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
                // 서버 제약: 의상 코드는 최대 10자(@Size max=10). 초과 입력을 막아 저장 실패(400)를 예방.
                maxLength={10}
                placeholder={isUniformType ? '교복은 비워둘 수 있습니다' : '예: OB-2024-1 (최대 10자)'}
                value={form.outfitCode}
                disabled={formDisabled}
                onChange={(e) => {
                  clearFieldError('outfitCode');
                  setForm({ ...form, outfitCode: e.target.value });
                }}
              />

              {/* 4) 의상 이름 — 화면에 나가는 실제 옷 이름. 코드(1.1)는 식별자라 이용자에게 뜻이 없다. */}
              <div className={m.scheduleSection}>
                <span className={m.sectionLabel}>의상 이름 (다국어)</span>
                <p className={m.fieldHint}>
                  키오스크 화면에 표시되는 옷 이름입니다. 한국어는 필수이고, 비워 둔 언어는 화면에서 한국어로 대체됩니다.
                </p>
                <div className={m.gridRow}>
                  {LABEL_LANGS.map(({ key, label }) => (
                    <InputField
                      key={key}
                      label={label}
                      required={key === 'labelKr'}
                      error={key === 'labelKr' ? fieldErrors.labelKr : undefined}
                      maxLength={key === 'labelKr' ? 60 : 80}
                      placeholder={key === 'labelKr' ? '예: 조각보 한복' : ''}
                      value={form[key]}
                      disabled={formDisabled}
                      onChange={(e) => {
                        if (key === 'labelKr') clearFieldError('labelKr');
                        setForm({ ...form, [key]: e.target.value });
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className={m.scheduleSection}>
                <span className={m.sectionLabel}>운영 일정</span>
                <div className={m.gridRow}>
                  <InputField
                    label='운영 시작일 (선택)'
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
                    label='운영 종료일 (선택)'
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
                  둘 다 선택값입니다. <b>비워 두면 상시 운영</b>(시작=즉시, 종료=무기한)으로 저장됩니다. 종료일을 넣을
                  때는 시작일 이후여야 합니다.
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
                selectAllable
              />
              <p className={m.fieldHint}>
                노출할 키오스크를 최소 1개 이상 선택해야 합니다. 사내 테스트 단말(#P001~003)은 목록에 나오지 않습니다.
              </p>
            </div>
            <ImageUploadField
              label='의상 이미지 (1장)'
              required
              error={fieldErrors.image}
              previewUrls={previewUrl}
              onUpload={handleFileChange}
              onDelete={handleDeleteImage}
              // 이미지 업로드는 카테고리 로딩과 무관하게 활성화(교복은 카테고리 불필요).
              // 수정 시 상세 로딩 중에만 잠근다.
              isEdit={!(isEdit && detailLoading)}
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
