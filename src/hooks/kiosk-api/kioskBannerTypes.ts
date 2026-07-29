/** 키오스크 하단 프로모션 배너 — 서버 응답 타입. */
export type KioskBannerDto = {
  id: number;
  /** S3 이미지 URL */
  imageUrl: string;
  /** 노출 순서(0부터 오름차순) */
  sortOrder: number;
};

export type KioskBannerListResponse = {
  data?: KioskBannerDto[];
};

/** 키오스크당 등록 가능한 최대 배너 수(서버 KioskBannerServiceImpl.MAX_BANNERS 와 동일). */
export const MAX_KIOSK_BANNERS = 10;

/** 서버 업로드 상한(spring.servlet.multipart.max-file-size). 초과 시 요청 전에 막는다. */
export const MAX_BANNER_FILE_BYTES = 20 * 1024 * 1024;
