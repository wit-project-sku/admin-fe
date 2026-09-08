import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './DonationSchoolManageModal.module.css';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  TextAreaField,
} from './ModalElements';
import {
  useCreateDonationSchool,
  useGetDonationSchoolRegions,
  useUpdateDonationSchool,
  type DonationSchool,
  type SchoolWriteBody,
} from '../../hooks/donation-api/useDonationSchools';
import { SCHOOL_TABLE_MESSAGES } from '../../features/donations/donationListConfig';
import { DONATION_DESCRIPTION_MAX, DONATION_NAME_MAX } from '../../features/donations/donationContentLimits';
import { amountOptionsToNumbers, formatKrw } from '../../features/donations/donationFormatters';

/** 신규 등록 시 기본 제공 금액 프리셋. */
const DEFAULT_SCHOOL_AMOUNT_OPTIONS = [1000, 5000, 10000, 30000, 50000];
const MAX_AMOUNT_OPTIONS = 8;

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  school: DonationSchool | null;
  onClose: () => void;
  onSuccess: () => void;
};

type SchoolFormState = {
  name: string;
  officialName: string;
  description: string;
  address: string;
  region: string;
  studentCount: string;
  foundingYear: string;
  targetAmount: string;
  amountOptions: number[];
  active: boolean;
};

type FieldErrors = Partial<
  Record<
    'name' | 'description' | 'address' | 'region' | 'studentCount' | 'foundingYear' | 'targetAmount' | 'amountOptions',
    string
  >
>;

const emptyForm = (): SchoolFormState => ({
  name: '',
  officialName: '',
  description: '',
  address: '',
  region: '',
  studentCount: '',
  foundingYear: '',
  targetAmount: '0',
  amountOptions: [...DEFAULT_SCHOOL_AMOUNT_OPTIONS],
  active: true,
});

export default function DonationSchoolManageModal({ open, mode, school, onClose, onSuccess }: Props) {
  const isEdit = mode === 'edit';
  const { createSchoolAsync, isPending: isCreating } = useCreateDonationSchool();
  const { updateSchoolAsync, isPending: isUpdating } = useUpdateDonationSchool();
  const { data: regionsData } = useGetDonationSchoolRegions();

  const regionOptions = (regionsData?.data ?? []).map((r) => ({ value: r.code, label: r.label }));

  const [form, setForm] = useState<SchoolFormState>(emptyForm);
  const [amountInput, setAmountInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const isBusy = saving || isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (isEdit && school) {
      setForm({
        name: school.name ?? '',
        officialName: school.officialName ?? '',
        description: school.description ?? '',
        address: school.address ?? '',
        region: school.region ?? '',
        studentCount: school.studentCount != null ? String(school.studentCount) : '',
        foundingYear: school.foundingYear != null ? String(school.foundingYear) : '',
        targetAmount: school.targetAmount != null ? String(school.targetAmount) : '0',
        amountOptions: amountOptionsToNumbers(school.amountOptions),
        active: school.active ?? true,
      });
      setPreviewUrl(school.logoImageUrl ? [school.logoImageUrl] : []);
      setThumbnailPreview(school.thumbnailUrl ? [school.thumbnailUrl] : []);
    } else {
      setForm(emptyForm());
      setPreviewUrl([]);
      setThumbnailPreview([]);
    }
    setAmountInput('');
    setImageFile(null);
    setThumbnailFile(null);
    setErrors({});
  }, [open, isEdit, school]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  const clearError = (key: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl([URL.createObjectURL(file)]);
    e.target.value = '';
  };

  const handleDeleteImage = () => {
    setImageFile(null);
    if (isEdit && school?.logoImageUrl) {
      setPreviewUrl([school.logoImageUrl]);
      return;
    }
    setPreviewUrl([]);
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview([URL.createObjectURL(file)]);
    e.target.value = '';
  };

  const handleDeleteThumbnail = () => {
    setThumbnailFile(null);
    if (isEdit && school?.thumbnailUrl) {
      setThumbnailPreview([school.thumbnailUrl]);
      return;
    }
    setThumbnailPreview([]);
  };

  const addAmountOption = () => {
    const value = Number(amountInput.trim());
    if (!Number.isInteger(value) || value <= 0) {
      setErrors((prev) => ({ ...prev, amountOptions: '1 이상의 정수를 입력해 주세요.' }));
      return;
    }
    if (form.amountOptions.includes(value)) {
      setErrors((prev) => ({ ...prev, amountOptions: '이미 추가된 금액입니다.' }));
      return;
    }
    if (form.amountOptions.length >= MAX_AMOUNT_OPTIONS) {
      setErrors((prev) => ({ ...prev, amountOptions: `금액 옵션은 최대 ${MAX_AMOUNT_OPTIONS}개까지 등록할 수 있습니다.` }));
      return;
    }
    clearError('amountOptions');
    setForm((prev) => ({ ...prev, amountOptions: [...prev.amountOptions, value].sort((a, b) => a - b) }));
    setAmountInput('');
  };

  const removeAmountOption = (value: number) => {
    clearError('amountOptions');
    setForm((prev) => ({ ...prev, amountOptions: prev.amountOptions.filter((v) => v !== value) }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = '학교명을 입력해 주세요.';
    else if (form.name.length > DONATION_NAME_MAX) next.name = `학교명은 ${DONATION_NAME_MAX}자 이하로 입력해 주세요.`;
    if (!form.description.trim()) next.description = '설명을 입력해 주세요.';
    else if (form.description.length > DONATION_DESCRIPTION_MAX)
      next.description = `설명은 ${DONATION_DESCRIPTION_MAX}자 이하로 입력해 주세요.`;
    if (!form.address.trim()) next.address = '주소를 입력해 주세요.';
    if (!form.region.trim()) next.region = '지역을 선택해 주세요.';
    const sc = form.studentCount.trim();
    if (sc && !/^\d+$/.test(sc)) next.studentCount = '수혜자 수는 0 이상의 숫자로 입력해 주세요.';
    const fy = form.foundingYear.trim();
    if (fy && !/^\d{4}$/.test(fy)) next.foundingYear = '개교년도는 4자리 연도로 입력해 주세요. (예: 1955)';
    const ta = form.targetAmount.trim();
    if (ta && !/^\d+$/.test(ta)) next.targetAmount = '목표 금액은 0 이상의 숫자로 입력해 주세요. (0 = 목표 없음)';
    if (form.amountOptions.length === 0) next.amountOptions = '금액 옵션을 1개 이상 등록해 주세요.';
    return next;
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const data: SchoolWriteBody = {
        name: form.name.trim(),
        officialName: form.officialName.trim() || null,
        description: form.description.trim(),
        address: form.address.trim(),
        region: form.region,
        studentCount: form.studentCount.trim() ? Number(form.studentCount.trim()) : null,
        foundingYear: form.foundingYear.trim() ? Number(form.foundingYear.trim()) : null,
        targetAmount: form.targetAmount.trim() ? Number(form.targetAmount.trim()) : 0,
        amountOptions: [...form.amountOptions].sort((a, b) => a - b),
        // 상태는 수정 시에만 전송(등록은 항상 활성). null 미전송 시 서버가 기존 상태 유지.
        active: isEdit ? form.active : undefined,
      };

      if (isEdit && school) {
        await updateSchoolAsync({ id: school.id, data, image: imageFile, thumbnail: thumbnailFile });
      } else {
        await createSchoolAsync({ data, image: imageFile, thumbnail: thumbnailFile });
      }
      onSuccess();
    } catch {
      alert(SCHOOL_TABLE_MESSAGES.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalContainer onClose={onClose} modalClassName={styles.wideModal}>
      <ModalHeader title={isEdit ? '학교 수정' : '학교 등록'} onClose={onClose} />

      <form className={styles.formShell} onSubmit={handleSubmit}>
        <div className={styles.body}>
          <div className={styles.imageBlock}>
            <ImageUploadField
              label='로고'
              spanFull
              previewUrls={previewUrl}
              onUpload={handleFileChange}
              onDelete={handleDeleteImage}
              isEdit
              maxCount={1}
            />
            <p className={styles.imageHint}>학교 상징 로고입니다. 선택 사항이며, 수정 시 새로 올리지 않으면 기존 로고가 유지됩니다.</p>
          </div>

          <div className={styles.imageBlock}>
            <ImageUploadField
              label='썸네일'
              spanFull
              previewUrls={thumbnailPreview}
              onUpload={handleThumbnailChange}
              onDelete={handleDeleteThumbnail}
              isEdit
              maxCount={1}
            />
            <p className={styles.imageHint}>목록·카드에 노출되는 대표 이미지입니다. 선택 사항이며, 수정 시 새로 올리지 않으면 기존 썸네일이 유지됩니다.</p>
          </div>

          <div className={styles.basicGrid}>
            <div className={styles.spanFull}>
              <InputField
                label='이름(표시명)'
                required
                error={errors.name}
                placeholder='예: 이대부고 (최대 10자, 필요 시 축약)'
                maxLength={DONATION_NAME_MAX}
                value={form.name}
                onChange={(e) => {
                  clearError('name');
                  setForm({ ...form, name: e.target.value });
                }}
              />
            </div>

            <div className={styles.spanFull}>
              <InputField
                label='정식 명칭'
                placeholder='예: 이화여자대학교 부속고등학교 (선택)'
                value={form.officialName}
                onChange={(e) => setForm({ ...form, officialName: e.target.value })}
              />
              <p className={styles.imageHint} style={{ marginTop: 4 }}>
                표시명은 최대 10자로 짧게, 정식 명칭에는 전체 교명을 입력합니다.
              </p>
            </div>

            <div className={styles.spanFull}>
              <TextAreaField
                label='설명'
                required
                error={errors.description}
                placeholder='학교 소개 문구'
                rows={3}
                maxLength={DONATION_DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => {
                  clearError('description');
                  setForm({ ...form, description: e.target.value });
                }}
              />
            </div>

            <div className={styles.spanFull}>
              <InputField
                label='주소'
                required
                error={errors.address}
                placeholder='예: 서울특별시 강남구 ...'
                value={form.address}
                onChange={(e) => {
                  clearError('address');
                  setForm({ ...form, address: e.target.value });
                }}
              />
            </div>

            <div className={styles.spanFull}>
              <DropDownField
                label='지역'
                required
                error={errors.region}
                options={regionOptions}
                value={form.region}
                onChange={(e) => {
                  clearError('region');
                  setForm({ ...form, region: e.target.value });
                }}
              />
            </div>

            {isEdit ? (
              <div className={styles.spanFull}>
                <DropDownField
                  label='상태'
                  options={[
                    { value: 'ACTIVE', label: '활성' },
                    { value: 'INACTIVE', label: '비활성' },
                  ]}
                  value={form.active ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setForm({ ...form, active: e.target.value === 'ACTIVE' })}
                />
                <p className={styles.imageHint} style={{ marginTop: 4 }}>
                  비활성 학교는 키오스크에 노출되지 않습니다. 목록에서는 계속 관리할 수 있습니다.
                </p>
              </div>
            ) : null}

            <div className={styles.spanFull}>
              <InputField
                label='수혜자 수(재학생 수)'
                type='number'
                min={0}
                error={errors.studentCount}
                placeholder='예: 540'
                value={form.studentCount}
                onChange={(e) => {
                  clearError('studentCount');
                  setForm({ ...form, studentCount: e.target.value });
                }}
              />
            </div>

            <div className={styles.spanFull}>
              <InputField
                label='개교년도'
                type='number'
                error={errors.foundingYear}
                placeholder='예: 1955'
                value={form.foundingYear}
                onChange={(e) => {
                  clearError('foundingYear');
                  setForm({ ...form, foundingYear: e.target.value });
                }}
              />
            </div>

            <div className={styles.spanFull}>
              <InputField
                label='목표 기부액'
                type='number'
                min={0}
                error={errors.targetAmount}
                placeholder='0 = 목표 없음'
                value={form.targetAmount}
                onChange={(e) => {
                  clearError('targetAmount');
                  setForm({ ...form, targetAmount: e.target.value });
                }}
              />
              <p className={styles.imageHint} style={{ marginTop: 4 }}>0을 입력하면 목표 금액 없이 등록됩니다.</p>
            </div>

            <div className={styles.spanFull}>
              <label className={styles.amountLabel}>
                기부 금액 옵션 <span className={styles.required}>*</span>
              </label>
              <div className={styles.amountInputRow}>
                <input
                  className={styles.amountInput}
                  type='number'
                  min={1}
                  placeholder='예: 10000'
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAmountOption();
                    }
                  }}
                />
                <button type='button' className={styles.amountAddBtn} onClick={addAmountOption}>
                  추가
                </button>
              </div>
              {form.amountOptions.length > 0 ? (
                <div className={styles.chipRow}>
                  {form.amountOptions.map((amount) => (
                    <span key={amount} className={styles.chip}>
                      {formatKrw(amount)}
                      <button
                        type='button'
                        className={styles.chipRemove}
                        aria-label={`${formatKrw(amount)} 삭제`}
                        onClick={() => removeAmountOption(amount)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              {errors.amountOptions ? <p className={styles.amountError}>{errors.amountOptions}</p> : null}
              <p className={styles.imageHint} style={{ marginTop: 6 }}>
                키오스크 기부 화면에 노출될 금액 버튼입니다. 오름차순으로 자동 정렬됩니다.
              </p>
            </div>
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelText='취소'
          submitText={isEdit ? '수정하기' : '등록하기'}
          isLoading={isBusy}
        />
      </form>
    </ModalContainer>
  );
}
