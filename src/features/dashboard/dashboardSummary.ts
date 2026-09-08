import type { WeeklyTrendRow } from '@/utils/weeklyStatsNormalize';

export type KioskCountRow = { kioskId: string | number; kioskName: string; count: number };

export type ShootingSummary = {
  todayTotal: number;
  monthlyTotal: number;
  lastMonthTotal: number;
  grandTotal: number;
  todayByKiosk: KioskCountRow[];
  yesterdayTotal?: number;
  yesterdayByKiosk?: KioskCountRow[];
  twoDayAgoByKiosk?: KioskCountRow[];
  monthlyByKiosk?: KioskCountRow[];
  totalOutfitCount: number;
};

const KOREAN_WEEKDAYS_SHORT = ['일', '월', '화', '수', '목', '금', '토'] as const;

function readInnerPayload(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const nested = o.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return o;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function coerceKioskRow(row: unknown): KioskCountRow | null {
  if (row == null || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const count = num(r.count ?? r.total ?? r.shootingCount ?? r.shooting_count ?? r.totalCount ?? r.total_count);
  const kioskIdRaw = r.kioskId ?? r.kiosk_id ?? r.id;
  const kioskId =
    kioskIdRaw !== undefined && kioskIdRaw !== null && kioskIdRaw !== ''
      ? (kioskIdRaw as string | number)
      : String(r.kioskName ?? r.kiosk_name ?? r.name ?? count);
  const kioskName = firstString(r.kioskName, r.kiosk_name, r.name, r.branchName, r.branch_name, r.label) || `지점 #${kioskId}`;
  return { kioskId, kioskName, count };
}

function coerceKioskList(raw: unknown): KioskCountRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(coerceKioskRow).filter((row): row is KioskCountRow => row !== null);
}

function sumKioskCounts(rows: KioskCountRow[] | undefined): number {
  return (rows ?? []).reduce((sum, loc) => sum + loc.count, 0);
}

function getYesterdayKoreanWeekdayShort(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return KOREAN_WEEKDAYS_SHORT[d.getDay()] ?? '월';
}

/** Yesterday total from weekly trend (`thisWeek` for prior weekday). */
export function yesterdayTotalFromWeeklyTrend(weeklyTrend: WeeklyTrendRow[]): number | null {
  if (weeklyTrend.length === 0) return null;
  const label = getYesterdayKoreanWeekdayShort();
  const row = weeklyTrend.find((entry) => String(entry.day).trim() === label);
  if (!row) return null;
  return row.thisWeek;
}

/**
 * Resolves yesterday's shooting total from summary fields, kiosk breakdown, or weekly trend fallback.
 * Returns `null` when no baseline is available.
 */
export function resolveYesterdayTotal(
  summary: ShootingSummary | null,
  weeklyTrend: WeeklyTrendRow[] = [],
): number | null {
  if (summary != null) {
    const explicit = summary.yesterdayTotal;
    if (typeof explicit === 'number' && Number.isFinite(explicit)) {
      return explicit;
    }
    const fromKiosks = sumKioskCounts(summary.yesterdayByKiosk);
    if ((summary.yesterdayByKiosk?.length ?? 0) > 0) {
      return fromKiosks;
    }
  }

  return yesterdayTotalFromWeeklyTrend(weeklyTrend);
}

/** Normalizes `/admin/stats/summary`-style payloads (raw or `{ data }`). */
export function parseShootingSummaryPayload(raw: unknown): ShootingSummary | null {
  const inner = readInnerPayload(raw);
  if (!inner) return null;

  const yesterdayByKiosk = coerceKioskList(inner.yesterdayByKiosk ?? inner.yesterday_by_kiosk);
  const yesterdayTotalRaw = inner.yesterdayTotal ?? inner.yesterday_total;
  const yesterdayFromKiosks = sumKioskCounts(yesterdayByKiosk);
  const yesterdayTotal =
    yesterdayTotalRaw !== undefined && yesterdayTotalRaw !== null
      ? num(yesterdayTotalRaw)
      : yesterdayFromKiosks > 0 || yesterdayByKiosk.length > 0
        ? yesterdayFromKiosks
        : undefined;

  return {
    todayTotal: num(inner.todayTotal ?? inner.today_total),
    monthlyTotal: num(inner.monthlyTotal ?? inner.monthly_total),
    lastMonthTotal: num(inner.lastMonthTotal ?? inner.last_month_total),
    grandTotal: num(inner.grandTotal ?? inner.grand_total),
    todayByKiosk: coerceKioskList(inner.todayByKiosk ?? inner.today_by_kiosk),
    yesterdayTotal,
    yesterdayByKiosk: yesterdayByKiosk.length > 0 ? yesterdayByKiosk : undefined,
    twoDayAgoByKiosk: coerceKioskList(inner.twoDayAgoByKiosk ?? inner.two_day_ago_by_kiosk),
    monthlyByKiosk: coerceKioskList(inner.monthlyByKiosk ?? inner.monthly_by_kiosk),
    totalOutfitCount: num(inner.totalOutfitCount ?? inner.total_outfit_count),
  };
}
