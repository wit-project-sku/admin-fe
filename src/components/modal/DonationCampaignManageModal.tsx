import { useEffect, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import styles from './DonationCampaignManageModal.module.css';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  TextAreaField,
} from './ModalElements';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';
import type { CampaignWriteBody } from '../../hooks/donation-api/donationApiTypes';
import { useCreateDonationCampaign } from '../../hooks/donation-api/useCreateDonationCampaign';
import { useUpdateDonationCampaign } from '../../hooks/donation-api/useUpdateDonationCampaign';
import { CAMPAIGN_STATUS_OPTIONS, CAMPAIGN_TABLE_MESSAGES } from '../../features/donations/donationListConfig';
import { formatKrw } from '../../features/donations/donationFormatters';

type CampaignFormState = {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
};

type FieldErrors = Partial<Record<'name' | 'description' | 'status' | 'amountOptions' | 'image', string>>;

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  campaign: DonationCampaign | null;
  onClose: () => void;
  onSuccess: () => void;
};

function emptyForm(): CampaignFormState {
  return { name: '', description: '', status: 'ACTIVE' };
}

function validateForm(form: CampaignFormState, amounts: number[]): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = '캠페인명을 입력해 주세요.';
  if (!form.description.trim()) errors.description = '설명을 입력해 주세요.';
  if (form.status !== 'ACTIVE' && form.status !== 'INACTIVE') {
    errors.status = '상태를 선택해 주세요.';
  }
  if (amounts.length === 0) errors.amountOptions = '기부 금액 옵션을 1개 이상 추가해 주세요.';
  return errors;
}

function buildWriteBody(form: CampaignFormState, amounts: number[]): CampaignWriteBody {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    amountOptions: [...amounts].sort((a, b) => a - b),
  };
}

export default function DonationCampaignManageModal({ open, mode, campaign, onClose, onSuccess }: Props) {
  const { createCampaignAsync, isPending: isCreating } = useCreateDonationCampaign();
  const { updateCampaignAsync, isPending: isUpdating } = useUpdateDonationCampaign();

  const [form, setForm] = useState<CampaignFormState>(emptyForm);
  const [amounts, setAmounts] = useState<number[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const isEdit = mode === 'edit';
  const isBusy = saving || isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;

    if (isEdit && campaign) {
      setForm({
        name: campaign.name ?? '',
        description: campaign.description ?? '',
        status: campaign.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      setAmounts(Array.isArray(campaign.amountOptions) ? [...campaign.amountOptions] : []);
      setPreviewUrl(campaign.imageUrl ? [campaign.imageUrl] : []);
    } else {
      setForm(emptyForm());
      setAmounts([]);
      setPreviewUrl([]);
    }

    setAmountInput('');
    setImageFile(null);
    setFieldErrors({});
  }, [open, mode, campaign, isEdit]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  const clearError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addAmount = () => {
    const raw = amountInput.replace(/,/g, '').trim();
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      setFieldErrors((prev) => ({ ...prev, amountOptions: '0보다 큰 금액을 입력해 주세요.' }));
      return;
    }
    if (amounts.includes(value)) {
      setAmountInput('');
      return;
    }
    setAmounts((prev) => [...prev, value].sort((a, b) => a - b));
    setAmountInput('');
    clearError('amountOptions');
  };

  const removeAmount = (value: number) => {
    setAmounts((prev) => prev.filter((n) => n !== value));
    clearError('amountOptions');
  };

  const handleAmountKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmount();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl([URL.createObjectURL(file)]);
    clearError('image');
    e.target.value = '';
  };

  const handleDeleteImage = () => {
    setImageFile(null);
    // Edit: omitting `image` in multipart keeps the server thumbnail (API spec).
    if (isEdit && campaign?.imageUrl) {
      setPreviewUrl([campaign.imageUrl]);
      return;
    }
    setPreviewUrl([]);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const validation = validateForm(form, amounts);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const campaignData = buildWriteBody(form, amounts);
      if (isEdit && campaign?.id != null) {
        await updateCampaignAsync({
          campaignId: campaign.id,
          campaignData,
          image: imageFile,
        });
      } else {
        await createCampaignAsync({ campaignData, image: imageFile });
      }
      onSuccess();
    } catch {
      alert(CAMPAIGN_TABLE_MESSAGES.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={isEdit ? '캠페인 수정' : '캠페인 등록'} onClose={onClose} />

      <form style={{ display: 'contents' }} onSubmit={handleSubmit}>
        <div className={styles.body}>
          <InputField
            label='캠페인명'
            required
            error={fieldErrors.name}
            placeholder='예: 지구 지킴이 캠페인'
            value={form.name}
            onChange={(e) => {
              clearError('name');
              setForm({ ...form, name: e.target.value });
            }}
          />

          <TextAreaField
            label='설명'
            required
            error={fieldErrors.description}
            placeholder='캠페인 소개 문구'
            rows={4}
            value={form.description}
            onChange={(e) => {
              clearError('description');
              setForm({ ...form, description: e.target.value });
            }}
          />

          <DropDownField
            label='상태'
            required
            error={fieldErrors.status}
            options={[...CAMPAIGN_STATUS_OPTIONS]}
            value={form.status}
            onChange={(e) => {
              clearError('status');
              setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' });
            }}
          />

          <div className={styles.amountSection}>
            <span className={styles.amountLabel}>
              기부 금액 옵션 <span className={styles.amountRequired}>*</span>
            </span>
            <div className={styles.amountChips}>
              {amounts.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>금액을 추가해 주세요.</span>
              ) : (
                amounts.map((amount) => (
                  <span key={amount} className={styles.amountChip}>
                    {formatKrw(amount)}
                    <button
                      type='button'
                      className={styles.amountChipRemove}
                      onClick={() => removeAmount(amount)}
                      aria-label={`${amount}원 제거`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className={styles.amountAddRow}>
              <input
                type='text'
                inputMode='numeric'
                className={styles.amountInput}
                placeholder='예: 10000'
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onKeyDown={handleAmountKeyDown}
              />
              <button type='button' className={styles.amountAddBtn} onClick={addAmount}>
                금액 추가
              </button>
            </div>
            {fieldErrors.amountOptions ? (
              <span className={styles.fieldError} role='alert'>
                {fieldErrors.amountOptions}
              </span>
            ) : null}
          </div>

          <ImageUploadField
            label='캠페인 썸네일'
            spanFull
            previewUrls={previewUrl}
            onUpload={handleFileChange}
            onDelete={handleDeleteImage}
            isEdit
            maxCount={1}
            error={fieldErrors.image}
          />
          {isEdit ? (
            <p className={styles.imageHint}>새 이미지를 선택하지 않으면 기존 썸네일이 유지됩니다.</p>
          ) : null}
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
