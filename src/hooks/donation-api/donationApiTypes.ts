import type { DonationCampaignStatus } from './useGetDonationCampaigns';

export type CampaignWriteBody = {
  name: string;
  description: string;
  status: DonationCampaignStatus;
  amountOptions: number[];
};
