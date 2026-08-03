// 통계 리포트 실데이터 훅 — 기존 서버 API를 조합해 리포트 뷰모델을 만든다.
//   촬영: GET /admin/stats/daily (일×지점) · GET /admin/stats/monthly (월×지점)
//   의상: GET /admin/stats/outfit-ranking (실물 사진 imageUrl 포함)
//   버튼: GET /admin/stats/buttons/summary (지점·버튼별 클릭/사용시간/평균체류)
// 키오스크 표시명은 kioskLabel(=뒤)로 변환. 테스트 단말은 서버 집계에서 제외됨.

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

/** 키오스크 표시명 — "#W001-인사동=북인사광장" → "북인사광장" ('=' 뒤만). */
export function kioskLabel(name: string): string {
  const i = name.lastIndexOf('=');
  return i >= 0 ? name.slice(i + 1).trim() : name;
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

/**
 * 페이징 API 를 <b>전체 집계</b> 용도로 부를 때 응답이 잘렸는지 확인한다.
 *
 * <p>통계 엔드포인트는 전부 페이징이고 서버 기본 {@code pageSize=10}·{@code sort=DESC} 다.
 * pageSize 를 안 넘기면 조용히 최근 10건만 와서 <b>수치가 과소집계된다</b>(월간 촬영 리포트가
 * 31일 중 10일만 받아 66% 낮게 나오던 사고). 값이 틀렸다는 신호가 화면 어디에도 없으므로
 * 여기서 명시적으로 경고를 남긴다.
 */
function warnIfTruncated(label: string, received: number, totalElements: number): void {
  if (totalElements > received) {
    console.warn(
      `[통계 리포트] ${label}: ${totalElements}건 중 ${received}건만 받았습니다 — pageSize 를 늘려야 합니다(집계가 과소로 나옵니다).`,
    );
  }
}

/** start~end 를 모두 담을 페이지 크기(일별 응답은 하루 1행). 여유 1행. */
function daysBetween(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`);
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) + 1 : 31;
}

/* ── 촬영: 일별(일×지점) ── */
type ShootingDaily = { rows: Record<string, string | number>[]; kioskNames: string[] };

async function fetchShootingDaily(start: string, end: string): Promise<ShootingDaily> {
  // pageSize 를 안 넘기면 서버 기본값 10 이 적용돼 최근 10일만 온다(월간 31일 → 21일 누락).
  const res = await APIService.private.get('/admin/stats/daily', {
    params: { start, end, pageNum: 1, pageSize: daysBetween(start, end) + 1 },
  });
  const { rows, kioskNames, totalElements } = buildShootingStatsTableModel(res, 'date');
  warnIfTruncated(`촬영 일별 ${start}~${end}`, rows.length, totalElements);
  // 서버는 최신순(DESC) — 리포트는 시간 오름차순으로 통일(그래프·일별 표)
  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  // 키오스크 표시명(=뒤)으로 변환 — rows 키도 함께 리매핑해 정합 유지
  const labeled = rows.map((row) => {
    const r: Record<string, string | number> = { date: row.date, total: row.total };
    for (const n of kioskNames) r[kioskLabel(n)] = row[n];
    return r;
  });
  return { rows: labeled, kioskNames: kioskNames.map(kioskLabel) };
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
      const { rows, kioskNames, totalPages, totalElements } = buildShootingStatsTableModel(res, 'month');
      warnIfTruncated('촬영 월별', rows.length, totalElements);
      const labeled = rows.map((row) => {
        const r: Record<string, string | number> = { month: row.month, total: row.total };
        for (const n of kioskNames) r[kioskLabel(n)] = row[n];
        return r;
      });
      return { rows: labeled, kioskNames: kioskNames.map(kioskLabel), totalPages, totalElements };
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
  if (!block) return null;
  // 키오스크 표시명(=뒤) 변환
  return {
    ...block,
    buttonDetails: block.buttonDetails.map((d) => ({ ...d, representativeKioskName: kioskLabel(d.representativeKioskName) })),
  };
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

/** 리포트용 홈 버튼 카탈로그 — 클릭 0인 버튼도 빈 막대/0행으로 채우기 위해
 *  키오스크별 등록 버튼 전체(placement=MAIN/FIXED)를 조회한다.
 *  응답은 kioskId=null·kioskName만 오므로 kioskLabel(=뒤)로 키를 만든다. 테스트 단말(모니터)은 제외. */
export type ReportKioskButton = { buttonType: string; buttonName: string; line: number; position: number };
export function useReportKioskButtons(enabled: boolean) {
  return useQuery({
    queryKey: ['stat-report-kiosk-buttons'],
    queryFn: async () => {
      const byKiosk: Record<string, ReportKioskButton[]> = {};
      for (let pageNum = 1; pageNum <= 50; pageNum += 1) {
        const res = await APIService.private.get('/admin/kiosks/buttons', {
          params: { pageNum, pageSize: 200 },
        });
        const page = unwrap<{ content?: unknown[]; last?: boolean; totalPages?: number }>(res);
        const content = (page.content ?? []) as Array<{
          kioskName?: string;
          buttonType?: string;
          buttonName?: string;
          placement?: string;
          line?: number;
          position?: number;
        }>;
        if (content.length === 0) break;
        for (const b of content) {
          // 홈 화면에 표시되는 버튼만(MAIN 그리드 + FIXED 고정). OFF_MAIN(미표시)은 제외.
          if (b.placement !== 'MAIN' && b.placement !== 'FIXED') continue;
          const label = kioskLabel(b.kioskName ?? '');
          if (!label || label.includes('모니터')) continue; // 테스트 단말 제외
          (byKiosk[label] ??= []).push({
            buttonType: b.buttonType ?? '',
            buttonName: b.buttonName ?? '',
            line: b.line ?? 99,
            position: b.position ?? 99,
          });
        }
        if (page.last || (page.totalPages && pageNum >= page.totalPages)) break;
      }
      return byKiosk;
    },
    enabled,
    staleTime: 10 * 60_000,
  });
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
      const rows = unwrap<CategoryTop[]>(res) ?? [];
      return rows.map((r) => ({ ...r, byKiosk: r.byKiosk.map((k) => ({ ...k, kioskName: kioskLabel(k.kioskName) })) }));
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
      const data = unwrap<OutfitByKioskData>(res);
      return data ? { ...data, kiosks: data.kiosks.map((k) => ({ ...k, name: kioskLabel(k.name) })) } : data;
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
