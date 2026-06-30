export { formatReadableCount } from '@/utils/formatReadableCount';

/** Stable theme color for icon keys / labels when API does not send a color. */
export function themeColorFromKey(seed: string | undefined | null): string {
  const s = seed == null || seed === '' ? '—' : String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue} 55% 45%)`;
}

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * Whole seconds → Korean duration (일·시간·분·초만 사용, 년/개월/주 없음).
 */
export function formatDurationFromTotalSeconds(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return '0초';
  let s = Math.floor(totalSec);
  if (s === 0) return '0초';

  const parts: string[] = [];

  const d = Math.floor(s / DAY);
  s %= DAY;
  if (d > 0) parts.push(`${d}일`);

  const h = Math.floor(s / HOUR);
  s %= HOUR;
  if (h > 0) parts.push(`${h}시간`);

  const m = Math.floor(s / MIN);
  s %= MIN;
  if (m > 0) parts.push(`${m}분`);

  if (s > 0 || parts.length === 0) {
    parts.push(`${s}초`);
  }

  return parts.slice(0, 4).join(' ');
}

/** 밀리초 → 초 환산 후 일·시간·분·초로 표시 (레거시·비분석 API용). */
export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0초';
  return formatDurationFromTotalSeconds(ms / 1000);
}

/** API duration in seconds (may be fractional) → 일·시간·분·초. */
export function formatDurationSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0초';
  if (sec < 60 && !Number.isInteger(sec)) {
    return `${sec.toLocaleString('ko-KR', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}초`;
  }
  return formatDurationFromTotalSeconds(sec);
}

/**
 * Chart axis / compact: 초·분·시간·일까지 (년/개월 없음).
 */
export function formatDurationSecondsShort(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0';
  const s = Math.floor(sec);
  if (s < MIN) return `${s}초`;
  if (s < HOUR) return `${Math.floor(s / MIN)}분`;
  if (s < DAY) return `${Math.floor(s / HOUR)}시간`;
  const d = Math.floor(s / DAY);
  const rem = s % DAY;
  if (rem < HOUR) return `${d}일`;
  const h = Math.floor(rem / HOUR);
  return `${d}일${h}시간`;
}
