import type { DonationCampaignStatus } from './useGetDonationCampaigns';

/** 기부 종류 코드 (payment-be DonationType enum). NGO 만 실사용(학교는 별도 도메인). */
export type DonationTypeCode = 'NGO' | 'SCHOOL';

/** 캠페인/내역에 연결된 주최 단체 요약(목록·드롭다운용). */
export type DonationOrganizationSummary = {
  id: number;
  type: DonationTypeCode;
  name: string;
};

/** 기부 금액 옵션(응답 전용) — 전역 고정 프리셋. 금액만. */
export type CampaignAmountOption = {
  amount: number;
};

/**
 * 캠페인 등록·수정 요청 바디(간소화).
 * multipart `data` 파트로 전송. 썸네일은 `image` 파트.
 * - effects: 기대효과 3개(상세 화면 넘버링 칩)
 * - 금액은 전역 고정 프리셋이라 캠페인별 설정 없음(응답에만 amountOptions 포함)
 */
export type CampaignWriteBody = {
  name: string;
  description: string;
  status: DonationCampaignStatus;
  /** 주최 단체 ID. null = 단체 미지정. */
  organizationId: number | null;
  targetAmount: number;
  effects: string[];
  /** 메인 배너 상단 안내 문구(선택). */
  bannerSubtitle?: string | null;
  /** 메인 배너 큰 캐치프레이즈(선택). */
  bannerTitle?: string | null;
};

export type DonationCampaignMultipartFiles = {
  image?: File | null;
};
