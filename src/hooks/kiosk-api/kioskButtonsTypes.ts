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
  /** 버튼이 놓인 화면 열(1-based, 1~8). 파킹된 예외 버튼은 -1. */
  line: number;
  /** 줄 안에서의 시작 칸(1-based, 1~4) */
  position: number;
  /** 가로 점유 칸 수(1~2). 와이드 버튼은 position ~ position+1 점유 */
  span?: number;
  /** 버튼 이미지 URL(OCI). null 이면 프리셋 아이콘(iconKey) 사용 */
  imageUrl?: string | null;
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
  /** 화면 열(1-based). MAIN 그리드는 3~6. 미지정 시 3. */
  line?: number;
  /** 시작 칸(1-based, 1~4) */
  position: number;
  /** 가로 점유 칸 수(1~2). 미지정 시 1. */
  span?: number;
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
  /** 화면 열(1-based). 미지정 시 기존 줄 유지. 드래그 SWAP 시 목표 줄로 지정. */
  line?: number;
  /** 시작 칸(1-based, 1~4) */
  position: number;
  /** 가로 점유 칸 수(1~2). 미지정 시 기존 값 유지. 변경 시 그리드 자동 재배치. */
  span?: number;
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
