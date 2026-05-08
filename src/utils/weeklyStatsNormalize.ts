export type WeeklyTrendRow = { day: string; thisWeek: number; lastWeek: number };

export type MarketShareRow = { name: string; value: number; count: number };

export type NormalizedWeeklyStats = {
  todayTotal: number;
  monthlyTotal: number;
  grandTotal: number;
  /** From `/admin/stats/total` — 오늘 촬영 수 카드 하단 분해 */
  todayMainCameraClicks: number;
  todaySoloClicks: number;
  todayTogetherClicks: number;
  weeklyTrend: WeeklyTrendRow[];
  marketShare: MarketShareRow[];
};

/** Pie chart segment after assigning colors to market-share rows. */
export type DashboardPieSlice = { name: string; value: number; count: number; color: string };

const PIE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#6366f1', '#8b5cf6', '#a78bfa'];

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

function coerceTrendRow(row: unknown): WeeklyTrendRow | null {
  if (row == null || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const day = String(r.day ?? r.label ?? r.weekday ?? '').trim();
  if (!day) return null;
  return {
    day,
    thisWeek: num(r.thisWeek ?? r.this_week),
    lastWeek: num(r.lastWeek ?? r.last_week),
  };
}

function coerceMarketRow(row: unknown): MarketShareRow | null {
  if (row == null || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const kioskObj = r.kiosk;
  const nested =
    kioskObj != null && typeof kioskObj === 'object' && !Array.isArray(kioskObj)
      ? (kioskObj as Record<string, unknown>)
      : null;
  const name = String(
    r.name ??
      r.label ??
      r.kioskName ??
      r.kiosk_name ??
      r.branchName ??
      r.branch_name ??
      r.title ??
      nested?.name ??
      nested?.label ??
      '',
  ).trim();
  const value = num(r.value ?? r.count ?? r.share ?? r.shots ?? r.total);
  return { name: name || '기타', value: Math.max(0, value), count: num(r.count ?? r.value ?? r.shots ?? r.total) };
}

export function emptyWeeklyStats(): NormalizedWeeklyStats {
  return {
    todayTotal: 0,
    monthlyTotal: 0,
    grandTotal: 0,
    todayMainCameraClicks: 0,
    todaySoloClicks: 0,
    todayTogetherClicks: 0,
    weeklyTrend: [],
    marketShare: [],
  };
}

/**
 * Normalizes `/admin/stats/total` (bare or `{ data }`, camelCase or snake_case).
 */
export function normalizeWeeklyStatsPayload(raw: unknown): NormalizedWeeklyStats | null {
  const inner = readInnerPayload(raw);
  if (!inner) return null;

  const trendRaw = inner.weeklyTrend ?? inner.weekly_trend;
  const marketRaw = inner.marketShare ?? inner.market_share;

  const weeklyTrend = Array.isArray(trendRaw) ? (trendRaw.map(coerceTrendRow).filter(Boolean) as WeeklyTrendRow[]) : [];

  const marketShare = Array.isArray(marketRaw)
    ? (marketRaw.map(coerceMarketRow).filter(Boolean) as MarketShareRow[])
    : [];

  return {
    todayTotal: num(inner.todayTotal ?? inner.today_total),
    monthlyTotal: num(inner.monthlyTotal ?? inner.monthly_total),
    grandTotal: num(inner.grandTotal ?? inner.grand_total),
    todayMainCameraClicks: num(inner.todayMainCameraClicks ?? inner.today_main_camera_clicks),
    todaySoloClicks: num(inner.todaySoloClicks ?? inner.today_solo_clicks),
    todayTogetherClicks: num(inner.todayTogetherClicks ?? inner.today_together_clicks),
    weeklyTrend,
    marketShare,
  };
}

export function marketShareToPieSlices(share: MarketShareRow[]): DashboardPieSlice[] {
  return share.map((item, i) => ({
    name: item.name,
    value: item.value,
    count: item.count,
    color: PIE_COLORS[i % PIE_COLORS.length]!,
  }));
}
