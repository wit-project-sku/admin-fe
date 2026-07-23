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

/** 지난주 월~일 + 그 전주 */
export function lastWeekRanges() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 월=0
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - dow);
  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - 7);
  const end = new Date(thisMonday);
  end.setDate(thisMonday.getDate() - 1);
  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - 7);
  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);
  return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
}

/** 지난달 1일~말일 + 그 전달 */
export function lastMonthRanges() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevFirst = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prevLast = new Date(now.getFullYear(), now.getMonth() - 1, 0);
  return {
    start: fmt(first), end: fmt(last), prevStart: fmt(prevFirst), prevEnd: fmt(prevLast),
    label: `${first.getFullYear()}년 ${first.getMonth() + 1}월`,
  };
}

const SERVICE_START = '2024-11-01';

/* ── 촬영: 일별(일×지점) ── */
type ShootingDaily = { rows: Record<string, string | number>[]; kioskNames: string[] };

async function fetchShootingDaily(start: string, end: string): Promise<ShootingDaily> {
  const res = await APIService.private.get('/admin/stats/daily', { params: { start, end } });
  const { rows, kioskNames } = buildShootingStatsTableModel(res, 'date');
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
