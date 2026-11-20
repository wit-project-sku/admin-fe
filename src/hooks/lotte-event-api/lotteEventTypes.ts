/**
 * 롯데 건물 이벤트 · 키오스크 '건물 안내 › 이벤트'(롯데 W011~W013, 기능 가이드 5절 '건물 구분 칸').
 *
 * ⚠ 2026-11-20 기준 서버에 아직 없는 API — 화면이 먼저 만들어졌고, 아래가 서버에 제안한 모양이다.
 * 서버가 다르게 만들면 이 파일과 useLotteEvents.ts 만 맞추면 된다. 자세한 제안: docs/lotte-building-events-api.md
 *
 *   GET    /api/admin/lotte/events?kioskId&building&status&pageNum&pageSize → Page<LotteEventDto>
 *   POST   /api/admin/lotte/events                 body LotteEventRequest → LotteEventDto
 *   PUT    /api/admin/lotte/events/{id}            body LotteEventRequest → LotteEventDto
 *   DELETE /api/admin/lotte/events/{id}            body { reason }
 *   (키오스크용) GET /api/lotte/events?kioskId     → 오늘 진행 중 + 예정, 건물별
 *
 * 날짜는 KST `yyyy-MM-dd`, 시각은 `yyyy-MM-ddTHH:mm:ss`.
 */

/** 키오스크 화면의 이벤트 종류 칩 — MAIN EVENT · POP-UP · ENTERTAINMENT · STORE EVENT */
export type LotteEventKind = 'MAIN_EVENT' | 'POP_UP' | 'ENTERTAINMENT' | 'STORE_EVENT';

/** 오늘 기준 — 서버가 startDate·endDate 로 계산해 거른다. */
export type LotteEventStatus = 'ONGOING' | 'UPCOMING' | 'ENDED';

export type LotteEventDto = {
  id: number;
  kioskId: number;
  /** 건물 — 월드몰(W011)은 롯데월드몰 · 롯데타워 · 롯데백화점 · 롯데월드, 백화점 지점은 지점 건물 하나 */
  building: string;
  kind: LotteEventKind;
  title: string;
  startDate: string;
  endDate: string;
  /** 시간 안내(선택) — '18:00', '매일 11:00 · 15:00' */
  timeText: string | null;
  /** 건물 안의 장소(선택) — '1F 아트리움', 'B1 팝업존' */
  place: string | null;
  createdAt: string;
  updatedAt: string;
  /** 마지막으로 고친 관리자(가이드: 누가 언제 했는지 남긴다) */
  updatedBy: string | null;
};

export type LotteEventRequest = {
  kioskId: number;
  building: string;
  kind: LotteEventKind;
  title: string;
  startDate: string;
  endDate: string;
  timeText: string | null;
  place: string | null;
};

export type LotteEventListParams = {
  kioskId?: number;
  building?: string;
  status?: LotteEventStatus;
  pageNum: number;
  pageSize: number;
};
