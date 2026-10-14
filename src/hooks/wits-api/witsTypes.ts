/**
 * WITS 앱 이벤트·알림 · admin-be `/api/admin/wits-events`, `/api/admin/wits-notifications` (ADMIN 전용).
 * 시각은 모두 KST `yyyy-MM-dd'T'HH:mm:ss`. 글은 한국어 필수 + 영어 선택(앱이 lang=en 인데 영어가 비면 한국어로 대체).
 * 상태(status)는 서버가 시각으로 계산해 내려 준다 — 저장 값이 아니다.
 */

/** 이벤트 상태 — 시작 전 / 진행 중(end_at 포함) / 마감. */
export type WitsEventStatus = 'SCHEDULED' | 'ONGOING' | 'ENDED';

/** 참여 방식 — 앱 "참여하기" 버튼 / 안내만. */
export type WitsParticipationType = 'APP_BUTTON' | 'NONE';

export const WITS_EVENT_STATUS_LABEL: Record<WitsEventStatus, string> = {
  SCHEDULED: '예정',
  ONGOING: '진행 중',
  ENDED: '마감',
};

export const WITS_PARTICIPATION_LABEL: Record<WitsParticipationType, string> = {
  APP_BUTTON: '앱 참여 버튼',
  NONE: '안내만',
};

/** 목록 한 줄(최근 시작 순). */
export type WitsEventSummaryDto = {
  id: number;
  titleKo: string;
  startAt: string;
  endAt: string;
  status: WitsEventStatus;
  published: boolean;
  bannerVisible: boolean;
  participationType: WitsParticipationType;
  participantCount: number;
  bannerImageUrl: string | null;
  createdAt: string;
};

/** 상세 — 수정 창 채우기. */
export type WitsEventDetailDto = {
  id: number;
  titleKo: string;
  titleEn: string | null;
  summaryKo: string | null;
  summaryEn: string | null;
  contentKo: string;
  contentEn: string | null;
  startAt: string;
  endAt: string;
  status: WitsEventStatus;
  published: boolean;
  bannerVisible: boolean;
  bannerOrder: number;
  participationType: WitsParticipationType;
  linkUrl: string | null;
  bannerImageUrl: string | null;
  contentImageUrls: string[];
  participantCount: number;
  createdAt: string;
  updatedAt: string;
};

/** 앱 홈 배너 노출 중인 이벤트(bannerOrder 순). */
export type WitsEventBannerDto = {
  id: number;
  titleKo: string;
  bannerImageUrl: string | null;
  startAt: string;
  endAt: string;
  status: WitsEventStatus;
  bannerOrder: number;
};

/** 참여자 한 줄(참여 최신순). 이메일·이름은 서버가 내보내지 않는다. */
export type WitsEventParticipantDto = {
  mobileUserId: number;
  nickname: string | null;
  participatedAt: string;
};

/** POST·PUT 멀티파트 `data` 파트. */
export type WitsEventPayload = {
  titleKo: string;
  titleEn: string | null;
  summaryKo: string | null;
  summaryEn: string | null;
  contentKo: string;
  contentEn: string | null;
  startAt: string;
  endAt: string;
  published: boolean;
  bannerVisible: boolean;
  participationType: WitsParticipationType;
  linkUrl: string | null;
  /** PUT 전용 — 남길 기존 본문 이미지 URL(이 순서대로, 그 뒤에 새 이미지). */
  keepContentImageUrls?: string[];
  /** PUT 전용 — 기존 배너 이미지를 지운다(새 이미지를 주면 무시돼도 된다). */
  removeBannerImage?: boolean;
};

export type WitsEventListParams = {
  pageNum: number;
  pageSize: number;
  status?: WitsEventStatus;
  keyword?: string;
};

/* ───────────── 알림 ───────────── */

/** 알림 상태 — 예약 / 발송됨(send_at 지남) / 예약 취소. 내린(삭제) 알림은 목록에 없다. */
export type WitsNotificationStatus = 'SCHEDULED' | 'SENT' | 'CANCELED';

export const WITS_NOTIFICATION_STATUS_LABEL: Record<WitsNotificationStatus, string> = {
  SCHEDULED: '예약',
  SENT: '발송됨',
  CANCELED: '취소',
};

export type WitsNotificationDto = {
  id: number;
  titleKo: string;
  titleEn: string | null;
  bodyKo: string;
  bodyEn: string | null;
  eventId: number | null;
  eventTitleKo: string | null;
  sendAt: string;
  isAd: boolean;
  status: WitsNotificationStatus;
  createdAt: string;
};

/** POST·PUT JSON 본문. sendAt 을 빼면 서버가 "지금"으로 넣는다. */
export type WitsNotificationPayload = {
  titleKo: string;
  titleEn: string | null;
  bodyKo: string;
  bodyEn: string | null;
  eventId: number | null;
  sendAt?: string;
  isAd: boolean;
};

export type WitsNotificationListParams = {
  pageNum: number;
  pageSize: number;
  status?: WitsNotificationStatus;
};

/* ───────────── 공통 한도 ───────────── */

export const WITS_TITLE_MAX = 100;
export const WITS_SUMMARY_MAX = 200;
export const WITS_NOTIFICATION_BODY_MAX = 1000;
export const WITS_LINK_MAX = 500;
/** 이벤트 본문 이미지 최대 장수. */
export const WITS_EVENT_CONTENT_IMAGE_MAX = 5;
/** 업로드 한 장 상한 — 배너 관리와 같은 20MB. */
export const WITS_IMAGE_MAX_BYTES = 20 * 1024 * 1024;
