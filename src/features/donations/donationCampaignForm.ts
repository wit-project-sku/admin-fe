import type { CampaignWriteBody } from '../../hooks/donation-api/donationApiTypes';
import type { DonationCampaign } from '../../hooks/donation-api/useGetDonationCampaigns';
import { DONATION_DESCRIPTION_MAX, DONATION_NAME_MAX } from './donationContentLimits';

/** 기대효과 입력 개수(상세 화면 넘버링 칩) — 정확히 3개 고정. */
export const CAMPAIGN_EFFECT_COUNT = 3;

export type CampaignFormState = {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  /** 주최 단체 ID. null = 단체 미지정. */
  organizationId: number | null;
  targetAmount: string;
  /** 기대효과 3개. 항상 길이 3으로 유지. */
  effects: string[];
  /** 메인 배너 상단 안내 문구(선택). */
  bannerSubtitle: string;
  /** 메인 배너 큰 캐치프레이즈(선택). */
  bannerTitle: string;
};

export type CampaignFieldErrors = Partial<
  Record<'name' | 'description' | 'status' | 'targetAmount' | 'effects' | 'image', string>
>;

/** 항상 길이 3인 effects 배열로 정규화(부족분 채우고 초과분은 잘라냄). */
export function normalizeEffects(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw.map((e) => (e == null ? '' : String(e))) : [];
  const next = list.slice(0, CAMPAIGN_EFFECT_COUNT);
  while (next.length < CAMPAIGN_EFFECT_COUNT) next.push('');
  return next;
}

export function emptyCampaignForm(): CampaignFormState {
  return {
    name: '',
    description: '',
    status: 'ACTIVE',
    organizationId: null,
    targetAmount: '0',
    effects: normalizeEffects([]),
    bannerSubtitle: '',
    bannerTitle: '',
  };
}

export function campaignToFormState(campaign: DonationCampaign): CampaignFormState {
  return {
    name: campaign.name ?? '',
    description: campaign.description ?? '',
    status: campaign.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    organizationId: campaign.organization?.id ?? null,
    targetAmount: campaign.targetAmount != null ? String(campaign.targetAmount) : '0',
    effects: normalizeEffects(campaign.effects),
    bannerSubtitle: campaign.bannerSubtitle ?? '',
    bannerTitle: campaign.bannerTitle ?? '',
  };
}

function parseTargetAmount(raw: string): number | null {
  const trimmed = raw.replace(/,/g, '').trim();
  if (trimmed === '') return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function validateCampaignForm(form: CampaignFormState): CampaignFieldErrors {
  const errors: CampaignFieldErrors = {};

  if (!form.name.trim()) errors.name = '캠페인명을 입력해 주세요.';
  else if (form.name.length > DONATION_NAME_MAX) errors.name = `캠페인명은 ${DONATION_NAME_MAX}자 이하로 입력해 주세요.`;
  if (!form.description.trim()) errors.description = '설명을 입력해 주세요.';
  else if (form.description.length > DONATION_DESCRIPTION_MAX)
    errors.description = `내용은 ${DONATION_DESCRIPTION_MAX}자 이하로 입력해 주세요.`;
  if (form.status !== 'ACTIVE' && form.status !== 'INACTIVE') {
    errors.status = '상태를 선택해 주세요.';
  }

  if (parseTargetAmount(form.targetAmount) == null) {
    errors.targetAmount = '0 이상의 숫자를 입력해 주세요. (0 = 목표 없음)';
  }

  const filledEffects = form.effects.filter((e) => e.trim());
  if (filledEffects.length !== CAMPAIGN_EFFECT_COUNT) {
    errors.effects = `기대효과 ${CAMPAIGN_EFFECT_COUNT}개를 모두 입력해 주세요.`;
  }

  return errors;
}

export function buildCampaignWriteBody(form: CampaignFormState): CampaignWriteBody {
  const targetAmount = parseTargetAmount(form.targetAmount) ?? 0;

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    organizationId: form.organizationId,
    targetAmount,
    effects: form.effects.map((e) => e.trim()),
    bannerSubtitle: form.bannerSubtitle.trim() ? form.bannerSubtitle.trim() : null,
    bannerTitle: form.bannerTitle.trim() ? form.bannerTitle.trim() : null,
  };
}
