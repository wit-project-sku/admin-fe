import type { DonationSchool } from '../../../hooks/donation-api/useDonationSchools';
import type { DonationHistoryItem } from '../../../hooks/donation-api/useGetDonationHistory';
import { isPaidHistory, type TrendPoint } from './donationDashboardAggregate';

const num = (v: number | null | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ymdLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 지역 코드 필터. `''` = 전체. */
export const filterSchoolsByRegion = (schools: DonationSchool[], region: string): DonationSchool[] =>
  region ? schools.filter((s) => s.region === region) : schools;

/** 학교명 검색 필터(부분 일치, 대소문자 무시). 빈 값 = 전체. */
export const filterSchoolsByKeyword = (schools: DonationSchool[], keyword: string): DonationSchool[] => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return schools;
  return schools.filter((s) => s.name.toLowerCase().includes(kw));
};

/** 학교명 → 지역 코드 매핑(내역을 지역별로 거르기 위함). */
export const buildNameRegionMap = (schools: DonationSchool[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const s of schools) map.set(s.name, s.region);
  return map;
};

export type SchoolMetrics = {
  totalAmount: number;
  participantCount: number;
  studentCount: number;
  participatingSchools: number;
  totalSchools: number;
  avgPerSchool: number;
};

/** 학교 목록(누적값 기준) → 핵심 지표. accumulatedAmount 는 전기간 누적이라 기간 필터와 무관. */
export const buildSchoolMetrics = (schools: DonationSchool[]): SchoolMetrics => {
  const totalAmount = schools.reduce((acc, s) => acc + num(s.accumulatedAmount), 0);
  const participantCount = schools.reduce((acc, s) => acc + num(s.participantCount), 0);
  const studentCount = schools.reduce((acc, s) => acc + num(s.studentCount), 0);
  const participatingSchools = schools.filter((s) => num(s.accumulatedAmount) > 0).length;
  const totalSchools = schools.length;
  const avgPerSchool = participatingSchools > 0 ? Math.round(totalAmount / participatingSchools) : 0;
  return { totalAmount, participantCount, studentCount, participatingSchools, totalSchools, avgPerSchool };
};

export type RegionBar = { region: string; label: string; amount: number; schools: number };

/** 지역별 누적 기부액 합계(내림차순). */
export const buildRegionBars = (schools: DonationSchool[]): RegionBar[] => {
  const bucket = new Map<string, RegionBar>();
  for (const s of schools) {
    const key = s.region || 'ETC';
    const cur = bucket.get(key) ?? { region: key, label: s.regionLabel || key, amount: 0, schools: 0 };
    cur.amount += num(s.accumulatedAmount);
    cur.schools += 1;
    bucket.set(key, cur);
  }
  return [...bucket.values()].filter((b) => b.amount > 0).sort((a, b) => b.amount - a.amount);
};

export type SchoolRankRow = {
  id: number;
  rank: number;
  name: string;
  regionLabel: string;
  amount: number;
  participantCount: number;
  studentCount: number;
  rankChange: number | null;
  active: boolean;
};

/** 누적 기부액 상위 학교 랭킹. */
export const buildSchoolRanking = (schools: DonationSchool[], limit = 10): SchoolRankRow[] =>
  [...schools]
    .sort((a, b) => num(b.accumulatedAmount) - num(a.accumulatedAmount))
    .slice(0, limit)
    .map((s, i) => ({
      id: s.id,
      rank: i + 1,
      name: s.name,
      regionLabel: s.regionLabel || '-',
      amount: num(s.accumulatedAmount),
      participantCount: num(s.participantCount),
      studentCount: num(s.studentCount),
      rankChange: s.rankChange,
      active: s.active,
    }));

export type HistoryFilter = { region: string; keyword: string; start: string; end: string };

/** 내역을 지역(학교명→지역) + 학교명 검색 + 기간으로 필터. */
export const filterSchoolHistory = (
  history: DonationHistoryItem[],
  filter: HistoryFilter,
  nameRegion: Map<string, string>,
): DonationHistoryItem[] => {
  const kw = filter.keyword.trim().toLowerCase();
  return history.filter((h) => {
    if (filter.region) {
      const region = nameRegion.get(h.targetName);
      if (region !== filter.region) return false;
    }
    if (kw && !(h.targetName ?? '').toLowerCase().includes(kw)) return false;
    if (!h.donatedAt) return false;
    const day = h.donatedAt.slice(0, 10);
    if (filter.start && day < filter.start) return false;
    if (filter.end && day > filter.end) return false;
    return true;
  });
};

/** 완료 내역을 기간(start~end) 연속 일자 축으로 합산. 최대 180일로 제한. */
export const buildTrendInRange = (history: DonationHistoryItem[], startYmd: string, endYmd: string): TrendPoint[] => {
  const bucket = new Map<string, { amount: number; count: number }>();
  for (const it of history) {
    if (!isPaidHistory(it) || !it.donatedAt) continue;
    const key = it.donatedAt.slice(0, 10);
    const cur = bucket.get(key) ?? { amount: 0, count: 0 };
    cur.amount += num(it.totalAmount);
    cur.count += 1;
    bucket.set(key, cur);
  }

  const start = new Date(`${startYmd}T00:00:00`);
  const end = new Date(`${endYmd}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const out: TrendPoint[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 180) {
    const key = ymdLocal(cursor);
    const entry = bucket.get(key) ?? { amount: 0, count: 0 };
    out.push({
      date: key,
      label: `${cursor.getMonth() + 1}.${cursor.getDate()}`,
      amount: entry.amount,
      count: entry.count,
    });
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out;
};

export type GraduationBar = { year: string; amount: number; count: number };

/** 졸업연도별 완료 기부 분포(연도 오름차순). 미입력은 '미상'. */
export const buildGraduationBars = (history: DonationHistoryItem[]): GraduationBar[] => {
  const bucket = new Map<string, { amount: number; count: number }>();
  for (const it of history) {
    if (!isPaidHistory(it)) continue;
    const year = it.graduationYear != null ? String(it.graduationYear) : '미상';
    const cur = bucket.get(year) ?? { amount: 0, count: 0 };
    cur.amount += num(it.totalAmount);
    cur.count += 1;
    bucket.set(year, cur);
  }
  return [...bucket.entries()]
    .map(([year, v]) => ({ year, amount: v.amount, count: v.count }))
    .sort((a, b) => {
      if (a.year === '미상') return 1;
      if (b.year === '미상') return -1;
      return Number(a.year) - Number(b.year);
    });
};
