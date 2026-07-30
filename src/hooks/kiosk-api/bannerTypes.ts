/** 배너 노출 대상 방식. ALL 은 이후 새로 등록되는 키오스크에도 자동 노출된다. */
export type BannerTargetType = 'ALL' | 'SELECTED';

/** 오늘 기준 노출 상태(서버 계산). */
export type BannerStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';

/** 배너 소재 — 배너 중심 화면용. */
export type BannerDto = {
  id: number;
  imageUrl: string;
  targetType: BannerTargetType;
  kioskIds: number[];
  kioskCount: number;
  /** null 이면 즉시 시작 */
  startDate: string | null;
  /** null 이면 무기한 */
  endDate: string | null;
  status: BannerStatus;
};

/** 한 키오스크에 노출되는 배너 — 키오스크 중심 화면용. */
export type KioskBannerDto = {
  bannerId: number;
  imageUrl: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
};

export const MAX_BANNERS_PER_KIOSK = 10;
export const MAX_BANNER_FILE_BYTES = 20 * 1024 * 1024;

export const BANNER_STATUS_LABEL: Record<BannerStatus, string> = {
  SCHEDULED: '예정',
  ACTIVE: '노출 중',
  EXPIRED: '종료',
};

/** 노출 기간을 사람이 읽는 문구로. */
export function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return '상시';
  if (start && !end) return `${start} ~`;
  if (!start && end) return `~ ${end}`;
  return `${start} ~ ${end}`;
}
