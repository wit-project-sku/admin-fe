function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

export type ShopRow = {
  id: number | string;
  kioskId?: number | string;
  name: string;
  category?: string;
  address?: string;
  tel?: string;
  imageUrl?: string;
  imageCount: number;
  /**
   * 전체 상점 응답 원본. 관리자 단건 조회 API가 없어 목록 응답(ShopResponse 전체)을
   * 그대로 보관했다가 수정 폼을 채우는 데 사용한다.
   */
  raw: Record<string, unknown>;
};

export function mapShopListItemToRow(raw: unknown): ShopRow {
  if (raw == null || typeof raw !== 'object') {
    return { id: '', name: '-', imageCount: 0, raw: {} };
  }
  const o = raw as Record<string, unknown>;

  const id = (o.id ?? o.shopId ?? '') as number | string;
  const kioskId = (o.kioskId ?? o.kiosk_id) as number | string | undefined;
  const name = firstStr(o.shopNameKr, o.shopName, o.name) || '-';

  const base = firstStr(o.baseCategoryKr);
  const second = firstStr(o.secondCategoryKr);
  const category = [base, second].filter(Boolean).join(' / ') || undefined;

  const address = firstStr(o.addressKr) || undefined;
  const tel = firstStr(o.tel) || undefined;

  const images: { imageUrl?: string }[] = Array.isArray(o.images)
    ? o.images.map((im) => {
        if (!im || typeof im !== 'object') return {};
        const x = im as Record<string, unknown>;
        const u = x.imageUrl ?? x.url ?? x.image_url;
        return { imageUrl: typeof u === 'string' ? u : undefined };
      })
    : [];
  const imageUrl = images.find((im) => im.imageUrl)?.imageUrl;
  const imageCount = images.filter((im) => im.imageUrl).length;

  return {
    id,
    kioskId,
    name,
    category,
    address,
    tel,
    imageUrl,
    imageCount,
    raw: o,
  };
}
