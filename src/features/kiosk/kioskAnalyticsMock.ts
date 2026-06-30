/** Deterministic pseudo-random in [0, 1) from string seed. */
export function unitFromSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

export type KioskLocation = { id: string; name: string; region: string };
export type KioskDevice = { id: string; name: string; locationId: string };
export type KioskAppDef = {
  id: string;
  name: string;
  category: string;
  themeColor: string;
};

export type DatePreset = 'today' | '7d' | '30d' | 'custom';

export type AnalyticsFilters = {
  preset: DatePreset;
  customStart: string;
  customEnd: string;
  /** City filter → `city` query (kiosks / stats / buttons). */
  city: string;
  /** Selected kiosk id (string form of int from API). */
  kioskId: string;
  /** Button type label → `buttonType` query (e.g. 화장실). */
  buttonType: string;
};

export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export type MatrixAgg = { clicks: number; usageMs: number; sessions: number };

const DAY_MS = 86400000;

export function toDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ymd(d: Date): string {
  return toDateYmd(d);
}

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function getDateRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
  now = new Date(),
): { start: Date; end: Date } {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { start, end };
  }
  if (preset === '7d') {
    const start = new Date(end.getTime() - 6 * DAY_MS);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (preset === '30d') {
    const start = new Date(end.getTime() - 29 * DAY_MS);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  const a = parseYmd(customStart) ?? new Date(end.getTime() - 29 * DAY_MS);
  const b = parseYmd(customEnd) ?? end;
  const start = a <= b ? a : b;
  const endDay = a <= b ? b : a;
  endDay.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  return { start, end: endDay };
}

export function buildMockWorld() {
  const locations: KioskLocation[] = Array.from({ length: 18 }, (_, i) => ({
    id: `loc-${i + 1}`,
    name: ['강남', '홍대', '잠실', '송도', '부산 센텀', '대구 동성로', '광주 충장로', '제주', '판교', '분당', '수원', '인천', '대전', '울산', '창원', '청주', '전주', '포항'][i] ?? `지점 ${i + 1}`,
    region: ['서울', '서울', '서울', '인천', '부산', '대구', '광주', '제주', '경기', '경기', '경기', '인천', '대전', '울산', '경남', '충북', '전북', '경북'][i] ?? '기타',
  }));

  const kiosks: KioskDevice[] = Array.from({ length: 120 }, (_, i) => {
    const locationId = locations[i % locations.length].id;
    return {
      id: `kiosk-${i + 1}`,
      name: `키오스크 ${String(i + 1).padStart(3, '0')}`,
      locationId,
    };
  });

  const apps: KioskAppDef[] = [
    { id: 'app-map', name: '지도', category: 'Map', themeColor: '#2563eb' },
    { id: 'app-shops', name: '쇼핑', category: 'Shop', themeColor: '#7c3aed' },
    { id: 'app-food', name: '맛집', category: 'Restaurant', themeColor: '#ea580c' },
    { id: 'app-events', name: '이벤트', category: 'Info', themeColor: '#db2777' },
    { id: 'app-transit', name: '교통', category: 'Transit', themeColor: '#0d9488' },
    { id: 'app-parking', name: '주차', category: 'Service', themeColor: '#4f46e5' },
    { id: 'app-guide', name: '안내', category: 'Info', themeColor: '#64748b' },
    { id: 'app-culture', name: '문화', category: 'Culture', themeColor: '#b45309' },
    { id: 'app-health', name: '헬스', category: 'Service', themeColor: '#15803d' },
    { id: 'app-kids', name: '키즈', category: 'Family', themeColor: '#ca8a04' },
    { id: 'app-deals', name: '할인', category: 'Shop', themeColor: '#be123c' },
    { id: 'app-feedback', name: '의견', category: 'Service', themeColor: '#475569' },
  ];

  /** Per kiosk × app baseline (scaled by date range in aggregates). */
  const cellKey = (kioskId: string, appId: string) => `${kioskId}::${appId}`;
  const cells = new Map<string, MatrixAgg>();

  for (const k of kiosks) {
    for (const a of apps) {
      const u1 = unitFromSeed(cellKey(k.id, a.id));
      const u2 = unitFromSeed(`${a.id}|${k.id}`);
      const u3 = unitFromSeed(`${k.id}|${a.id}|sessions`);
      const popularity = 0.35 + u1 * 1.4;
      const clicks = Math.round(80 * popularity * (0.4 + u2));
      const sessions = Math.max(1, Math.round(clicks * (0.55 + u3 * 0.35)));
      const usageMs = Math.round(clicks * (45000 + unitFromSeed(`ms|${cellKey(k.id, a.id)}`) * 120000));
      cells.set(cellKey(k.id, a.id), { clicks, usageMs, sessions });
    }
  }

  /** Daily shape for trends (fleet totals); scaled when filtering. */
  const trendDays = 120;
  const today = new Date();
  const dailyFleet: { date: string; weight: number }[] = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i, 12, 0, 0, 0);
    const w = 0.55 + unitFromSeed(`dayw|${ymd(d)}`) * 0.9;
    dailyFleet.push({ date: ymd(d), weight: w });
  }

  return { locations, kiosks, apps, cells, dailyFleet };
}

export type MockWorld = ReturnType<typeof buildMockWorld>;

function addAgg(a: MatrixAgg, b: MatrixAgg): MatrixAgg {
  return {
    clicks: a.clicks + b.clicks,
    usageMs: a.usageMs + b.usageMs,
    sessions: a.sessions + b.sessions,
  };
}

function scaleAgg(a: MatrixAgg, factor: number): MatrixAgg {
  if (factor <= 0) return { clicks: 0, usageMs: 0, sessions: 0 };
  return {
    clicks: Math.max(0, Math.round(a.clicks * factor)),
    usageMs: Math.max(0, Math.round(a.usageMs * factor)),
    sessions: Math.max(0, Math.round(a.sessions * factor)),
  };
}

function rangeDayCount(start: Date, end: Date): number {
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.max(1, Math.round((e - s) / DAY_MS) + 1);
}

/** Buckets trend series from the active date range (no separate day/week/month control). */
function trendGranularityFromDayCount(daysInRange: number): TrendGranularity {
  if (daysInRange <= 14) return 'daily';
  if (daysInRange <= 90) return 'weekly';
  return 'monthly';
}

export type AnalyticsModel = {
  totalClicks: number;
  totalUsageMs: number;
  totalSessions: number;
  avgSessionMs: number;
  activeKiosks: number;
  byApp: Array<{ app: KioskAppDef; agg: MatrixAgg }>;
  byKiosk: Array<{ kiosk: KioskDevice; location: KioskLocation; agg: MatrixAgg }>;
  byLocation: Array<{ location: KioskLocation; agg: MatrixAgg }>;
  trend: Array<{ label: string; clicks: number; usageMs: number }>;
  appTableRows: Array<{
    app: KioskAppDef;
    agg: MatrixAgg;
    avgSessionMs: number;
    topLocation: KioskLocation;
    topKiosk: KioskDevice;
  }>;
};

export function computeAnalytics(world: MockWorld, filters: AnalyticsFilters): AnalyticsModel {
  const { start, end } = getDateRange(filters.preset, filters.customStart, filters.customEnd);
  const daysInRange = rangeDayCount(start, end);
  const trendGranularity = trendGranularityFromDayCount(daysInRange);
  const refDays = 30;
  const dateFactor = Math.min(1.2, Math.max(0.08, daysInRange / refDays));

  const locMap = new Map(world.locations.map((l) => [l.id, l]));

  let kFiltered = world.kiosks;
  const cityF = filters.city?.trim().toLowerCase();
  if (cityF) {
    kFiltered = kFiltered.filter((k) => {
      const loc = locMap.get(k.locationId);
      return (
        loc?.region?.toLowerCase().includes(cityF) ||
        loc?.name?.toLowerCase().includes(cityF) ||
        k.name.toLowerCase().includes(cityF)
      );
    });
  }
  if (filters.kioskId) kFiltered = kFiltered.filter((k) => k.id === filters.kioskId);

  const sumForKioskApp = (kioskId: string, appId: string): MatrixAgg => {
    const key = `${kioskId}::${appId}`;
    const base = world.cells.get(key) ?? { clicks: 0, usageMs: 0, sessions: 0 };
    return scaleAgg(base, dateFactor);
  };

  const byAppMap = new Map<string, MatrixAgg>();
  const btn = filters.buttonType?.trim().toLowerCase();
  for (const a of world.apps) {
    if (btn && !a.name.toLowerCase().includes(btn) && !a.category.toLowerCase().includes(btn)) continue;
    let acc: MatrixAgg = { clicks: 0, usageMs: 0, sessions: 0 };
    for (const k of kFiltered) {
      acc = addAgg(acc, sumForKioskApp(k.id, a.id));
    }
    byAppMap.set(a.id, acc);
  }

  const byApp = world.apps
    .filter((a) => !btn || a.name.toLowerCase().includes(btn) || a.category.toLowerCase().includes(btn))
    .map((app) => ({ app, agg: byAppMap.get(app.id) ?? { clicks: 0, usageMs: 0, sessions: 0 } }));

  const byKiosk = kFiltered.map((kiosk) => {
    let acc: MatrixAgg = { clicks: 0, usageMs: 0, sessions: 0 };
    for (const a of world.apps) {
      if (btn && !a.name.toLowerCase().includes(btn) && !a.category.toLowerCase().includes(btn)) continue;
      acc = addAgg(acc, sumForKioskApp(kiosk.id, a.id));
    }
    const location = locMap.get(kiosk.locationId)!;
    return { kiosk, location, agg: acc };
  });

  const locAgg = new Map<string, MatrixAgg>();
  for (const row of byKiosk) {
    const prev = locAgg.get(row.kiosk.locationId) ?? { clicks: 0, usageMs: 0, sessions: 0 };
    locAgg.set(row.kiosk.locationId, addAgg(prev, row.agg));
  }

  const byLocation = world.locations
    .map((location) => ({
      location,
      agg: locAgg.get(location.id) ?? { clicks: 0, usageMs: 0, sessions: 0 },
    }))
    .filter((row) => row.agg.clicks > 0)
    .sort((a, b) => b.agg.clicks - a.agg.clicks);

  let totalClicks = 0;
  let totalUsageMs = 0;
  let totalSessions = 0;
  for (const { agg } of byApp) {
    totalClicks += agg.clicks;
    totalUsageMs += agg.usageMs;
    totalSessions += agg.sessions;
  }

  const avgSessionMs = totalSessions > 0 ? totalUsageMs / totalSessions : 0;
  const activeKiosks = byKiosk.filter((r) => r.agg.clicks > 0).length;

  /** Per-app top location / kiosk for table */
  const appTableRows = byApp.map(({ app, agg }) => {
    const perK: { kiosk: KioskDevice; location: KioskLocation; agg: MatrixAgg }[] = [];
    for (const k of kFiltered) {
      const a = sumForKioskApp(k.id, app.id);
      if (a.clicks > 0) perK.push({ kiosk: k, location: locMap.get(k.locationId)!, agg: a });
    }
    perK.sort((a, b) => b.agg.clicks - a.agg.clicks);
    const topKiosk = perK[0]?.kiosk ?? kFiltered[0];
    const byLocClicks = new Map<string, number>();
    for (const row of perK) {
      byLocClicks.set(row.location.id, (byLocClicks.get(row.location.id) ?? 0) + row.agg.clicks);
    }
    let topLocation = world.locations[0];
    let maxLoc = 0;
    for (const [lid, c] of byLocClicks) {
      if (c > maxLoc) {
        maxLoc = c;
        topLocation = locMap.get(lid)!;
      }
    }
    const avgS = agg.sessions > 0 ? agg.usageMs / agg.sessions : 0;
    return { app, agg, avgSessionMs: avgS, topLocation, topKiosk };
  });

  /** Trend: weight daily fleet by filtered kiosk share + optional app */
  const fleetWeight =
    kFiltered.length > 0 ? kFiltered.length / world.kiosks.length : 1;
  const appWeight = filters.buttonType ? 0.22 + unitFromSeed(filters.buttonType) * 0.5 : 1;

  const inRange = world.dailyFleet.filter((d) => {
    const t = parseYmd(d.date);
    return t != null && t >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && t <= end;
  });

  const bucketTrend = (): Array<{ label: string; clicks: number; usageMs: number }> => {
    if (trendGranularity === 'daily') {
      return inRange.map((d) => {
        const baseClicks = Math.round(4200 * d.weight * dateFactor * fleetWeight * appWeight);
        const baseMs = Math.round(baseClicks * (38000 + unitFromSeed(`trend|${d.date}`) * 70000));
        return { label: d.date.slice(5), clicks: baseClicks, usageMs: baseMs };
      });
    }
    if (trendGranularity === 'weekly') {
      const buckets: Array<{ label: string; clicks: number; usageMs: number }> = [];
      for (let i = 0; i < inRange.length; i += 7) {
        const chunk = inRange.slice(i, i + 7);
        if (chunk.length === 0) break;
        const clicks = chunk.reduce(
          (s, d) => s + Math.round(4200 * d.weight * dateFactor * fleetWeight * appWeight),
          0,
        );
        const usageMs = chunk.reduce(
          (s, d) =>
            s +
            Math.round(
              Math.round(4200 * d.weight * dateFactor * fleetWeight * appWeight) *
                (38000 + unitFromSeed(`trend|${d.date}`) * 70000),
            ),
          0,
        );
        buckets.push({ label: `W${buckets.length + 1}`, clicks, usageMs });
      }
      return buckets;
    }
    const monthMap = new Map<string, { clicks: number; usageMs: number }>();
    for (const d of inRange) {
      const t = parseYmd(d.date);
      if (!t) continue;
      const mk = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
      const c = Math.round(4200 * d.weight * dateFactor * fleetWeight * appWeight);
      const ms = Math.round(c * (38000 + unitFromSeed(`trend|${d.date}`) * 70000));
      const prev = monthMap.get(mk) ?? { clicks: 0, usageMs: 0 };
      monthMap.set(mk, { clicks: prev.clicks + c, usageMs: prev.usageMs + ms });
    }
    return [...monthMap.entries()].map(([label, v]) => ({ label, clicks: v.clicks, usageMs: v.usageMs }));
  };

  const trend = bucketTrend();

  return {
    totalClicks,
    totalUsageMs,
    totalSessions,
    avgSessionMs,
    activeKiosks,
    byApp: [...byApp].sort((a, b) => b.agg.clicks - a.agg.clicks),
    byKiosk: [...byKiosk].sort((a, b) => b.agg.clicks - a.agg.clicks).slice(0, 24),
    byLocation: byLocation.slice(0, 12),
    trend,
    appTableRows,
  };
}

export type KioskMockWorld = ReturnType<typeof buildMockWorld>;
