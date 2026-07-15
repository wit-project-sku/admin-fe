import type { CampaignAmountOption } from '../../hooks/donation-api/donationApiTypes';

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

export function formatKrw(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(Number(amount))) return '-';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

export function formatAmountOptions(options: CampaignAmountOption[] | null | undefined): string {
  if (!options?.length) return '-';
  return options.map((opt) => formatKrw(opt.amount)).join(' · ');
}

/** 응답 금액 프리셋(`[{amount}]`)을 오름차순 정수 배열로 변환. */
export function amountOptionsToNumbers(options: CampaignAmountOption[] | null | undefined): number[] {
  if (!options?.length) return [];
  return options
    .map((opt) => Number(opt.amount))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

/** 테이블/칩용 간결 금액 표기: 10000→1만, 5000→5천, 그 외 원 단위. */
export function formatAmountShort(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '-';
  if (n >= 10000) {
    const man = n / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  if (n >= 1000) {
    const cheon = n / 1000;
    return `${Number.isInteger(cheon) ? cheon : cheon.toFixed(1)}천`;
  }
  return n.toLocaleString('ko-KR');
}

export function formatCampaignProgress(
  accumulated: number | null | undefined,
  target: number | null | undefined,
): string {
  const acc = Number(accumulated);
  const tgt = Number(target);
  if (!Number.isFinite(acc) || !Number.isFinite(tgt) || tgt <= 0) return '-';
  const pct = Math.min(100, Math.round((acc / tgt) * 100));
  return `${pct}%`;
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
