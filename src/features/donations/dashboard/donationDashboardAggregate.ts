import type { DonationHistoryItem } from '../../../hooks/donation-api/useGetDonationHistory';

/** 완료로 집계할 결제 상태(대기·실패·취소는 제외). */
const PAID_STATUSES = new Set(['PAID', 'COMPLETED']);

export const isPaidHistory = (item: DonationHistoryItem): boolean => PAID_STATUSES.has(item.status);

const amountOf = (item: DonationHistoryItem): number => {
  const n = Number(item.totalAmount);
  return Number.isFinite(n) ? n : 0;
};

const ymdLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const sumPaid = (items: DonationHistoryItem[]): number =>
  items.reduce((acc, it) => (isPaidHistory(it) ? acc + amountOf(it) : acc), 0);

export const countPaid = (items: DonationHistoryItem[]): number =>
  items.reduce((acc, it) => (isPaidHistory(it) ? acc + 1 : acc), 0);

/** 고유 기부자 수(이름 기준 근사치). */
export const countUniqueDonors = (items: DonationHistoryItem[]): number => {
  const names = new Set<string>();
  for (const it of items) {
    if (isPaidHistory(it) && it.donatorName) names.add(it.donatorName);
  }
  return names.size;
};

export type TrendPoint = { date: string; label: string; amount: number; count: number };

/** 완료 기부를 일자별로 합산해 오늘 기준 최근 `days`일 연속 축으로 반환. */
export const buildDailyTrend = (items: DonationHistoryItem[], days = 30): TrendPoint[] => {
  const bucket = new Map<string, { amount: number; count: number }>();
  for (const it of items) {
    if (!isPaidHistory(it) || !it.donatedAt) continue;
    const d = new Date(it.donatedAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = ymdLocal(d);
    const cur = bucket.get(key) ?? { amount: 0, count: 0 };
    cur.amount += amountOf(it);
    cur.count += 1;
    bucket.set(key, cur);
  }

  const out: TrendPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = ymdLocal(d);
    const entry = bucket.get(key) ?? { amount: 0, count: 0 };
    out.push({ date: key, label: `${d.getMonth() + 1}.${d.getDate()}`, amount: entry.amount, count: entry.count });
  }
  return out;
};

export type DonationSlice = { key: string; label: string; amount: number; count: number };

/** NGO(캠페인) vs 학교 기부 비중 — 금액·건수. */
export const buildTypeSplit = (items: DonationHistoryItem[]): DonationSlice[] => {
  const acc: Record<'CAMPAIGN' | 'SCHOOL', { amount: number; count: number }> = {
    CAMPAIGN: { amount: 0, count: 0 },
    SCHOOL: { amount: 0, count: 0 },
  };
  for (const it of items) {
    if (!isPaidHistory(it)) continue;
    const type = it.targetType === 'SCHOOL' ? 'SCHOOL' : 'CAMPAIGN';
    acc[type].amount += amountOf(it);
    acc[type].count += 1;
  }
  return [
    { key: 'CAMPAIGN', label: 'NGO 기부', amount: acc.CAMPAIGN.amount, count: acc.CAMPAIGN.count },
    { key: 'SCHOOL', label: '학교 기부', amount: acc.SCHOOL.amount, count: acc.SCHOOL.count },
  ].filter((slice) => slice.amount > 0 || slice.count > 0);
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CARD: '카드',
  TRANSFER: '계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
  MOBILE: '모바일',
};

/** 결제수단별 완료 기부 건수 분포. */
export const buildPaymentSplit = (items: DonationHistoryItem[]): DonationSlice[] => {
  const bucket = new Map<string, { amount: number; count: number }>();
  for (const it of items) {
    if (!isPaidHistory(it)) continue;
    const key = it.paymentMethod || 'UNKNOWN';
    const cur = bucket.get(key) ?? { amount: 0, count: 0 };
    cur.amount += amountOf(it);
    cur.count += 1;
    bucket.set(key, cur);
  }
  return [...bucket.entries()]
    .map(([key, v]) => ({ key, label: PAYMENT_METHOD_LABEL[key] ?? key, amount: v.amount, count: v.count }))
    .sort((a, b) => b.count - a.count);
};

export type TopTarget = { name: string; amount: number; count: number };

/** 대상(캠페인/학교)별 완료 기부액 상위 N. */
export const buildTopTargets = (items: DonationHistoryItem[], limit = 8): TopTarget[] => {
  const bucket = new Map<string, { amount: number; count: number }>();
  for (const it of items) {
    if (!isPaidHistory(it)) continue;
    const name = it.targetName || '미지정';
    const cur = bucket.get(name) ?? { amount: 0, count: 0 };
    cur.amount += amountOf(it);
    cur.count += 1;
    bucket.set(name, cur);
  }
  return [...bucket.entries()]
    .map(([name, v]) => ({ name, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
};
