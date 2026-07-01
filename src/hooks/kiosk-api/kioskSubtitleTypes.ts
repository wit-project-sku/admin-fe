/** KioskSubtitleResponse (백엔드) 매핑 */
export type KioskSubtitleDto = {
  id: number;
  kioskId: number;
  buttonId?: number | null;
  videoId?: number | null;
  /** 영상 파일명 (kiosk_video.video_key) */
  videoKey?: string | null;
  videoUrl?: string | null;
  playKey?: string | null;
  autoTrigger?: string | null;
  sortOrder: number;
  mainKr?: string | null;
  mainEn?: string | null;
  mainJp?: string | null;
  mainCn?: string | null;
  rtKr?: string | null;
  rtEn?: string | null;
  rtJp?: string | null;
  rtCn?: string | null;
  playCondition?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

/** KioskSubtitleRequest (백엔드) 매핑 — videoFileName 지정 시 영상 자산 find-or-create */
export type KioskSubtitlePayload = {
  kioskId: number;
  buttonId?: number | null;
  videoId?: number | null;
  /** 영상 파일명. videoId 대신 지정하면 해당 파일명으로 영상을 찾거나 생성해 연결 */
  videoFileName?: string | null;
  playKey?: string | null;
  autoTrigger?: string | null;
  sortOrder?: number | null;
  mainKr?: string | null;
  mainEn?: string | null;
  mainJp?: string | null;
  mainCn?: string | null;
  rtKr?: string | null;
  rtEn?: string | null;
  rtJp?: string | null;
  rtCn?: string | null;
  playCondition?: string | null;
  description?: string | null;
};

export type BaseEnvelope<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T;
};

export type SubtitlePage = {
  content: KioskSubtitleDto[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};
