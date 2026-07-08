import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
import { useGetDonationCampaignById } from '../../hooks/donation-api/useGetDonationCampaignById';
import { useCreateDonationCampaign } from '../../hooks/donation-api/useCreateDonationCampaign';
import { useUpdateDonationCampaign } from '../../hooks/donation-api/useUpdateDonationCampaign';
import { useGetDonationOrganizations } from '../../hooks/donation-api/useDonationOrganizations';
import {
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TABLE_MESSAGES,
} from '../../features/donations/donationListConfig';
import {
  buildCampaignWriteBody,
  campaignToFormState,
  CAMPAIGN_EFFECT_COUNT,
  emptyCampaignForm,
  validateCampaignForm,
  type CampaignFieldErrors,
  type CampaignFormState,
} from '../../features/donations/donationCampaignForm';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  campaign: DonationCampaign | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DonationCampaignManageModal({ open, mode, campaign, onClose, onSuccess }: Props) {
  const { createCampaignAsync, isPending: isCreating } = useCreateDonationCampaign();
  const { updateCampaignAsync, isPending: isUpdating } = useUpdateDonationCampaign();

  const isEdit = mode === 'edit';
  const campaignId = isEdit ? campaign?.id : null;

  const { data: detailData, isLoading: isDetailLoading } = useGetDonationCampaignById(campaignId, open && isEdit);

  // 주최 단체 선택지(활성 단체만).
  const { data: organizationsData } = useGetDonationOrganizations({ active: true, pageSize: 200 });
  const organizationOptions = (organizationsData?.data?.content ?? []).map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const [form, setForm] = useState<CampaignFormState>(emptyCampaignForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CampaignFieldErrors>({});
  const [saving, setSaving] = useState(false);

  const isBusy = saving || isCreating || isUpdating;
  const detailCampaign: DonationCampaign | null = detailData?.data ?? null;
  const sourceCampaign = isEdit ? (detailCampaign ?? campaign) : null;

  useEffect(() => {
    if (!open) return;

    if (isEdit && sourceCampaign) {
      setForm(campaignToFormState(sourceCampaign));
      setPreviewUrl(sourceCampaign.imageUrl ? [sourceCampaign.imageUrl] : []);
    } else if (!isEdit) {
      setForm(emptyCampaignForm());
      setPreviewUrl([]);
    }

    setImageFile(null);
    setFieldErrors({});
  }, [open, isEdit, campaignId, detailCampaign, campaign]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  const clearError = (key: keyof CampaignFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateEffect = (index: number, value: string) => {
    setForm((prev) => {
      const effects = [...prev.effects];
      effects[index] = value;
      return { ...prev, effects };
    });
    clearError('effects');
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
    if (isEdit && sourceCampaign?.imageUrl) {
      setPreviewUrl([sourceCampaign.imageUrl]);
      return;
    }
    setPreviewUrl([]);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const validation = validateCampaignForm(form);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const campaignData = buildCampaignWriteBody(form);

      if (isEdit && campaignId != null) {
        await updateCampaignAsync({ campaignId, campaignData, image: imageFile });
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

  const showLoading = isEdit && isDetailLoading && !detailCampaign;

  return (
    <ModalContainer onClose={onClose} modalClassName={styles.wideModal}>
      <ModalHeader title={isEdit ? '캠페인 수정' : '캠페인 등록'} onClose={onClose} />

      {showLoading ? (
        <div className={styles.loadingState}>캠페인 정보를 불러오는 중...</div>
      ) : (
        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.imageBlock}>
              <ImageUploadField
                label='썸네일 이미지'
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

            <div className={styles.basicGrid}>
              <div className={styles.spanFull}>
                <InputField
                  label='제목'
                  required
                  error={fieldErrors.name}
                  placeholder='예: 지구 지킴이 캠페인'
                  value={form.name}
                  onChange={(e) => {
                    clearError('name');
                    setForm({ ...form, name: e.target.value });
                  }}
                />
              </div>

              <div className={styles.spanFull}>
                <TextAreaField
                  label='내용'
                  required
                  error={fieldErrors.description}
                  placeholder='캠페인 소개 문구'
                  rows={3}
                  value={form.description}
                  onChange={(e) => {
                    clearError('description');
                    setForm({ ...form, description: e.target.value });
                  }}
                />
              </div>

              <div className={styles.spanFull}>
                <DropDownField
                  label='주최 단체'
                  options={organizationOptions}
                  value={form.organizationId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, organizationId: v ? Number(v) : null });
                  }}
                />
                <p className={styles.sectionHint}>단체를 지정하지 않으면 미지정 캠페인으로 등록됩니다.</p>
              </div>

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

              <div>
                <InputField
                  label='목표 금액'
                  error={fieldErrors.targetAmount}
                  placeholder='0 = 목표 없음'
                  inputMode='numeric'
                  value={form.targetAmount}
                  onChange={(e) => {
                    clearError('targetAmount');
                    setForm({ ...form, targetAmount: e.target.value });
                  }}
                />
                <p className={styles.sectionHint}>0을 입력하면 목표 금액 없이 등록됩니다.</p>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>
                  기대효과 <span className={styles.required}>*</span>
                </span>
              </div>
              <p className={styles.sectionHint}>상세 화면에 노출되는 기대효과 {CAMPAIGN_EFFECT_COUNT}개를 입력합니다.</p>

              <div className={styles.effectList}>
                {form.effects.map((effect, index) => (
                  <input
                    key={`effect-${index}`}
                    type='text'
                    className={styles.textInput}
                    placeholder={`기대효과 ${index + 1}`}
                    value={effect}
                    onChange={(e) => updateEffect(index, e.target.value)}
                  />
                ))}
              </div>
              {fieldErrors.effects ? (
                <span className={styles.fieldError} role='alert'>
                  {fieldErrors.effects}
                </span>
              ) : null}
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
      )}
    </ModalContainer>
  );
}
