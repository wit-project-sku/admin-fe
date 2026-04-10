/**
 * Unwraps GET-by-id responses: bare object, `{ data }`, or nested `result.data`.
 */
export function unwrapDetailBody(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  let inner: unknown = r.data ?? r.result;
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    const nested = inner as Record<string, unknown>;
    if (nested.data != null && typeof nested.data === 'object' && !Array.isArray(nested.data)) {
      return nested.data as Record<string, unknown>;
    }
    return nested as Record<string, unknown>;
  }
  return r;
}

export function pickCategoryIdForSelect(d: Record<string, unknown>): string {
  const cat = (d.category ?? d.categoryDto) as Record<string, unknown> | undefined;
  const id = cat?.id ?? d.categoryId ?? d.category_id;
  if (id === undefined || id === null || id === '') return '';
  return String(id);
}

function kioskEntryId(entry: unknown): string | number | null {
  if (entry == null || typeof entry !== 'object') return null;
  const o = entry as Record<string, unknown>;
  const kiosk = o.kiosk as Record<string, unknown> | undefined;
  const id = kiosk?.id ?? o.kioskId ?? o.kiosk_id ?? o.id;
  if (id === undefined || id === null) return null;
  return id as string | number;
}

function kioskIdsFromPrimitives(raw: unknown): (string | number)[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (typeof x === 'number' || typeof x === 'string') return x;
      return null;
    })
    .filter((x): x is string | number => x !== '' && x != null);
}

/** Reads kiosk ids: flat `kioskIds` from GET-by-id, relation arrays, or nested `kiosks` / single `kioskId`. */
export function extractKioskIdsFromDetail(d: Record<string, unknown>): (string | number)[] {
  const direct = d.kioskIds ?? d.kiosk_ids ?? d.kioskIdList ?? d.kiosk_id_list;
  const fromFlat = kioskIdsFromPrimitives(direct);
  if (fromFlat.length > 0) return fromFlat;

  const list =
    (d.kioskOutfits as unknown) ??
    (d.kioskProducts as unknown) ??
    (d.kiosk_outfits as unknown) ??
    (d.kiosk_products as unknown) ??
    (d.kiosks as unknown);
  if (Array.isArray(list) && list.length > 0) {
    const primitives = kioskIdsFromPrimitives(list);
    if (primitives.length > 0) return primitives;
    const mapped = list.map(kioskEntryId).filter((x): x is string | number => x != null);
    if (mapped.length > 0) return mapped;
  }

  const single = d.kioskId ?? d.kiosk_id;
  if (typeof single === 'number' || (typeof single === 'string' && single !== '')) {
    return [single];
  }

  return [];
}

type CategoryLike = { id?: string | number; value?: string | number; label?: string; name?: string };

/**
 * When the API omits `category.id` but sends `categoryName`, match the loaded dropdown options.
 */
export function resolveOutfitCategoryId(d: Record<string, unknown>, categories: CategoryLike[]): string {
  const direct = pickCategoryIdForSelect(d);
  if (direct) return direct;

  const cat = (d.category ?? d.categoryDto) as Record<string, unknown> | undefined;
  const name = scalarToInputString(d.categoryName ?? d.category_name ?? cat?.name).trim();
  if (!name || categories.length === 0) return '';

  const norm = (s: string) => s.trim().toLowerCase();
  const target = norm(name);

  const found = categories.find((c) => {
    const label = scalarToInputString(c.label ?? c.name).trim();
    if (label && norm(label) === target) return true;
    return false;
  });
  if (found) return String(found.id ?? found.value ?? '');

  return '';
}

/** Product GET-by-id: same as outfit when category id is missing but name exists. */
export function resolveProductCategoryId(d: Record<string, unknown>, categories: CategoryLike[]): string {
  return resolveOutfitCategoryId(d, categories);
}

export function scalarToInputString(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

export function pickOutfitCodeForInput(d: Record<string, unknown>): string {
  const v = d.outfitCode ?? d.code ?? d.outfit_code;
  return scalarToInputString(v);
}

export function normalizeProductStatus(
  raw: unknown,
  allowed: readonly string[],
  fallback: string,
): string {
  const s = typeof raw === 'string' ? raw : '';
  return allowed.includes(s) ? s : fallback;
}

export function normalizeOutfitStatus(raw: unknown): 'ACTIVE' | 'INACTIVE' {
  if (raw === 'INACTIVE' || raw === 'ACTIVE') return raw;
  return 'ACTIVE';
}
