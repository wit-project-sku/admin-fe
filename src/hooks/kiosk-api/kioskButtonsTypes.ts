export type KioskButtonDto = {
  id: number;
  /** 별칭(닉네임) */
  buttonType: string;
  /** 실제 버튼 이름 */
  buttonName?: string;
  iconKey: string | null;
  status: string;
  /** 배치 유형: MAIN(그리드) / FIXED(고정) / OFF_MAIN(미표시) */
  placement?: 'MAIN' | 'FIXED' | 'OFF_MAIN';
  /** 버튼이 놓인 줄 번호 (0-based) */
  line: number;
  /** 줄 안에서의 위치 (0-based) */
  position: number;
  totalClicks: number;
  /** 누적 사용 시간(초) */
  totalDuration: number;
  /** Present when listing buttons across kiosks. */
  kioskId?: number;
  kioskName?: string;
};

export type KioskButtonsPageData = {
  content: KioskButtonDto[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type KioskButtonsListResponse = {
  success: boolean;
  code: number;
  message: string;
  data: KioskButtonsPageData;
};

export type KioskButtonsListParams = {
  pageNum: number;
  pageSize: number;
  kioskId?: number;
  city?: string;
  district?: string;
};

/** Body for `POST /admin/kiosks/button` */
export type CreateKioskButtonPayload = {
  kioskId: number;
  buttonType: string;
  buttonName: string;
  /** 줄 번호 (0-based). 미지정 시 백엔드 0. */
  line?: number;
  position: number;
  iconKey: string;
  status: string;
};

export type CreateKioskButtonApiResponse = {
  success: boolean;
  code: number;
  message: string;
  data?: KioskButtonDto;
};

/** Body for `PUT /admin/kiosks/button/{buttonId}` */
export type UpdateKioskButtonPayload = {
  buttonType: string;
  buttonName: string;
  /** 줄 번호 (0-based). 미지정 시 기존 줄 유지. 드래그 SWAP 시 목표 줄로 지정. */
  line?: number;
  position: number;
  iconKey: string;
  status: string;
};

export type UpdateKioskButtonApiResponse = {
  success: boolean;
  code: number;
  message: string;
  data?: KioskButtonDto;
};

/** Response for `DELETE /admin/kiosks/button/{buttonId}` */
export type DeleteKioskButtonApiResponse = {
  success: boolean;
  code: number;
  message: string;
  data?: null;
};
