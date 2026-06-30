import type { DonationCampaignStatus } from './useGetDonationCampaigns';

/** 기부 종류 코드 (payment-be DonationType enum). */
export type DonationTypeCode = 'NGO' | 'SCHOOL';

/** 캠페인/내역에 연결된 주최 단체 요약(목록·드롭다운용). */
export type DonationOrganizationSummary = {
  id: number;
  type: DonationTypeCode;
  name: string;
};

export type CampaignAmountOption = {
  label: string;
  amount: number;
};

export type CampaignTitleRun = {
  text: string;
  bold?: boolean;
  color?: string;
};

export type CampaignProgram = {
  title: string;
  desc: string;
};

export type CampaignSection = {
  title: string;
  titleRuns?: CampaignTitleRun[];
  desc: string;
  img: string | null;
};

export type CampaignWriteBody = {
  name: string;
  description: string;
  status: DonationCampaignStatus;
  /** 주최 단체 ID. null = 단체 미지정. */
  organizationId: number | null;
  targetAmount: number;
  amountOptions: CampaignAmountOption[];
  programs: CampaignProgram[];
  sections: CampaignSection[];
};

export type DonationCampaignMultipartFiles = {
  image?: File | null;
  sectionImages?: Record<number, File | null | undefined>;
};
