type KioskBreakdown = { kioskName: string; count: number };

type ShootingStatApiItem = Record<string, unknown>;

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickTimeValue(item: ShootingStatApiItem, timeColumn: 'month' | 'date'): string {
  if (timeColumn === 'month') {
    const month = item.month ?? item.yearMonth ?? item.monthKey ?? item.date;
    return month == null ? '' : String(month);
  }
  const date = item.date ?? item.statDate ?? item.day ?? item.dailyDate;
  return date == null ? '' : String(date);
}

function pickTotalValue(item: ShootingStatApiItem, timeColumn: 'month' | 'date'): number {
  if (timeColumn === 'month') {
    return asFiniteNumber(item.monthlyTotal ?? item.total ?? item.totalCount ?? item.dailyTotal);
  }
  return asFiniteNumber(item.dailyTotal ?? item.total ?? item.totalCount);
}

function normalizeByKiosk(item: ShootingStatApiItem): KioskBreakdown[] {
  const list =
    item.byKiosk ??
    item.kioskBreakdown ??
    item.kioskStats ??
    item.kioskStatDtos ??
    item.byStore;

  if (Array.isArray(list)) {
    return list
      .map((entry) => {
        if (entry == null || typeof entry !== 'object') return null;
        const o = entry as Record<string, unknown>;
        const kioskName = o.kioskName ?? o.name ?? o.kiosk ?? o.storeName;
        const count = o.count ?? o.total ?? o.shootingCount ?? o.totalCount;
        if (kioskName == null || kioskName === '') return null;
        return { kioskName: String(kioskName), count: asFiniteNumber(count) };
      })
      .filter((x): x is KioskBreakdown => x !== null);
  }

  // Some APIs return object map like { "강남점": 12, "잠실점": 8 }
  if (list && typeof list === 'object') {
    return Object.entries(list as Record<string, unknown>)
      .map(([name, count]) => ({ kioskName: name, count: asFiniteNumber(count) }))
      .filter((x) => x.kioskName.trim() !== '');
  }

  return [];
}

/** Unwraps API body: supports bare array, `{ data: [] }`, or Spring-style `{ data: { content, totalPages, totalElements } }`. */
function readPaginatedShootingPayload(raw: unknown): {
  list: ShootingStatApiItem[];
  totalPages: number;
  totalElements: number;
} {
  const root = (raw as { data?: unknown } | undefined)?.data ?? raw;

  if (Array.isArray(root)) {
    const list = root as ShootingStatApiItem[];
    return { list, totalPages: 1, totalElements: list.length };
  }

  if (root && typeof root === 'object') {
    const o = root as Record<string, unknown>;
    if (Array.isArray(o.content)) {
      const list = o.content as ShootingStatApiItem[];
      const totalPages = Math.max(1, Number(o.totalPages) || 1);
      const totalElements = Number.isFinite(Number(o.totalElements))
        ? Number(o.totalElements)
        : list.length;
      return { list, totalPages, totalElements };
    }
    if (Array.isArray(o.data)) {
      const list = o.data as ShootingStatApiItem[];
      return { list, totalPages: 1, totalElements: list.length };
    }
  }

  return { list: [], totalPages: 1, totalElements: 0 };
}

/**
 * Normalizes monthly/daily shooting API payloads into table rows + dynamic kiosk column keys.
 */
export function buildShootingStatsTableModel(
  raw: unknown,
  timeColumn: 'month' | 'date',
): {
  rows: Record<string, string | number>[];
  kioskNames: string[];
  totalPages: number;
  totalElements: number;
} {
  const { list, totalPages, totalElements } = readPaginatedShootingPayload(raw);
  const kioskSet = new Set<string>();

  const rows = list.map((item) => {
    const row: Record<string, string | number> = {
      [timeColumn]: pickTimeValue(item, timeColumn),
      total: pickTotalValue(item, timeColumn),
    };
    normalizeByKiosk(item).forEach((k) => {
      row[k.kioskName] = k.count;
      kioskSet.add(k.kioskName);
    });
    return row;
  });

  const kioskNames = Array.from(kioskSet);

  return { rows, kioskNames, totalPages, totalElements };
}
