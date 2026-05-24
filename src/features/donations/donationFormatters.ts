export function formatIsoDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export function formatAmountOptions(amounts: number[] | null | undefined): string {
  if (!amounts?.length) return '-';
  return amounts.map((n) => `${Number(n).toLocaleString('ko-KR')}원`).join(' · ');
}

export function formatKrw(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(Number(amount))) return '-';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

type CampaignPagePayload<T> = {
  content?: T[];
  totalPages?: number;
  totalElements?: number;
};

/** Supports `data: T[]` or `data: { content, totalPages, totalElements }`. */
export function extractCampaignResult<T>(queryData: unknown, page: number, pageSize: number) {
  const inner = (queryData as { data?: T[] | CampaignPagePayload<T> } | undefined)?.data;

  if (Array.isArray(inner)) {
    const pagination = inferCampaignPagination(page, pageSize, inner.length);
    return { campaigns: inner, ...pagination };
  }

  const content = (inner?.content ?? []) as T[];
  const totalPages = Number(inner?.totalPages) > 0 ? Number(inner?.totalPages) : 1;
  const totalCount = Number.isFinite(Number(inner?.totalElements))
    ? Number(inner?.totalElements)
    : content.length;

  return { campaigns: content, totalPages, totalCount };
}

/** Campaign list API returns no totalPages — infer from page size. */
export function inferCampaignPagination(page: number, pageSize: number, itemCount: number) {
  const hasMore = itemCount >= pageSize;
  const totalPages = hasMore ? page + 1 : Math.max(1, page);
  const totalCount = hasMore ? page * pageSize + itemCount : (page - 1) * pageSize + itemCount;
  return { hasMore, totalPages, totalCount };
}
