import { useMemo } from 'react';
import { useGetDonationHistory, type DonationHistoryItem } from '../../../hooks/donation-api/useGetDonationHistory';
import { useGetDonationCampaigns } from '../../../hooks/donation-api/useGetDonationCampaigns';
import { useGetDonationSchools } from '../../../hooks/donation-api/useDonationSchools';
import { useGetDonationOrganizations } from '../../../hooks/donation-api/useDonationOrganizations';
import { extractCampaignResult } from '../donationFormatters';
import { extractPaginatedResult } from '../../../utils/queryHelpers';
import type { DonationCampaign } from '../../../hooks/donation-api/useGetDonationCampaigns';
import type { DonationSchool } from '../../../hooks/donation-api/useDonationSchools';
import type { DonationOrganization } from '../../../hooks/donation-api/useDonationOrganizations';
import {
  buildDailyTrend,
  buildPaymentSplit,
  buildTopTargets,
  buildTypeSplit,
  countPaid,
  countUniqueDonors,
  sumPaid,
} from './donationDashboardAggregate';

/** 대시보드 집계용 넉넉한 표본 크기(단일 페이지 조회). */
const ANALYTICS_SAMPLE_SIZE = 200;
const TREND_DAYS = 30;

export function useDonationDashboardModel() {
  // 완료·실패 포함 전체 내역을 유형별로 조회 후 합산.
  const campaignHistoryQuery = useGetDonationHistory({
    pageNum: 1,
    pageSize: ANALYTICS_SAMPLE_SIZE,
    targetType: 'CAMPAIGN',
  });
  const schoolHistoryQuery = useGetDonationHistory({
    pageNum: 1,
    pageSize: ANALYTICS_SAMPLE_SIZE,
    targetType: 'SCHOOL',
  });

  const campaignsQuery = useGetDonationCampaigns({ pageNum: 1, pageSize: ANALYTICS_SAMPLE_SIZE, includeInactive: true });
  const schoolsQuery = useGetDonationSchools({ pageNum: 1, pageSize: ANALYTICS_SAMPLE_SIZE, includeInactive: true });
  const orgsQuery = useGetDonationOrganizations({ pageNum: 1, pageSize: ANALYTICS_SAMPLE_SIZE });

  const history = useMemo<DonationHistoryItem[]>(() => {
    const campaignItems = extractPaginatedResult<DonationHistoryItem>(campaignHistoryQuery.data).content;
    const schoolItems = extractPaginatedResult<DonationHistoryItem>(schoolHistoryQuery.data).content;
    return [...campaignItems, ...schoolItems];
  }, [campaignHistoryQuery.data, schoolHistoryQuery.data]);

  const { campaigns } = extractCampaignResult<DonationCampaign>(campaignsQuery.data, 1, ANALYTICS_SAMPLE_SIZE);
  const { content: schools, totalElements: schoolTotal } = extractPaginatedResult<DonationSchool>(schoolsQuery.data);
  const { totalElements: orgTotal } = extractPaginatedResult<DonationOrganization>(orgsQuery.data);

  const metrics = useMemo(() => {
    const totalAmount = sumPaid(history);
    const totalCount = countPaid(history);
    const donorCount = countUniqueDonors(history);
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const activeSchools = schools.filter((s) => s.active).length;
    return {
      totalAmount,
      totalCount,
      donorCount,
      campaignTotal: campaigns.length,
      activeCampaigns,
      schoolTotal: schoolTotal || schools.length,
      activeSchools,
      orgTotal: orgTotal || 0,
    };
  }, [history, campaigns, schools, schoolTotal, orgTotal]);

  const trend = useMemo(() => buildDailyTrend(history, TREND_DAYS), [history]);
  const typeSplit = useMemo(() => buildTypeSplit(history), [history]);
  const paymentSplit = useMemo(() => buildPaymentSplit(history), [history]);
  const topTargets = useMemo(() => buildTopTargets(history, 8), [history]);

  const isLoading =
    campaignHistoryQuery.isLoading ||
    schoolHistoryQuery.isLoading ||
    campaignsQuery.isLoading ||
    schoolsQuery.isLoading;

  const isError =
    campaignHistoryQuery.isError ||
    schoolHistoryQuery.isError ||
    campaignsQuery.isError ||
    schoolsQuery.isError;

  const refetch = () => {
    campaignHistoryQuery.refetch();
    schoolHistoryQuery.refetch();
    campaignsQuery.refetch();
    schoolsQuery.refetch();
    orgsQuery.refetch();
  };

  return { metrics, trend, typeSplit, paymentSplit, topTargets, isLoading, isError, refetch };
}
