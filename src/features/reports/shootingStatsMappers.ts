type KioskBreakdown = { kioskName: string; count: number };

type ShootingStatApiItem = {
  date: string;
  dailyTotal: number;
  byKiosk?: KioskBreakdown[];
};

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
  const rows = list.map((item) => {
    const row: Record<string, string | number> = {
      [timeColumn]: item.date,
      total: item.dailyTotal,
    };
    (item.byKiosk ?? []).forEach((k) => {
      row[k.kioskName] = k.count;
    });
    return row;
  });

  const kioskNames =
    rows.length > 0 ? Object.keys(rows[0]).filter((k) => k !== timeColumn && k !== 'total') : [];

  return { rows, kioskNames, totalPages, totalElements };
}
