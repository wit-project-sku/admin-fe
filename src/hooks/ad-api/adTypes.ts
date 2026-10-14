/**
 * 광고 · admin-be `/api/admin/ads` (ADMIN 전용). 광고는 한국어만(언어 칸 없음), 기간은 `yyyy-MM-dd`(양 끝 포함).
 * 순서(sortOrder)는 앱·키오스크 공통 하나. 상태는 서버가 오늘 날짜로 계산해 내려 준다.
 */

/** 광고 상태 — 일시 중지가 기간보다 우선한다. */
export type AdStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'PAUSED';

export const AD_STATUS_LABEL: Record<AdStatus, string> = {
  SCHEDULED: '예약',
  ACTIVE: '노출 중',
  EXPIRED: '종료',
  PAUSED: '일시 중지',
};

/**
 * 키오스크 콘텐츠 지점 — admin-be `ContentRegion` enum 이름·라벨 그대로(`/api/kiosks/{region}/…` 의 region).
 * KADA·행사 키오스크는 enum 에 없다(제품 결정). 서버에 지점이 늘면 여기도 같이 늘린다.
 */
export const CONTENT_REGIONS = [
  { value: 'INSADONG_NORTH', label: '북인사광장' },
  { value: 'INSADONG_CENTER', label: '인사동쉼터' },
  { value: 'INSADONG_SOUTH', label: '남인사광장' },
  { value: 'OSAEK', label: '오색시장' },
  { value: 'HWASEONG', label: '화성휴게소' },
  { value: 'JEJU_AIRPORT', label: '제주국제공항' },
  { value: 'JEJU_PORT', label: '제주국제여객터미널' },
  { value: 'JEJU_HERITAGE', label: '세계자연유산본부' },
] as const;

export type ContentRegion = (typeof CONTENT_REGIONS)[number]['value'];

const REGION_LABEL = new Map<string, string>(CONTENT_REGIONS.map((r) => [r.value, r.label]));

/** 모르는 값(서버에 새로 생긴 지점)은 enum 이름 그대로 보여 준다. */
export const regionLabel = (value: string): string => REGION_LABEL.get(value) ?? value;

/** 목록 한 줄(sortOrder 순, 페이지 없이 전체). 연락처는 서버가 가린 값. */
export type AdSummaryDto = {
  id: number;
  advertiserName: string;
  advertiserPhoneMasked: string;
  title: string;
  startDate: string;
  endDate: string;
  showOnKiosk: boolean;
  showOnApp: boolean;
  regions: string[];
  kioskImageUrl: string | null;
  appImageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
  paused: boolean;
  status: AdStatus;
  createdAt: string;
};

/** 상세 — 수정 창 채우기(연락처 원문·메모 포함). */
export type AdDetailDto = AdSummaryDto & {
  advertiserPhone: string;
  memo: string | null;
};

/** POST·PUT 멀티파트 `data` 파트. */
export type AdPayload = {
  advertiserName: string;
  advertiserPhone: string;
  title: string;
  startDate: string;
  endDate: string;
  showOnKiosk: boolean;
  showOnApp: boolean;
  regions: string[];
  linkUrl: string | null;
  paused: boolean;
  memo: string | null;
};

export const AD_NAME_MAX = 100;
export const AD_TITLE_MAX = 100;
export const AD_LINK_MAX = 500;
export const AD_MEMO_MAX = 500;
/** 연락처 — 숫자·하이픈 7~20자(서버 검증과 같다). */
export const AD_PHONE_PATTERN = /^[0-9-]{7,20}$/;
/** 업로드 한 장 상한 — 배너 관리와 같은 20MB. */
export const AD_IMAGE_MAX_BYTES = 20 * 1024 * 1024;
