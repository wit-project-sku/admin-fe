export type OutfitReportPanelStatus = 'idle' | 'loading' | 'error' | 'empty' | 'data';

/** One level of `{ data: T }` unwrap; `T` may be an array or a page object with `content`. */
function unwrapOutfitRankingPayload(raw: unknown): unknown {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if ('data' in o && o.data != null) return o.data;
  return raw;
}

/** Pull list from ranking-stats body: bare array, `{ data: [] }`, `{ data: { content } }`, etc. */
export function extractOutfitRankingStatsList(raw: unknown): unknown[] {
  const p = unwrapOutfitRankingPayload(raw);
  if (p == null) return [];
  if (Array.isArray(p)) return p;
  if (typeof p === 'object') {
    const o = p as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.result)) return o.result;
  }
  return [];
}

export function extractOutfitRankingPageMeta(raw: unknown): { totalPages: number; totalElements: number } {
  const p = unwrapOutfitRankingPayload(raw);
  if (p == null) return { totalPages: 1, totalElements: 0 };
  if (Array.isArray(p)) {
    return { totalPages: 1, totalElements: p.length };
  }
  if (typeof p === 'object') {
    const o = p as Record<string, unknown>;
    if (Array.isArray(o.content)) {
      const totalPages = Math.max(1, Number(o.totalPages) || 1);
      const totalElements = Number.isFinite(Number(o.totalElements))
        ? Number(o.totalElements)
        : o.content.length;
      return { totalPages, totalElements };
    }
  }
  const list = extractOutfitRankingStatsList(raw);
  return { totalPages: 1, totalElements: list.length };
}

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** Per-kiosk shot counts when the ranking API returns a breakdown (e.g. `byKiosk`). */
export type OutfitRankingKioskBreakdownEntry = {
  kioskName: string;
  kioskId?: string | number;
  count: number;
};

function normalizeRankingKioskBreakdownEntry(entry: unknown): OutfitRankingKioskBreakdownEntry | null {
  if (entry == null || typeof entry !== 'object') return null;
  const e = entry as Record<string, unknown>;
  const countRaw =
    e.count ?? e.shots ?? e.totalShots ?? e.shotCount ?? e.shootingCount ?? e.value ?? e.cumulativeShots;
  const n = typeof countRaw === 'number' ? countRaw : Number(countRaw);
  const count = Number.isFinite(n) ? Math.max(0, n) : 0;
  const kioskIdRaw = e.kioskId ?? e.kiosk_id ?? e.id;
  const kioskId =
    kioskIdRaw !== undefined && kioskIdRaw !== null && kioskIdRaw !== ''
      ? (kioskIdRaw as string | number)
      : undefined;
  const name = firstString(e.kioskName, e.kiosk_name, e.name, e.branchName, e.branch_name, e.label);
  const kioskName = name || (kioskId !== undefined ? `지점 #${kioskId}` : '지점');
  return { kioskName, kioskId, count };
}

/** Reads `byKiosk`-style arrays from a single ranking DTO. */
export function extractOutfitRankingKioskBreakdownFromDto(r: Record<string, unknown>): OutfitRankingKioskBreakdownEntry[] {
  const candidates = [
    r.byKiosk,
    r.by_kiosk,
    r.kioskBreakdown,
    r.kiosk_breakdown,
    r.kioskStats,
    r.kiosk_stats,
    r.shotsByKiosk,
    r.shots_by_kiosk,
  ];
  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    const rows = c
      .map(normalizeRankingKioskBreakdownEntry)
      .filter((x): x is OutfitRankingKioskBreakdownEntry => x != null);
    if (rows.length) return rows;
  }
  return [];
}

export function getOutfitRankingKioskBreakdown(row: Record<string, unknown>): OutfitRankingKioskBreakdownEntry[] {
  const k = row.kioskBreakdown;
  if (!Array.isArray(k)) return [];
  return k
    .map((entry) => normalizeRankingKioskBreakdownEntry(entry))
    .filter((x): x is OutfitRankingKioskBreakdownEntry => x != null);
}

/** Map one ranking-stats DTO to the row shape used by report cards/table. */
export function mapOutfitRankingStatItemToRow(item: unknown): Record<string, unknown> | null {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  const id = r.id ?? r.outfitId ?? r.outfit_id;
  if (id === undefined || id === null || id === '') return null;

  const name = firstString(r.name, r.outfitName, r.outfit_name) || '-';
  const categoryName =
    firstString(r.categoryName, r.category_name) ||
    (typeof r.category === 'string' ? r.category : '') ||
    '-';

  const shots =
    r.totalShots ??
    r.shotCount ??
    r.total_shots ??
    r.shootCount ??
    r.cumulativeShots ??
    r.photoCount ??
    r.shootingCount;

  const code = firstString(r.code, r.outfitCode, r.outfit_code);
  let imageUrl = firstString(
    r.imageUrl,
    r.image_url,
    r.thumbnailUrl,
    r.thumbnail_url,
    r.previewUrl,
    r.preview_url,
  );

  const images = r.images;
  if (!imageUrl && Array.isArray(images) && images[0] && typeof images[0] === 'object' && images[0] !== null) {
    const first = images[0] as Record<string, unknown>;
    imageUrl = firstString(first.imageUrl, first.url, first.image_url);
  }

  const row: Record<string, unknown> = {
    id,
    name,
    categoryName,
  };

  if (shots !== undefined && shots !== null && shots !== '') {
    const n = typeof shots === 'number' ? shots : Number(shots);
    if (Number.isFinite(n)) row.totalShots = n;
  }
  if (code) row.code = code;
  if (imageUrl) row.imageUrl = imageUrl;

  const stock = r.stock;
  if (stock !== undefined && stock !== null && row.totalShots === undefined) {
    const s = typeof stock === 'number' ? stock : Number(stock);
    if (Number.isFinite(s)) row.stock = s;
  }

  const kioskBreakdown = extractOutfitRankingKioskBreakdownFromDto(r);
  if (kioskBreakdown.length) row.kioskBreakdown = kioskBreakdown;

  const kids = r.kioskIds ?? r.kiosk_ids;
  if (Array.isArray(kids) && kids.every((x) => typeof x === 'number' || typeof x === 'string')) {
    row.kioskIds = kids as (string | number)[];
  }

  const desc = firstString(r.description, r.memo, r.note, r.remark);
  if (desc) row.description = desc;

  return row;
}

export function mapOutfitRankingStatsResponse(raw: unknown): Record<string, unknown>[] {
  return extractOutfitRankingStatsList(raw)
    .map(mapOutfitRankingStatItemToRow)
    .filter((row): row is Record<string, unknown> => row != null);
}

export function parseOutfitRankingStatsResponse(raw: unknown): {
  rows: Record<string, unknown>[];
  totalPages: number;
  totalElements: number;
} {
  const rows = mapOutfitRankingStatsResponse(raw);
  const { totalPages, totalElements } = extractOutfitRankingPageMeta(raw);
  return { rows, totalPages, totalElements };
}

/** Resolve cumulative shots from API when backend adds fields; fallback uses stock for ordering until then. */
export function getOutfitTotalShots(o: Record<string, unknown>): number {
  const candidates = [o.totalShots, o.shootCount, o.cumulativeShots, o.shootingCount, o.photoCount];
  for (const v of candidates) {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  }
  const stock = o.stock;
  const s = typeof stock === 'number' ? stock : typeof stock === 'string' ? Number(stock) : 0;
  return Number.isFinite(s) ? s : 0;
}

export function outfitMatchesKiosk(o: Record<string, unknown>, kioskId: string): boolean {
  if (!kioskId) return true;
  const ids = o.kioskIds;
  if (!Array.isArray(ids)) return false;
  return ids.map(String).includes(String(kioskId));
}

export function getOutfitDisplayCode(o: Record<string, unknown>): string {
  const code = o.code ?? o.outfitCode;
  if (typeof code === 'string' && code.trim()) return code.trim();
  const cat = typeof o.categoryName === 'string' ? o.categoryName : 'OUT';
  const prefix = cat.slice(0, 1).toUpperCase();
  const id = o.id ?? '';
  return `${prefix}-${String(id).padStart(2, '0')}`;
}

export function sortOutfitsByPopular(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const list = [...rows];
  list.sort((a, b) => {
    const diff = getOutfitTotalShots(b) - getOutfitTotalShots(a);
    if (diff !== 0) return diff;
    return Number(a.id) - Number(b.id);
  });
  return list;
}

export function sortOutfitsByNumber(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const list = [...rows];
  list.sort((a, b) => Number(a.id) - Number(b.id));
  return list;
}

export function assignShotRanks(rows: Record<string, unknown>[]): Map<string, number> {
  const rankMap = new Map<string, number>();
  let prevShots: number | null = null;
  let rank = 0;
  for (let i = 0; i < rows.length; i++) {
    const shots = getOutfitTotalShots(rows[i]!);
    if (prevShots === null || shots !== prevShots) {
      rank = i + 1;
      prevShots = shots;
    }
    rankMap.set(String(rows[i]!.id), rank);
  }
  return rankMap;
}

export function downloadOutfitCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const headerLine = headers.map((h) => esc(String(h))).join(',');
  const lines = [headerLine, ...rows.map((r) => r.map((c) => esc(String(c))).join(','))];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getOutfitPreviewUrl(o: Record<string, unknown>): string {
  const url = o.imageUrl;
  if (typeof url === 'string' && url) return url;
  const images = o.images;
  if (Array.isArray(images) && images[0] && typeof images[0] === 'object' && images[0] !== null) {
    const first = images[0] as Record<string, unknown>;
    const u = first.imageUrl ?? first.url;
    if (typeof u === 'string') return u;
  }
  return '';
}
