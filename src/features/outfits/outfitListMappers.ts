import { pickOperationEndFromDetail, pickOperationStartFromDetail } from '../../utils/outfitScheduleUtils';

function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

function kioskIdsFromOutfit(o: Record<string, unknown>): (string | number)[] {
  const direct = o.kioskIds;
  if (Array.isArray(direct)) {
    return direct.filter((x) => x != null && x !== '') as (string | number)[];
  }
  const rel =
    (o.kioskOutfits as unknown[]) ??
    (o.kiosk_outfits as unknown[]) ??
    (o.kioskProducts as unknown[]) ??
    [];
  if (!Array.isArray(rel)) return [];
  return rel
    .map((entry) => {
      if (entry == null || typeof entry !== 'object') return null;
      const r = entry as Record<string, unknown>;
      const k = r.kiosk as Record<string, unknown> | undefined;
      const id = k?.id ?? r.kioskId ?? r.kiosk_id ?? r.id;
      return id != null && id !== '' ? id : null;
    })
    .filter((x): x is string | number => x != null);
}

export type OutfitRow = {
  id: number | string;
  outfitCode: string;
  name: string;
  displayName: string;
  categoryName: string;
  /** 의상 유형(NORMAL | PREMIUM | SCHOOL_UNIFORM). */
  type: string;
  /** 교복일 때 학교명(그 외 빈 문자열). */
  schoolName: string;
  imageUrl?: string;
  images?: { imageUrl?: string }[];
  kioskIds: (string | number)[];
  status: string;
  /** YYYY-MM-DD or empty */
  operationStartYmd: string;
  operationEndYmd: string;
};

export function mapOutfitListItemToRow(raw: unknown): OutfitRow {
  if (raw == null || typeof raw !== 'object') {
    return {
      id: '',
      outfitCode: '-',
      name: '',
      displayName: '-',
      categoryName: '-',
      type: 'NORMAL',
      schoolName: '',
      kioskIds: [],
      status: 'INACTIVE',
      operationStartYmd: '',
      operationEndYmd: '',
    };
  }
  const o = raw as Record<string, unknown>;
  const id = o.id ?? o.outfitId ?? '';
  const outfitCode = firstStr(o.outfitCode, o.code, o.outfit_code) || '-';
  const name = firstStr(o.name, o.title, o.outfitName, o.outfit_name);
  const type = firstStr(o.type) || 'NORMAL';
  const schoolName = firstStr(o.schoolName, o.school_name);
  const cat = o.category as Record<string, unknown> | undefined;
  const categoryName = firstStr(cat?.name, o.categoryName, o.category_name) || '-';

  let imageUrl: string | undefined;
  const topImg = o.imageUrl ?? o.image_url;
  if (typeof topImg === 'string' && topImg) imageUrl = topImg;

  let images: { imageUrl?: string }[] | undefined;
  const rawImages = o.images;
  if (Array.isArray(rawImages)) {
    images = rawImages.map((item) => {
      if (!item || typeof item !== 'object') return {};
      const im = item as Record<string, unknown>;
      const u = im.imageUrl ?? im.url ?? im.image_url;
      return { imageUrl: typeof u === 'string' ? u : undefined };
    });
    if (!imageUrl && images[0]?.imageUrl) imageUrl = images[0].imageUrl;
  }

  const status = typeof o.status === 'string' ? o.status : 'INACTIVE';
  const kioskIds = kioskIdsFromOutfit(o);
  const displayName = name || outfitCode || String(id);
  const operationStartYmd = pickOperationStartFromDetail(o);
  const operationEndYmd = pickOperationEndFromDetail(o);

  return {
    id,
    outfitCode,
    name,
    displayName,
    categoryName,
    type,
    schoolName,
    imageUrl,
    images,
    kioskIds,
    status,
    operationStartYmd,
    operationEndYmd,
  };
}
