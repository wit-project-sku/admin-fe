/** Shared constants for the e-commerce dashboard tab. */

export const COMMERCE_CHART_ACCENT = '#2563eb';
export const COMMERCE_CHART_COMPARE = '#94a3b8';

export const ORDER_STATUS_COLORS: Record<string, string> = {
  결제완료: '#3b82f6',
  배송준비: '#eab308',
  배송중: '#a855f7',
  배송완료: '#22c55e',
  취소: '#ef4444',
  환불: '#ef4444',
  '취소/환불': '#ef4444',
  환불요청: '#ef4444',
  환불완료: '#ef4444',
};

export const FALLBACK_PIE_PALETTE = [
  '#3b82f6',
  '#eab308',
  '#a855f7',
  '#22c55e',
  '#ef4444',
  '#06b6d4',
  '#f97316',
];

/** Maps Korean status → CSS class suffix in `DashboardCommerceOverview.module.css`. */
export const ORDER_STATUS_BADGE: Record<string, string> = {
  결제완료: 'badgeBlue',
  배송준비: 'badgeAmber',
  배송중: 'badgePurple',
  배송완료: 'badgeGreen',
  환불완료: 'badgeRed',
  환불요청: 'badgeRed',
  '취소/환불': 'badgeRed',
  취소: 'badgeRed',
};

export const ORDERS_PAGE_SIZE = 10;
export const ORDERS_TABLE_COLS = 5;
export const CUMULATIVE_DEFAULT_RANGE_DAYS = 40;
