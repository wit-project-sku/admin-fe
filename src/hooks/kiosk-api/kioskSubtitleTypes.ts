/** 자막 표준 언어 코드(백엔드 kiosk_subtitle 고정 컬럼과 1:1). */
export const SUBTITLE_LANGS = ['KR', 'EN', 'JP', 'CN', 'VN', 'ID', 'TH', 'RU'] as const;
export type SubtitleLang = (typeof SUBTITLE_LANGS)[number];

/** 언어 코드 → main/rt 컬럼 키. */
export const LANG_FIELD: Record<
  SubtitleLang,
  { main: keyof KioskSubtitleDto; rt: keyof KioskSubtitleDto }
> = {
  KR: { main: 'mainKr', rt: 'rtKr' },
  EN: { main: 'mainEn', rt: 'rtEn' },
  JP: { main: 'mainJp', rt: 'rtJp' },
  CN: { main: 'mainCn', rt: 'rtCn' },
  VN: { main: 'mainVn', rt: 'rtVn' },
  ID: { main: 'mainId', rt: 'rtId' },
  TH: { main: 'mainTh', rt: 'rtTh' },
  RU: { main: 'mainRu', rt: 'rtRu' },
};

/** (구) 추가 언어 자막 텍스트 — 하위호환용(백엔드는 더 이상 사용 안 함). */
export type SubtitleLangText = { main?: string | null; rt?: string | null };

/** KioskSubtitleResponse (백엔드) 매핑 — 표준 8언어 전용 컬럼. */
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
  mainVn?: string | null;
  mainId?: string | null;
  mainTh?: string | null;
  mainRu?: string | null;
  rtKr?: string | null;
  rtEn?: string | null;
  rtJp?: string | null;
  rtCn?: string | null;
  rtVn?: string | null;
  rtId?: string | null;
  rtTh?: string | null;
  rtRu?: string | null;
  playCondition?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

/** KioskSubtitleRequest (백엔드) 매핑 — videoFileName 지정 시 영상 자산 find-or-create. id 는 bulk 저장 시 수정 대상 지정. */
export type KioskSubtitlePayload = {
  id?: number | null;
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
  mainVn?: string | null;
  mainId?: string | null;
  mainTh?: string | null;
  mainRu?: string | null;
  rtKr?: string | null;
  rtEn?: string | null;
  rtJp?: string | null;
  rtCn?: string | null;
  rtVn?: string | null;
  rtId?: string | null;
  rtTh?: string | null;
  rtRu?: string | null;
  playCondition?: string | null;
  description?: string | null;
};

/** 자막 일괄 저장(bulk) 요청. */
export type KioskSubtitleBulkPayload = {
  kioskId: number;
  items: KioskSubtitlePayload[];
  deleteIds?: number[];
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
