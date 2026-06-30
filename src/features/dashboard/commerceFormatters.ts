import s from './DashboardCommerceOverview.module.css';
import { FALLBACK_PIE_PALETTE, ORDER_STATUS_BADGE, ORDER_STATUS_COLORS } from './commerceConstants';
import type { ShopOrderStatusSlice } from '../../hooks/payment-api/useGetShopStatsSummary';

export const krw = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** Abbreviates KRW values for chart Y-axis ticks (e.g. 12,340 → `1.2만`). */
export const compactKrw = (n: number) => {
  if (n >= 10_000) return `${(n / 10_000).toFixed(n % 10_000 === 0 ? 0 : 1)}만`;
  return n.toLocaleString('ko-KR');
};

export function pieColor(slice: ShopOrderStatusSlice, index: number) {
  return ORDER_STATUS_COLORS[slice.status] ?? FALLBACK_PIE_PALETTE[index % FALLBACK_PIE_PALETTE.length]!;
}

/** `orderedAt` (ISO) → human-relative when recent, else `YYYY.MM.DD`. */
export function formatOrderedAt(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}일 전`;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function orderBadgeClass(status: string | null | undefined) {
  const cls = status ? ORDER_STATUS_BADGE[status] : undefined;
  return `${s.badge} ${s[cls ?? 'badgeBlue']}`;
}
