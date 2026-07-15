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
  description: string;
  address: string;
  region: string;
  studentCount: string;
  targetAmount: string;
  amountOptions: number[];
};

type FieldErrors = Partial<
  Record<'name' | 'description' | 'address' | 'region' | 'studentCount' | 'targetAmount' | 'amountOptions', string>
>;

const emptyForm = (): SchoolFormState => ({
  name: '',
  description: '',
  address: '',
  region: '',
  studentCount: '',
  targetAmount: '0',
  amountOptions: [...DEFAULT_SCHOOL_AMOUNT_OPTIONS],
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const isBusy = saving || isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (isEdit && school) {
      setForm({
        name: school.name ?? '',
        description: school.description ?? '',
        address: school.address ?? '',
        region: school.region ?? '',
        studentCount: school.studentCount != null ? String(school.studentCount) : '',
        targetAmount: school.targetAmount != null ? String(school.targetAmount) : '0',
        amountOptions: amountOptionsToNumbers(school.amountOptions),
      });
      setPreviewUrl(school.imageUrl ? [school.imageUrl] : []);
    } else {
      setForm(emptyForm());
      setPreviewUrl([]);
    }
    setAmountInput('');
    setImageFile(null);
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
    if (isEdit && school?.imageUrl) {
      setPreviewUrl([school.imageUrl]);
      return;
    }
    setPreviewUrl([]);
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
        description: form.description.trim(),
        address: form.address.trim(),
        region: form.region,
        studentCount: form.studentCount.trim() ? Number(form.studentCount.trim()) : null,
        targetAmount: form.targetAmount.trim() ? Number(form.targetAmount.trim()) : 0,
        amountOptions: [...form.amountOptions].sort((a, b) => a - b),
      };

      if (isEdit && school) {
        await updateSchoolAsync({ id: school.id, data, image: imageFile });
      } else {
        await createSchoolAsync({ data, image: imageFile });
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
              label='학교 이미지'
              spanFull
              previewUrls={previewUrl}
              onUpload={handleFileChange}
              onDelete={handleDeleteImage}
              isEdit
              maxCount={1}
            />
            <p className={styles.imageHint}>
              {isEdit
                ? '이미지는 선택 사항입니다. 새 이미지를 선택하지 않으면 기존 이미지가 유지됩니다.'
                : '이미지는 선택 사항입니다.'}
            </p>
          </div>

          <div className={styles.basicGrid}>
            <div className={styles.spanFull}>
              <InputField
                label='이름'
                required
                error={errors.name}
                placeholder='예: OO초등학교'
                maxLength={DONATION_NAME_MAX}
                value={form.name}
                onChange={(e) => {
                  clearError('name');
                  setForm({ ...form, name: e.target.value });
                }}
              />
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
