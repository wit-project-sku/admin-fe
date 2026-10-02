import type { KioskHealthEventType, KioskLiveness } from '@/hooks/kiosk-api/kioskHealthTypes';

export const STATUS_META: Record<KioskLiveness, { label: string; badge: string; hint: string }> = {
  ONLINE: { label: '온라인', badge: 'badgeGreen', hint: '15분 안에 신호가 있었습니다' },
  WAITING: { label: '신호 대기', badge: 'badgeAmber', hint: '운영 시작·점검 종료·감시 시작 직후 15분은 기다립니다' },
  OFFLINE: { label: '오프라인', badge: 'badgeRed', hint: '운영시간 안에서 15분 넘게 신호가 없습니다' },
  OUT_OF_HOURS: { label: '운영시간 외', badge: 'badgeGray', hint: '운영시간 밖이라 꺼져 있어도 정상입니다' },
  MAINTENANCE: { label: '점검 중', badge: 'badgeBlue', hint: '점검 모드 — 알림을 보내지 않습니다' },
  UNMONITORED: { label: '감시 안 함', badge: 'badgeGray', hint: '감시·알림 대상이 아닙니다' },
};

export const EVENT_LABEL: Record<KioskHealthEventType, string> = {
  OFFLINE: '오프라인',
  RECOVERED: '복구',
  MAINTENANCE_ON: '점검 시작',
  MAINTENANCE_OFF: '점검 종료',
};

/** "#W001-인사동=북인사광장" → "#W001 북인사광장". 형식이 다르면 원문. */
export function shortKioskName(raw: string | null | undefined): string {
  if (!raw) return '(이름 없음)';
  const dash = raw.indexOf('-');
  const eq = raw.indexOf('=');
  if (dash < 0 || eq < dash) return raw;
  return `${raw.slice(0, dash)} ${raw.slice(eq + 1)}`;
}

/** 서버 KST 문자열 두 개의 차이(분). 브라우저 시계를 쓰지 않으려고 서버의 checkedAt 을 기준으로 잰다. */
export function minutesBetween(from: string, to: string): number {
  const a = Date.parse(from.replace(' ', 'T'));
  const b = Date.parse(to.replace(' ', 'T'));
  return Math.max(0, Math.floor((b - a) / 60_000));
}

export function agoText(from: string | null, checkedAt: string): string {
  if (!from) return '기록 없음';
  const m = minutesBetween(from, checkedAt);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}시간 ${m % 60}분 전`;
  return `${Math.floor(m / 1440)}일 전`;
}

/** "2026-09-21 14:02:10" → "9/21 14:02" */
export function shortDateTime(v: string | null): string {
  if (!v) return '-';
  const [d, t] = v.split(' ');
  const [, mo, da] = d.split('-');
  return `${Number(mo)}/${Number(da)} ${t.slice(0, 5)}`;
}
