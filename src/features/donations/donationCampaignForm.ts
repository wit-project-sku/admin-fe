import type {
  CampaignAmountOption,
  CampaignProgram,
  CampaignSection,
  CampaignTitleRun,
  CampaignWriteBody,
  DonationCampaignMultipartFiles,
} from '../../hooks/donation-api/donationApiTypes';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';

export const MAX_CAMPAIGN_PROGRAMS = 3;

export type AmountOptionForm = {
  label: string;
  amount: string;
};

export type TitleRunForm = {
  text: string;
  bold: boolean;
  color: string;
};

export type ProgramForm = {
  title: string;
  desc: string;
};

export type SectionForm = {
  title: string;
  titleRuns: TitleRunForm[];
  desc: string;
  existingImageUrl: string;
  imageFile: File | null;
  /** Edit only: user cleared an existing section image → send img=null (no sectionImage_i). */
  imageRemoved: boolean;
};

export type CampaignFormState = {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  /** 주최 단체 ID. null = 단체 미지정. */
  organizationId: number | null;
  targetAmount: string;
};

export type CampaignFormLists = {
  amountOptions: AmountOptionForm[];
  programs: ProgramForm[];
  sections: SectionForm[];
};

export type CampaignFieldErrors = Partial<
  Record<
    | 'name'
    | 'description'
    | 'status'
    | 'targetAmount'
    | 'amountOptions'
    | 'programs'
    | 'sections'
    | 'image',
    string
  >
>;

export function emptyCampaignForm(): CampaignFormState {
  return { name: '', description: '', status: 'ACTIVE', organizationId: null, targetAmount: '0' };
}

export function emptyCampaignLists(): CampaignFormLists {
  return { amountOptions: [], programs: [], sections: [] };
}

export function emptyTitleRun(): TitleRunForm {
  return { text: '', bold: false, color: '#F4511E' };
}

export function emptyProgram(): ProgramForm {
  return { title: '', desc: '' };
}

export function emptySection(): SectionForm {
  return { title: '', titleRuns: [], desc: '', existingImageUrl: '', imageFile: null, imageRemoved: false };
}

function normalizeAmountOptions(raw: DonationCampaign['amountOptions'] | unknown): AmountOptionForm[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === 'number') {
        return { label: '', amount: String(item) };
      }
      if (item && typeof item === 'object' && 'amount' in item) {
        const opt = item as CampaignAmountOption;
        return {
          label: opt.label ?? '',
          amount: opt.amount != null ? String(opt.amount) : '',
        };
      }
      return null;
    })
    .filter((item): item is AmountOptionForm => item != null);
}

function normalizeTitleRuns(raw: CampaignTitleRun[] | undefined): TitleRunForm[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((run) => ({
    text: run.text ?? '',
    bold: Boolean(run.bold),
    color: run.color ?? '#F4511E',
  }));
}

export function campaignToFormLists(campaign: DonationCampaign): CampaignFormLists {
  return {
    amountOptions: normalizeAmountOptions(campaign.amountOptions),
    programs: Array.isArray(campaign.programs)
      ? campaign.programs.map((p) => ({ title: p.title ?? '', desc: p.desc ?? '' }))
      : [],
    sections: Array.isArray(campaign.sections)
      ? campaign.sections.map((s) => ({
          title: s.title ?? '',
          titleRuns: normalizeTitleRuns(s.titleRuns),
          desc: s.desc ?? '',
          existingImageUrl: s.img ?? '',
          imageFile: null,
          imageRemoved: false,
        }))
      : [],
  };
}

export function campaignToFormState(campaign: DonationCampaign): CampaignFormState {
  return {
    name: campaign.name ?? '',
    description: campaign.description ?? '',
    status: campaign.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    organizationId: campaign.organization?.id ?? null,
    targetAmount: campaign.targetAmount != null ? String(campaign.targetAmount) : '0',
  };
}

function parsePositiveAmount(raw: string): number | null {
  const value = Number(raw.replace(/,/g, '').trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function parseTargetAmount(raw: string): number | null {
  const trimmed = raw.replace(/,/g, '').trim();
  if (trimmed === '') return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function isCompleteSection(section: SectionForm): boolean {
  return Boolean(section.title.trim() && section.desc.trim());
}

function sectionHasImage(section: SectionForm): boolean {
  if (section.imageRemoved) return false;
  return Boolean(section.imageFile) || Boolean(section.existingImageUrl.trim());
}

function resolveSectionImg(section: SectionForm): string | null {
  if (section.imageFile) return null;
  if (section.imageRemoved) return null;
  return section.existingImageUrl.trim() || null;
}

export function validateCampaignForm(
  form: CampaignFormState,
  lists: CampaignFormLists,
  options?: { isEdit?: boolean },
): CampaignFieldErrors {
  const errors: CampaignFieldErrors = {};
  const isEdit = Boolean(options?.isEdit);

  if (!form.name.trim()) errors.name = '캠페인명을 입력해 주세요.';
  if (!form.description.trim()) errors.description = '설명을 입력해 주세요.';
  if (form.status !== 'ACTIVE' && form.status !== 'INACTIVE') {
    errors.status = '상태를 선택해 주세요.';
  }

  if (parseTargetAmount(form.targetAmount) == null) {
    errors.targetAmount = '0 이상의 숫자를 입력해 주세요. (0 = 목표 없음)';
  }

  if (lists.amountOptions.length === 0) {
    errors.amountOptions = '기부 금액 옵션을 1개 이상 추가해 주세요.';
  } else {
    const invalidOption = lists.amountOptions.find(
      (opt) => !opt.label.trim() || parsePositiveAmount(opt.amount) == null,
    );
    if (invalidOption) {
      errors.amountOptions = '모든 금액 옵션에 라벨과 금액(0 초과)을 입력해 주세요.';
    }
  }

  const completePrograms = lists.programs.filter((p) => p.title.trim() && p.desc.trim());
  const partialProgram = lists.programs.find((p) => {
    const hasTitle = Boolean(p.title.trim());
    const hasDesc = Boolean(p.desc.trim());
    return (hasTitle && !hasDesc) || (!hasTitle && hasDesc);
  });

  if (partialProgram) {
    errors.programs = '하단 카드는 제목과 설명을 모두 입력해 주세요.';
  } else if (completePrograms.length < 1 || completePrograms.length > MAX_CAMPAIGN_PROGRAMS) {
    errors.programs = `하단 카드는 1~${MAX_CAMPAIGN_PROGRAMS}개 등록해 주세요.`;
  }

  const partialSection = lists.sections.find((section) => {
    const hasAny =
      Boolean(section.title.trim()) ||
      Boolean(section.desc.trim()) ||
      sectionHasImage(section) ||
      section.titleRuns.length > 0;
    if (!hasAny) return false;
    if (!isCompleteSection(section)) return true;
    if (!isEdit && !sectionHasImage(section)) return true;
    return section.titleRuns.some((run) => !run.text.trim());
  });

  if (partialSection) {
    errors.sections = isEdit
      ? '섹션은 제목·설명을 입력하고, 강조 텍스트에 내용을 채워 주세요. (이미지 미전송 시 기존 유지, 삭제 시 img=null)'
      : '섹션은 제목·설명·이미지 파일을 모두 입력하고, 강조 텍스트에 내용을 채워 주세요.';
  }

  return errors;
}

function serializeTitleRuns(runs: TitleRunForm[]): CampaignTitleRun[] | undefined {
  const filtered = runs
    .filter((run) => run.text.trim())
    .map((run) => {
      const item: CampaignTitleRun = { text: run.text.trim() };
      if (run.bold) item.bold = true;
      if (run.color.trim()) item.color = run.color.trim();
      return item;
    });
  return filtered.length > 0 ? filtered : undefined;
}

export function buildCampaignWriteBody(form: CampaignFormState, lists: CampaignFormLists): CampaignWriteBody {
  const targetAmount = parseTargetAmount(form.targetAmount) ?? 0;

  const amountOptions = lists.amountOptions
    .map((opt) => ({
      label: opt.label.trim(),
      amount: parsePositiveAmount(opt.amount) ?? 0,
    }))
    .filter((opt) => opt.label && opt.amount > 0)
    .sort((a, b) => a.amount - b.amount);

  const programs: CampaignProgram[] = lists.programs
    .filter((p) => p.title.trim() && p.desc.trim())
    .map((p) => ({ title: p.title.trim(), desc: p.desc.trim() }));

  const sections: CampaignSection[] = lists.sections
    .filter((s) => isCompleteSection(s))
    .map((s) => {
      const section: CampaignSection = {
        title: s.title.trim(),
        desc: s.desc.trim(),
        img: resolveSectionImg(s),
      };
      const titleRuns = serializeTitleRuns(s.titleRuns);
      if (titleRuns) section.titleRuns = titleRuns;
      return section;
    });

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    organizationId: form.organizationId,
    targetAmount,
    amountOptions,
    programs,
    sections,
  };
}

export function buildCampaignMultipartFiles(lists: CampaignFormLists): DonationCampaignMultipartFiles['sectionImages'] {
  const sectionImages: Record<number, File> = {};

  lists.sections
    .filter((s) => isCompleteSection(s))
    .forEach((section, apiIndex) => {
      if (section.imageFile) sectionImages[apiIndex] = section.imageFile;
    });

  return sectionImages;
}
