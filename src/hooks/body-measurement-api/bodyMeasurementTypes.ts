/**
 * 체형 측정 데이터 · admin-be `/api/admin/stats/body-measurements` (ROLE_ADMIN 전용).
 *
 * 키오스크 AR 촬영 1건(= eventId)마다 ZED 카메라가 잰 신체 **폭**(정면, cm — 둘레 아님)과 AR 원본 사진이
 * 붙는다. 키·성별·국적은 모바일 수령 페이지에서 촬영자가 입력한 `photo_shot_shooter` 를 eventId 로 묶어 온다.
 * 값이 없으면 키를 빼지 않고 항상 null 로 온다. 시각은 KST `yyyy-MM-dd'T'HH:mm:ss`.
 */

export type BodyMeasurementShotType = 'SOLO' | 'TOGETHER';
export type BodyMeasurementGender = 'MALE' | 'FEMALE';
export type BodyMeasurementShooterFilter = 'SUBMITTED' | 'NOT_SUBMITTED';

/** 촬영자가 직접 입력한 정보. 입력 행이 없으면 항목의 `shooter` 자체가 null. */
export type BodyMeasurementShooterDto = {
  heightCm: number | null;
  gender: BodyMeasurementGender | null;
  /** ISO 3166-1 alpha-2 대문자(예 `KR`) */
  nationality: string | null;
  submittedAt: string | null;
};

/** 엑셀용 전체 조회(`/export`) 항목 — 사진·주소가 없다. */
export type BodyMeasurementExportRow = {
  eventId: string;
  kioskId: number;
  kioskName: string | null;
  shotAt: string | null;
  measuredAt: string | null;
  heightCm: number | null;
  shoulderWidthCm: number | null;
  chestWidthCm: number | null;
  waistWidthCm: number | null;
  hipWidthCm: number | null;
  confidence: number | null;
  /** 측정 방식 버전(카메라 쪽 정의) */
  version: number | null;
  outfitCode: string | null;
  shotType: BodyMeasurementShotType | null;
  isSuccess: boolean | null;
  shooter: BodyMeasurementShooterDto | null;
};

/** 목록 항목. `thumbnailUrl` = 작은 사진 서명 주소(300초 뒤 만료, 저장소 미설정이면 null). */
export type BodyMeasurementListItem = BodyMeasurementExportRow & {
  thumbnailUrl: string | null;
};

/** 상세. 목록 항목 + 원본 사진 서명 주소(300초 뒤 만료). */
export type BodyMeasurementDetail = BodyMeasurementListItem & {
  photoUrl: string | null;
};

/** 목록·엑셀 공통 필터. 비어 있는 값은 쿼리에 싣지 않는다. */
export type BodyMeasurementFilterParams = {
  /** `yyyy-MM-dd`, KST, 양끝 포함 — 촬영 시각 기준 */
  startDate?: string;
  endDate?: string;
  kioskIds?: number[];
  shotType?: BodyMeasurementShotType;
  isSuccess?: boolean;
  shooter?: BodyMeasurementShooterFilter;
  /** 정확히 일치 */
  eventId?: string;
};

export type BodyMeasurementListParams = BodyMeasurementFilterParams & {
  pageNum: number;
  pageSize: number;
};
