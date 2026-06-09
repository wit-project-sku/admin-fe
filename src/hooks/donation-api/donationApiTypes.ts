import type { DonationCampaignStatus } from './useGetDonationCampaigns';

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
  targetAmount: number;
  amountOptions: CampaignAmountOption[];
  programs: CampaignProgram[];
  sections: CampaignSection[];
};

export type DonationCampaignMultipartFiles = {
  image?: File | null;
  sectionImages?: Record<number, File | null | undefined>;
};
