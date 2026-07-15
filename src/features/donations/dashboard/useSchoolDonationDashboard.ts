import { useMemo, useState } from 'react';
import { useGetDonationHistory, type DonationHistoryItem } from '../../../hooks/donation-api/useGetDonationHistory';
import {
  useGetDonationSchools,
  useGetDonationSchoolRegions,
  type DonationSchool,
} from '../../../hooks/donation-api/useDonationSchools';
import {
  useGetSchoolDonationStats,
  type SchoolDonationStats,
} from '../../../hooks/donation-api/useGetSchoolDonationStats';
import { extractPaginatedResult } from '../../../utils/queryHelpers';
import { getPastDateYmd, getLocalTodayYmd } from '../../../utils/dateUtils';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { buildPaymentSplit, PAYMENT_METHOD_LABEL, type DonationSlice, type TrendPoint } from './donationDashboardAggregate';
import {
  buildGraduationBars,
  buildNameRegionMap,
  buildRegionBars,
  buildSchoolMetrics,
  buildSchoolRanking,
  buildTrendInRange,
  filterSchoolHistory,
  filterSchoolsByKeyword,
  filterSchoolsByRegion,
  type GraduationBar,
  type RegionBar,
  type SchoolMetrics,
  type SchoolRankRow,
} from './schoolDonationAggregate';

const SAMPLE_SIZE = 200;
const DEFAULT_RANGE_DAYS = 30;

/** 'YYYY-MM-DD' → 'M.D' 라벨. */
const trendLabel = (date: string): string => {
  const [, mm, dd] = date.split('-');
  return `${Number(mm)}.${Number(dd)}`;
};

/** 서버 통계 응답을 대시보드 컴포넌트가 쓰는 형태로 변환. */
function mapServerStats(stats: SchoolDonationStats): {
  metrics: SchoolMetrics;
  regionBars: RegionBar[];
  ranking: SchoolRankRow[];
  trend: TrendPoint[];
  graduationBars: GraduationBar[];
  paymentSplit: DonationSlice[];
  matchedSchoolCount: number;
  periodDonationCount: number;
} {
  const summary = stats.summary;
  return {
    metrics: {
      totalAmount: summary.totalAmount,
      participantCount: summary.participantCount,
      studentCount: summary.studentCount,
      participatingSchools: summary.participatingSchools,
      totalSchools: summary.totalSchools,
      avgPerSchool: summary.avgPerSchool,
    },
    regionBars: (stats.regionBreakdown ?? []).map((r) => ({
      region: r.region,
      label: r.label,
      amount: r.amount,
      schools: r.schools,
    })),
    ranking: (stats.ranking ?? []).map((r) => ({
      id: r.id,
      rank: r.rank,
      name: r.name,
      regionLabel: r.regionLabel,
      amount: r.amount,
      participantCount: r.participantCount,
      studentCount: r.studentCount,
      rankChange: r.rankChange,
      active: r.active,
    })),
    trend: (stats.trend ?? []).map((t) => ({
      date: t.date,
      label: trendLabel(t.date),
      amount: t.amount,
      count: t.count,
    })),
    graduationBars: (stats.graduationBreakdown ?? []).map((g) => ({
      year: g.year == null ? '미상' : String(g.year),
      amount: g.amount,
      count: g.count,
    })),
    paymentSplit: (stats.paymentBreakdown ?? []).map((p) => ({
      key: p.method,
      label: PAYMENT_METHOD_LABEL[p.method] ?? p.method,
      amount: p.amount,
      count: p.count,
    })),
    matchedSchoolCount: summary.matchedSchoolCount,
    periodDonationCount: summary.periodCount,
  };
}

export function useSchoolDonationDashboard() {
  const [region, setRegion] = useState('');
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const [rangeStart, setRangeStart] = useState(() => getPastDateYmd(DEFAULT_RANGE_DAYS));
  const [rangeEnd, setRangeEnd] = useState(() => getLocalTodayYmd());

  // 1차: 서버 통계 엔드포인트(필터 반영). 실패 시 클라이언트 집계로 폴백.
  const statsQuery = useGetSchoolDonationStats({
    keyword: debouncedKeyword,
    region,
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  // 폴백용 원천 데이터(필터 무관 전체 조회 → 쿼리키 고정 → 최초 1회만 fetch/캐시).
  const schoolsQuery = useGetDonationSchools({ pageNum: 1, pageSize: SAMPLE_SIZE, sort: 'DONATION', includeInactive: true });
  const historyQuery = useGetDonationHistory({ pageNum: 1, pageSize: SAMPLE_SIZE, targetType: 'SCHOOL' });
  const regionsQuery = useGetDonationSchoolRegions();

  const regionOptions = regionsQuery.data?.data ?? [];
  const serverStats = statsQuery.data?.data;
  const useServer = Boolean(serverStats) && !statsQuery.isError;

  // ---- 클라이언트 폴백 집계 ----
  const allSchools = extractPaginatedResult<DonationSchool>(schoolsQuery.data).content;
  const allHistory = extractPaginatedResult<DonationHistoryItem>(historyQuery.data).content;
  const nameRegion = useMemo(() => buildNameRegionMap(allSchools), [allSchools]);
  const schools = useMemo(
    () => filterSchoolsByKeyword(filterSchoolsByRegion(allSchools, region), debouncedKeyword),
    [allSchools, region, debouncedKeyword],
  );
  const history = useMemo(
    () =>
      filterSchoolHistory(
        allHistory,
        { region, keyword: debouncedKeyword, start: rangeStart, end: rangeEnd },
        nameRegion,
      ),
    [allHistory, region, debouncedKeyword, rangeStart, rangeEnd, nameRegion],
  );

  const view = useMemo(() => {
    if (useServer && serverStats) return mapServerStats(serverStats);
    return {
      metrics: buildSchoolMetrics(schools),
      regionBars: buildRegionBars(schools),
      ranking: buildSchoolRanking(schools, 10),
      trend: buildTrendInRange(history, rangeStart, rangeEnd),
      graduationBars: buildGraduationBars(history),
      paymentSplit: buildPaymentSplit(history),
      matchedSchoolCount: schools.length,
      periodDonationCount: history.length,
    };
  }, [useServer, serverStats, schools, history, rangeStart, rangeEnd]);

  // ---- 상태 ----
  const isLoading = statsQuery.isLoading || (!useServer && (schoolsQuery.isLoading || historyQuery.isLoading));
  const isError = !useServer && statsQuery.isError && (schoolsQuery.isError || historyQuery.isError);
  const isFetching = statsQuery.isFetching || schoolsQuery.isFetching || historyQuery.isFetching;

  const refetch = () => {
    statsQuery.refetch();
    schoolsQuery.refetch();
    historyQuery.refetch();
  };

  const resetFilters = () => {
    setRegion('');
    setKeyword('');
    setRangeStart(getPastDateYmd(DEFAULT_RANGE_DAYS));
    setRangeEnd(getLocalTodayYmd());
  };

  return {
    // filter state
    region,
    setRegion,
    keyword,
    setKeyword,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    regionOptions,
    resetFilters,
    // data
    metrics: view.metrics,
    regionBars: view.regionBars,
    ranking: view.ranking,
    trend: view.trend,
    graduationBars: view.graduationBars,
    paymentSplit: view.paymentSplit,
    matchedSchoolCount: view.matchedSchoolCount,
    periodDonationCount: view.periodDonationCount,
    // status
    isLoading,
    isError,
    isFetching,
    refetch,
  };
}
