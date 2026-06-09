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
import { useGetDonationCampaignById } from '../../hooks/donation-api/useGetDonationCampaignById';
import { useCreateDonationCampaign } from '../../hooks/donation-api/useCreateDonationCampaign';
import { useUpdateDonationCampaign } from '../../hooks/donation-api/useUpdateDonationCampaign';
import { CAMPAIGN_STATUS_OPTIONS, CAMPAIGN_TABLE_MESSAGES } from '../../features/donations/donationListConfig';
import {
  buildCampaignMultipartFiles,
  buildCampaignWriteBody,
  campaignToFormLists,
  campaignToFormState,
  emptyCampaignForm,
  emptyCampaignLists,
  emptyProgram,
  emptySection,
  emptyTitleRun,
  MAX_CAMPAIGN_PROGRAMS,
  validateCampaignForm,
  type AmountOptionForm,
  type CampaignFieldErrors,
  type CampaignFormLists,
  type CampaignFormState,
  type ProgramForm,
  type SectionForm,
  type TitleRunForm,
} from '../../features/donations/donationCampaignForm';
import { formatKrw } from '../../features/donations/donationFormatters';

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

  const [form, setForm] = useState<CampaignFormState>(emptyCampaignForm);
  const [lists, setLists] = useState<CampaignFormLists>(emptyCampaignLists);
  const [amountDraft, setAmountDraft] = useState<AmountOptionForm>({ label: '', amount: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CampaignFieldErrors>({});
  const [saving, setSaving] = useState(false);

  const isBusy = saving || isCreating || isUpdating;
  const sourceCampaign = isEdit ? (detailData?.data ?? campaign) : null;

  useEffect(() => {
    if (!open) return;

    if (isEdit && sourceCampaign) {
      setForm(campaignToFormState(sourceCampaign));
      setLists(campaignToFormLists(sourceCampaign));
      setPreviewUrl(sourceCampaign.imageUrl ? [sourceCampaign.imageUrl] : []);
    } else if (!isEdit) {
      setForm(emptyCampaignForm());
      setLists({ ...emptyCampaignLists(), programs: [emptyProgram()] });
      setPreviewUrl([]);
    }

    setAmountDraft({ label: '', amount: '' });
    setImageFile(null);
    setFieldErrors({});
  }, [open, isEdit, campaignId, detailData?.data, campaign]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
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

  const addAmountOption = () => {
    const amount = Number(amountDraft.amount.replace(/,/g, '').trim());
    if (!amountDraft.label.trim()) {
      setFieldErrors((prev) => ({ ...prev, amountOptions: '금액 옵션 라벨을 입력해 주세요.' }));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldErrors((prev) => ({ ...prev, amountOptions: '0보다 큰 금액을 입력해 주세요.' }));
      return;
    }

    const duplicate = lists.amountOptions.some(
      (opt) => opt.label.trim() === amountDraft.label.trim() && Number(opt.amount) === amount,
    );
    if (duplicate) {
      setAmountDraft({ label: '', amount: '' });
      return;
    }

    setLists((prev) => ({
      ...prev,
      amountOptions: [...prev.amountOptions, { label: amountDraft.label.trim(), amount: String(amount) }].sort(
        (a, b) => Number(a.amount) - Number(b.amount),
      ),
    }));
    setAmountDraft({ label: '', amount: '' });
    clearError('amountOptions');
  };

  const removeAmountOption = (index: number) => {
    setLists((prev) => ({
      ...prev,
      amountOptions: prev.amountOptions.filter((_, i) => i !== index),
    }));
    clearError('amountOptions');
  };

  const handleAmountKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmountOption();
    }
  };

  const updatePrograms = (next: ProgramForm[]) => {
    setLists((prev) => ({ ...prev, programs: next }));
    clearError('programs');
  };

  const updateSections = (next: SectionForm[]) => {
    setLists((prev) => ({ ...prev, sections: next }));
    clearError('sections');
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
    const validation = validateCampaignForm(form, lists, { isEdit });
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const campaignData = buildCampaignWriteBody(form, lists);
      const sectionImages = buildCampaignMultipartFiles(lists);
      const files = { image: imageFile, sectionImages };

      if (isEdit && campaignId != null) {
        await updateCampaignAsync({
          campaignId,
          campaignData,
          ...files,
        });
      } else {
        await createCampaignAsync({ campaignData, ...files });
      }
      onSuccess();
    } catch {
      alert(CAMPAIGN_TABLE_MESSAGES.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const showLoading = isEdit && isDetailLoading && !detailData?.data;

  return (
    <ModalContainer onClose={onClose} modalClassName={styles.wideModal}>
      <ModalHeader title={isEdit ? '캠페인 수정' : '캠페인 등록'} onClose={onClose} />

      {showLoading ? (
        <div className={styles.loadingState}>캠페인 정보를 불러오는 중...</div>
      ) : (
        <form className={styles.formShell} onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.basicGrid}>
              <div className={styles.spanFull}>
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
              </div>

              <div className={styles.spanFull}>
                <TextAreaField
                  label='설명'
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

            <div className={`${styles.sectionBlock} ${styles.sectionBlockFlush}`}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>
                  기부 금액 옵션 <span className={styles.required}>*</span>
                </span>
              </div>
              <p className={styles.sectionHint}>기부자가 선택할 금액과 도움 내용 라벨을 함께 등록합니다.</p>

              <div className={styles.optionList}>
                {lists.amountOptions.length === 0 ? (
                  <span className={styles.emptyText}>금액 옵션을 추가해 주세요.</span>
                ) : (
                  lists.amountOptions.map((opt, index) => (
                    <div key={`${opt.label}-${opt.amount}-${index}`} className={styles.optionItem}>
                      <span className={styles.optionItemText}>
                        {opt.label} · {formatKrw(Number(opt.amount))}
                      </span>
                      <button
                        type='button'
                        className={styles.removeBtn}
                        onClick={() => removeAmountOption(index)}
                        aria-label={`${opt.label} 제거`}
                      >
                        삭제
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.amountAddGrid}>
                <input
                  type='text'
                  className={styles.textInput}
                  placeholder='라벨 (예: 아이 1명 일주일 급식)'
                  value={amountDraft.label}
                  onChange={(e) => setAmountDraft({ ...amountDraft, label: e.target.value })}
                />
                <input
                  type='text'
                  inputMode='numeric'
                  className={styles.textInput}
                  placeholder='금액'
                  value={amountDraft.amount}
                  onChange={(e) => setAmountDraft({ ...amountDraft, amount: e.target.value })}
                  onKeyDown={handleAmountKeyDown}
                />
                <button type='button' className={styles.addBtn} onClick={addAmountOption}>
                  옵션 추가
                </button>
              </div>
              {fieldErrors.amountOptions ? (
                <span className={styles.fieldError} role='alert'>
                  {fieldErrors.amountOptions}
                </span>
              ) : null}
            </div>

            <div className={styles.listsGrid}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionLabel}>
                    하단 카드 <span className={styles.required}>*</span>
                  </span>
                  <button
                    type='button'
                    className={styles.smallBtn}
                    disabled={lists.programs.length >= MAX_CAMPAIGN_PROGRAMS}
                    onClick={() => updatePrograms([...lists.programs, emptyProgram()])}
                  >
                    + 하단 카드 추가
                  </button>
                </div>
                <p className={styles.sectionHint}>
                  하단 카드를 1~{MAX_CAMPAIGN_PROGRAMS}개 등록합니다.
                </p>

                {lists.programs.length === 0 ? (
                  <span className={styles.emptyText}>등록된 하단 카드가 없습니다.</span>
                ) : (
                  lists.programs.map((program, index) => (
                    <div key={`program-${index}`} className={styles.itemCard}>
                      <div className={styles.itemCardHeader}>
                        <span className={styles.itemCardTitle}>하단 카드 {index + 1}</span>
                        <button
                          type='button'
                          className={styles.removeBtn}
                          onClick={() => updatePrograms(lists.programs.filter((_, i) => i !== index))}
                        >
                          삭제
                        </button>
                      </div>
                      <input
                        type='text'
                        className={styles.textInput}
                        placeholder='제목 (예: 교육 및 역량 개발)'
                        value={program.title}
                        onChange={(e) => {
                          const next = [...lists.programs];
                          next[index] = { ...program, title: e.target.value };
                          updatePrograms(next);
                        }}
                      />
                      <textarea
                        className={styles.textArea}
                        placeholder='설명'
                        rows={4}
                        value={program.desc}
                        onChange={(e) => {
                          const next = [...lists.programs];
                          next[index] = { ...program, desc: e.target.value };
                          updatePrograms(next);
                        }}
                      />
                    </div>
                  ))
                )}
                {fieldErrors.programs ? (
                  <span className={styles.fieldError} role='alert'>
                    {fieldErrors.programs}
                  </span>
                ) : null}
              </div>

              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionLabel}>콘텐츠 섹션</span>
                  <button
                    type='button'
                    className={styles.smallBtn}
                    onClick={() => updateSections([...lists.sections, emptySection()])}
                  >
                    + 섹션 추가
                  </button>
                </div>
                <p className={styles.sectionHint}>
                  본문 섹션입니다. 이미지는 파일로 업로드되며 API가 S3 URL을 자동 저장합니다. 제목 강조는
                  titleRuns로 지정합니다.
                </p>

                {lists.sections.length === 0 ? (
                  <span className={styles.emptyText}>등록된 섹션이 없습니다.</span>
                ) : (
                  lists.sections.map((section, sectionIndex) => (
                    <SectionEditor
                      key={`section-${sectionIndex}`}
                      index={sectionIndex}
                      apiIndex={lists.sections
                        .slice(0, sectionIndex)
                        .filter((s) => s.title.trim() && s.desc.trim()).length}
                      isEdit={isEdit}
                      section={section}
                      onChange={(next) => {
                        const sections = [...lists.sections];
                        sections[sectionIndex] = next;
                        updateSections(sections);
                      }}
                      onRemove={() => updateSections(lists.sections.filter((_, i) => i !== sectionIndex))}
                    />
                  ))
                )}
                {fieldErrors.sections ? (
                  <span className={styles.fieldError} role='alert'>
                    {fieldErrors.sections}
                  </span>
                ) : null}
              </div>
            </div>

            <div className={styles.imageBlock}>
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

type SectionEditorProps = {
  index: number;
  apiIndex: number;
  isEdit: boolean;
  section: SectionForm;
  onChange: (section: SectionForm) => void;
  onRemove: () => void;
};

function SectionEditor({ index, apiIndex, isEdit, section, onChange, onRemove }: SectionEditorProps) {
  const [sectionPreviewUrl, setSectionPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (section.imageFile) {
      const url = URL.createObjectURL(section.imageFile);
      setSectionPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (section.imageRemoved) {
      setSectionPreviewUrl(null);
      return;
    }
    setSectionPreviewUrl(section.existingImageUrl || null);
  }, [section.imageFile, section.existingImageUrl, section.imageRemoved]);

  const updateTitleRuns = (titleRuns: TitleRunForm[]) => {
    onChange({ ...section, titleRuns });
  };

  const previewUrls = sectionPreviewUrl ? [sectionPreviewUrl] : [];

  const handleSectionImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ ...section, imageFile: file, imageRemoved: false });
    e.target.value = '';
  };

  const handleSectionImageDelete = () => {
    if (section.imageFile) {
      onChange({ ...section, imageFile: null });
      return;
    }
    if (isEdit && section.existingImageUrl) {
      onChange({ ...section, existingImageUrl: '', imageFile: null, imageRemoved: true });
      return;
    }
    onChange({ ...section, imageFile: null, existingImageUrl: '', imageRemoved: false });
  };

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCardHeader}>
        <span className={styles.itemCardTitle}>섹션 {index + 1}</span>
        <button type='button' className={styles.removeBtn} onClick={onRemove}>
          삭제
        </button>
      </div>

      <input
        type='text'
        className={styles.textInput}
        placeholder='섹션 제목'
        value={section.title}
        onChange={(e) => onChange({ ...section, title: e.target.value })}
      />

      <textarea
        className={styles.textArea}
        placeholder='섹션 설명'
        rows={3}
        value={section.desc}
        onChange={(e) => onChange({ ...section, desc: e.target.value })}
      />

      <div className={styles.sectionImageWrap}>
        <ImageUploadField
          label='섹션 이미지'
          previewUrls={previewUrls}
          onUpload={handleSectionImageUpload}
          onDelete={handleSectionImageDelete}
          isEdit
          maxCount={1}
        />
        {isEdit ? (
          <p className={styles.sectionImageHint}>
            {section.imageRemoved
              ? '저장 시 섹션 이미지가 제거됩니다 (img=null).'
              : section.imageFile
                ? `저장 시 새 이미지로 교체됩니다 (sectionImage_${apiIndex}).`
                : section.existingImageUrl
                  ? '새 파일 미전송 시 기존 URL이 유지됩니다. 삭제 시 img=null로 제거됩니다.'
                  : '섹션 이미지는 선택 사항입니다.'}
          </p>
        ) : null}
      </div>

      <div className={styles.titleRunsBlock}>
        <div className={styles.sectionHeader}>
          <span className={styles.fieldLabel}>제목 강조 (titleRuns)</span>
          <button
            type='button'
            className={styles.smallBtn}
            onClick={() => updateTitleRuns([...section.titleRuns, emptyTitleRun()])}
          >
            + 강조 추가
          </button>
        </div>

        {section.titleRuns.length === 0 ? (
          <span className={styles.emptyText}>강조할 텍스트가 없습니다.</span>
        ) : (
          section.titleRuns.map((run, runIndex) => (
            <div key={`run-${runIndex}`} className={styles.titleRunRow}>
              <input
                type='text'
                className={styles.textInput}
                placeholder='강조 텍스트'
                value={run.text}
                onChange={(e) => {
                  const titleRuns = [...section.titleRuns];
                  titleRuns[runIndex] = { ...run, text: e.target.value };
                  updateTitleRuns(titleRuns);
                }}
              />
              <input
                type='text'
                className={styles.textInput}
                placeholder='#F4511E'
                value={run.color}
                onChange={(e) => {
                  const titleRuns = [...section.titleRuns];
                  titleRuns[runIndex] = { ...run, color: e.target.value };
                  updateTitleRuns(titleRuns);
                }}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={run.bold}
                  onChange={(e) => {
                    const titleRuns = [...section.titleRuns];
                    titleRuns[runIndex] = { ...run, bold: e.target.checked };
                    updateTitleRuns(titleRuns);
                  }}
                />
                Bold
              </label>
              <button
                type='button'
                className={styles.removeBtn}
                onClick={() => updateTitleRuns(section.titleRuns.filter((_, i) => i !== runIndex))}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
