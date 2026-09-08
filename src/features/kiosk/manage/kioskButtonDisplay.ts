import { getKioskIconOption, KIOSK_APP_ICON_OPTIONS } from '../kioskAppIconData';

/**
 * Maps API `iconKey` (preset key or 1-based index string) to a catalog key
 * so `KioskAppIconVisual` / `KioskAppIconGlyph` always resolve assets.
 */
export function resolveKioskButtonIconKey(raw: string | null | undefined): string {
  if (raw == null) return 'map';
  const key = String(raw).trim();
  if (!key) return 'map';
  if (getKioskIconOption(key)) return key;
  const n = Number(key);
  if (Number.isInteger(n) && n >= 1 && n <= KIOSK_APP_ICON_OPTIONS.length) {
    return KIOSK_APP_ICON_OPTIONS[n - 1].iconKey;
  }
  return 'map';
}

/**
 * Converts selected preset key to API format (1-based index string).
 * API examples use numeric strings like "1".
 */
export function toApiKioskButtonIconKey(iconKey: string): string {
  const resolved = resolveKioskButtonIconKey(iconKey);
  const idx = KIOSK_APP_ICON_OPTIONS.findIndex((o) => o.iconKey === resolved);
  if (idx >= 0) return String(idx + 1);
  return '1';
}

export function isKioskButtonStatusActive(status: string): boolean {
  const s = String(status).trim().toUpperCase();
  if (s === 'ACTIVE') return true;
  if (s === 'INACTIVE') return false;
  return /active|활성|enabled|정상|사용|on/i.test(status);
}

/** Short Korean label for table / badges. */
export function formatKioskButtonStatusLabel(status: string): string {
  return isKioskButtonStatusActive(status) ? '사용 중' : '비활성';
}

/**
 * 화면에 보여줄 버튼 이름. `buttonType` 은 통계 집계·키오스크 앱과의 조인 키라 바꾸면 안 되므로,
 * 표기만 바꿔야 하는 경우 여기서 매핑한다.
 */
const BUTTON_LABEL_OVERRIDE: Record<string, string> = {
  '관광명소(준비중)': '프로모션',
  '스마트관광(준비중)': '프로모션',
  'K Culture(준비중)': '프로모션',
};

export function kioskButtonLabel(buttonType: string | null | undefined): string {
  const key = (buttonType ?? '').trim();
  return BUTTON_LABEL_OVERRIDE[key] ?? key;
}
