import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { DonationTypeCode } from './donationApiTypes';

/** 기부 종류(코드/라벨) — FE 드롭다운용. payment-be `GET /api/donations/types`. */
export type DonationTypeOption = {
  code: DonationTypeCode | string;
  label: string;
};

export type GetDonationTypesResponse = {
  success: boolean;
  code: number;
  message: string;
  data: DonationTypeOption[];
};

export const DONATION_TYPES_QUERY_KEY = 'donation-types';

export const useGetDonationTypes = () => {
  return useQuery<GetDonationTypesResponse>({
    queryKey: [DONATION_TYPES_QUERY_KEY],
    queryFn: () => APIService.private.get<GetDonationTypesResponse>('/donations/types'),
    staleTime: Infinity, // enum 고정값 — 세션 내 재요청 불필요
  });
};
