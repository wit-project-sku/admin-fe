import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

/**
 * 학교 기부 대시보드 통계 — payment-be `GET /api/admin/donations/schools/stats`.
 * keyword/region 은 전체 섹션을 스코프하고, startDate/endDate 는 시계열(trend·졸업연도·결제수단·periodCount)만 스코프한다.
 *
 * ⚠️ 백엔드 라우팅: 이 경로는 `/admin/donations/schools/{id}`(PUT/DELETE) 라우트와 충돌하여 현재 405 가 날 수 있다.
 * stats 라우트를 {id} 라우트보다 먼저 등록해야 GET 200 이 반환된다. (임시 동작 경로: `/donations/schools/stats`)
 */
export type SchoolStatsSummary = {
  totalAmount: number;
  participatingSchools: number;
  totalSchools: number;
  participantCount: number;
  studentCount: number;
  avgPerSchool: number;
  matchedSchoolCount: number;
  periodCount: number;
};

export type SchoolStatsTrendPoint = { date: string; amount: number; count: number };
export type SchoolStatsRegionBar = { region: string; label: string; amount: number; schools: number };
export type SchoolStatsGraduationBar = { year: number | string | null; amount: number; count: number };
export type SchoolStatsPaymentBar = { method: string; amount: number; count: number };
export type SchoolStatsRankRow = {
  id: number;
  rank: number;
  rankChange: number | null;
  name: string;
  regionLabel: string;
  amount: number;
  participantCount: number;
  studentCount: number;
  active: boolean;
};

export type SchoolDonationStats = {
  summary: SchoolStatsSummary;
  trend: SchoolStatsTrendPoint[];
  regionBreakdown: SchoolStatsRegionBar[];
  graduationBreakdown: SchoolStatsGraduationBar[];
  paymentBreakdown: SchoolStatsPaymentBar[];
  ranking: SchoolStatsRankRow[];
};

export type GetSchoolDonationStatsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: SchoolDonationStats;
};

export type GetSchoolDonationStatsParams = {
  keyword?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
};

export const SCHOOL_DONATION_STATS_QUERY_KEY = 'school-donation-stats';

export const useGetSchoolDonationStats = (params: GetSchoolDonationStatsParams) => {
  const keyword = params.keyword?.trim() || undefined;
  const region = params.region || undefined;
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  return useQuery<GetSchoolDonationStatsResponse>({
    queryKey: [SCHOOL_DONATION_STATS_QUERY_KEY, keyword ?? '', region ?? '', startDate ?? '', endDate ?? ''],
    queryFn: () =>
      APIService.private.get<GetSchoolDonationStatsResponse>('/admin/donations/schools/stats', {
        params: {
          ...(keyword ? { keyword } : {}),
          ...(region ? { region } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }),
    placeholderData: keepPreviousData,
    retry: 1,
  });
};
