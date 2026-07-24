// 통계 리포트 실데이터 훅 — 기존 서버 API를 조합해 리포트 뷰모델을 만든다.
//   촬영: GET /admin/stats/daily (일×지점) · GET /admin/stats/monthly (월×지점)
//   의상: GET /admin/stats/outfit-ranking (실물 사진 imageUrl 포함)
//   버튼: GET /admin/stats/buttons/summary (지점·버튼별 클릭/사용시간/평균체류)
// 서버 집계가 없는 항목(오전/오후·시간대별·AI 분석·카테고리별 1위·의상 매트릭스)은
// 표본 태그와 함께 표시한다(→ P2/P3 백엔드 개발 목록).
import { useQuery } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';
import { buildShootingStatsTableModel } from '../shootingStatsMappers';
import type {
  KioskButtonStatsSummaryBlock,
  KioskButtonStatsSummaryResponse,
} from '@/hooks/kiosk-api/kioskButtonStatsTypes';

/* ── 기간 계산 (KST 로컬 기준) ── */
function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type WeekRanges = { start: string; end: string; prevStart: string; prevEnd: string };
export type MonthRanges = WeekRanges & { label: string };

/** anchor 날짜(YYYY-MM-DD)가 속한 주(월~일) + 그 전주. anchor 없으면 지난 완결 주. */
export function weekRangesOf(anchor?: string): WeekRanges {
  let base: Date;
  if (anchor && /^\d{4}-\d{2}-\d{2}$/.test(anchor)) {
    base = new Date(`${anchor}T00:00:00`);
  } else {
    base = new Date();
    base.setDate(base.getDate() - 7); // 지난주 기준
  }
  const dow = (base.getDay() + 6) % 7; // 월=0
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow);
  const start = monday;
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - 7);
  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);
  return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
}

/** yearMonth(YYYY-MM)의 1일~말일 + 그 전달. yearMonth 없으면 지난달. */
export function monthRangesOf(yearMonth?: string): MonthRanges {
  let y: number;
  let m: number; // 1~12
  if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) {
    y = Number(yearMonth.slice(0, 4));
    m = Number(yearMonth.slice(5, 7));
  } else {
    const n = new Date();
    const f = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    y = f.getFullYear();
    m = f.getMonth() + 1;
  }
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const prevFirst = new Date(y, m - 2, 1);
  const prevLast = new Date(y, m - 1, 0);
  return {
    start: fmt(first), end: fmt(last), prevStart: fmt(prevFirst), prevEnd: fmt(prevLast),
    label: `${y}년 ${m}월`,
  };
}

/** 지난주 월~일 + 그 전주 (하위호환) */
export function lastWeekRanges(): WeekRanges {
  return weekRangesOf();
}

/** 지난달 1일~말일 + 그 전달 (하위호환) */
export function lastMonthRanges(): MonthRanges {
  return monthRangesOf();
}

const SERVICE_START = '2024-11-01';

/* ── 촬영: 일별(일×지점) ── */
type ShootingDaily = { rows: Record<string, string | number>[]; kioskNames: string[] };

async function fetchShootingDaily(start: string, end: string): Promise<ShootingDaily> {
  const res = await APIService.private.get('/admin/stats/daily', { params: { start, end } });
  const { rows, kioskNames } = buildShootingStatsTableModel(res, 'date');
  // 서버는 최신순(DESC) — 리포트는 시간 오름차순으로 통일(그래프·일별 표)
  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return { rows, kioskNames };
}

export function useShootingDailyLive(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-shooting-daily', start, end],
    queryFn: () => fetchShootingDaily(start, end),
    enabled,
    staleTime: 60_000,
  });
}

/* ── 촬영: 월별(월×지점, 누적 계산용 전체) ── */
export function useShootingMonthlyLive(enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-shooting-monthly'],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/monthly', {
        params: { pageNum: 1, pageSize: 60, sort: 'DESC' },
      });
      return buildShootingStatsTableModel(res, 'month');
    },
    enabled,
    staleTime: 60_000,
  });
}

/* ── 의상 랭킹(실물 사진) ── */
export type LiveOutfitCard = {
  rank: number;
  name: string;
  code: string;
  cat?: string;
  cnt: number;
  imageUrl?: string;
};

function readRankingRows(raw: unknown): LiveOutfitCard[] {
  // 응답 형태 방어적 해석: data.content[] | data[] | content[]
  const root = (raw ?? {}) as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const list = (Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []) as Record<string, unknown>[];
  return list.map((o, i) => ({
    rank: Number(o.rank ?? i + 1),
    name: String(o.name ?? o.outfitName ?? '-'),
    code: String(o.outfitCode ?? o.code ?? ''),
    cat: o.categoryName != null ? String(o.categoryName) : o.category != null ? String(o.category) : undefined,
    cnt: Number(o.count ?? o.shotCount ?? o.total ?? 0),
    imageUrl: o.imageUrl != null ? String(o.imageUrl) : undefined,
  }));
}

export function useOutfitTopLive(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-outfit-top', start, end],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/outfit-ranking', {
        params: { sort: 'POPULAR', pageNum: 1, pageSize: 10, start, end },
      });
      return readRankingRows(res);
    },
    enabled,
    staleTime: 60_000,
  });
}

/* ── 버튼 요약(금기·전기·누적) ── */
async function fetchButtonsBlock(startDate: string, endDate: string): Promise<KioskButtonStatsSummaryBlock | null> {
  const res = await APIService.private.get<KioskButtonStatsSummaryResponse>('/admin/stats/buttons/summary', {
    params: { startDate, endDate, pageNum: 1, pageSize: 500 },
  });
  const block = (res as unknown as KioskButtonStatsSummaryResponse)?.data?.content?.[0]
    ?? (res as unknown as { content?: KioskButtonStatsSummaryBlock[] })?.content?.[0];
  return block ?? null;
}

export function useButtonsLive(start: string, end: string, prevStart: string, prevEnd: string, enabled: boolean) {
  const cur = useQuery({
    queryKey: ['stat-report-buttons', start, end],
    queryFn: () => fetchButtonsBlock(start, end),
    enabled,
    staleTime: 60_000,
  });
  const prev = useQuery({
    queryKey: ['stat-report-buttons', prevStart, prevEnd],
    queryFn: () => fetchButtonsBlock(prevStart, prevEnd),
    enabled,
    staleTime: 60_000,
  });
  const cum = useQuery({
    queryKey: ['stat-report-buttons-cum'],
    queryFn: () => fetchButtonsBlock(SERVICE_START, fmt(new Date())),
    enabled,
    staleTime: 5 * 60_000,
  });
  return { cur, prev, cum };
}

/* ── 리포트용 신규 집계 API (P2 서버 구현) ── */

/** BaseResponse 언래핑 — APIService 가 벗기는 경우/안 벗기는 경우 모두 방어 */
function unwrap<T>(res: unknown): T {
  const r = (res ?? {}) as Record<string, unknown>;
  return (r.data ?? r) as T;
}

export type HourlyData = { hourly: { hour: number; count: number }[]; amCount: number; pmCount: number };

/** 시간대별 촬영 분포 + 오전/오후 */
export function useShotsHourly(start: string, end: string, enabled: boolean, kioskId?: number) {
  return useQuery({
    queryKey: ['stat-report-hourly', start, end, kioskId ?? ''],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/shots/hourly', {
        params: { start, end, ...(kioskId ? { kioskId } : {}) },
      });
      return unwrap<HourlyData>(res);
    },
    enabled,
    staleTime: 60_000,
  });
}

export type WeekdayRow = { weekday: string; total: number; avg: number };

/** 요일별 일평균 촬영 */
export function useShotsWeekday(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-weekday', start, end],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/shots/weekday', { params: { start, end } });
      return unwrap<WeekdayRow[]>(res) ?? [];
    },
    enabled,
    staleTime: 60_000,
  });
}

export type CategoryTop = {
  category: string;
  overall: { name: string; code: string; count: number } | null;
  byKiosk: { kioskId: number; kioskName: string; name: string; code: string; count: number }[];
};

/** 카테고리별 1위 의상 (전체·키오스크별) */
export function useOutfitCategoryTop(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-cat-top', start, end],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/outfit-category-top', { params: { start, end } });
      return unwrap<CategoryTop[]>(res) ?? [];
    },
    enabled,
    staleTime: 60_000,
  });
}

export type OutfitByKioskData = {
  kiosks: { id: number; name: string }[];
  outfits: { name: string; code: string; category: string; perKiosk: number[]; total: number }[];
  colTotals: number[];
};

/** 의상 × 키오스크 촬영 매트릭스 */
export function useOutfitByKiosk(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-outfit-kiosk', start, end],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/outfit-by-kiosk', { params: { start, end } });
      return unwrap<OutfitByKioskData>(res);
    },
    enabled,
    staleTime: 60_000,
  });
}

export type OutfitMonthlyData = {
  year: number;
  outfits: { name: string; code: string; category: string; months: number[]; total: number }[];
};

/** 의상 × 월(1~12) 매트릭스 */
export function useOutfitMonthly(year: number, enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-outfit-monthly', year],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/stats/outfit-monthly', { params: { year } });
      return unwrap<OutfitMonthlyData>(res);
    },
    enabled,
    staleTime: 60_000,
  });
}

/* ── 공통 포맷터 ── */
export function fmtDurationSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

export function diffBadge(cur: number, prev: number, unit: string, label: string): { text: string; dir: 'up' | 'down' } | undefined {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev <= 0) return undefined;
  const pct = ((cur - prev) / prev) * 100;
  const dir: 'up' | 'down' = pct < 0 ? 'down' : 'up';
  const arrow = pct < 0 ? '▼' : '▲';
  const delta = cur - prev;
  const sign = delta >= 0 ? '+' : '−';
  return { text: `${label} ${arrow} ${Math.abs(pct).toFixed(1)}% (${sign}${Math.abs(delta).toLocaleString()}${unit})`, dir };
}
