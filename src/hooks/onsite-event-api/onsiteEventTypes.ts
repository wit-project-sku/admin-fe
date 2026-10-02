/**
 * 행사 촬영 통계 · admin-be `/api/admin/onsite-events` (ADMIN 전용).
 * 날짜는 모두 `yyyy-MM-dd`, 등록 시각은 `yyyy-MM-dd'T'HH:mm:ss`(KST).
 *
 * `onsite_event` 라는 이름은 기존 `kiosk_event`(지역 문화행사)·`photo_shot.event_id`·기부 캠페인과
 * 섞이지 않게 붙였다. 화면에서는 그냥 "행사"라고 부른다.
 */

/** 등록 관리 목록·상세 한 건. statsKioskId/statsKioskName 은 등록 창 채우기용 — 표에는 쓰지 않는다. */
export type OnsiteEventDto = {
  id: number;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  contentKioskId: number;
  /** 사용 콘텐츠 표시명(키오스크 이름의 '=' 뒤) */
  contentLabel: string;
  statsKioskId: number;
  statsKioskName: string;
  memo: string | null;
  createdAt: string;
};

/** 리포트 드롭다운 한 줄(삭제된 행사 제외, 시작일 늦은 순). */
export type OnsiteEventOptionDto = {
  id: number;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  contentLabel: string;
  /** 시작일이 오늘(KST)보다 뒤 */
  notStarted: boolean;
};

/** POST·PUT 본문. memo 외 전부 필수. */
export type OnsiteEventPayload = {
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  contentKioskId: number;
  statsKioskId: number;
  memo: string | null;
};

export type OnsiteEventListParams = {
  year?: number;
  keyword?: string;
  pageNum: number;
  pageSize: number;
};

export type OnsiteEventDayCount = { date: string; count: number };

export type OnsiteEventStatsDto = {
  event: {
    id: number;
    name: string;
    venue: string;
    startDate: string;
    endDate: string;
    contentLabel: string;
    memo: string | null;
    /** 행사 전체 일수(종료일 − 시작일 + 1) */
    dayCount: number;
  };
  notStarted: boolean;
  totalShots: number;
  /** 소수 1자리 */
  dailyAverage: number;
  /** days.length — 진행 중이면 오늘까지의 일수 */
  elapsedDays: number;
  peakDay: OnsiteEventDayCount | null;
  lowestDay: OnsiteEventDayCount | null;
  /** 시작일 ~ min(종료일, 오늘). 0건 날짜도 채워서 온다. */
  days: OnsiteEventDayCount[];
};
