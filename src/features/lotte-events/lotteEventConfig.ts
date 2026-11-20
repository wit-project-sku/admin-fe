import shared from '@commons/shared.module.css';
import type { LotteEventDto, LotteEventKind, LotteEventStatus } from '../../hooks/lotte-event-api/lotteEventTypes';
import type { LotteBranchCode } from '../lotte/lotteBranches';
import { ymd } from '../lotte/lotteFormat';

export const LOTTE_EVENT_PAGE_SIZE = 20;
export const LOTTE_EVENT_TITLE_MAX = 40;
export const LOTTE_EVENT_REASON_MAX = 200;

/**
 * 지점별 건물. 이름은 키오스크 건물 안내의 건물 칩과 같아야 한다(kiosk-app layouts/lotte/lotteBuildingData.ts).
 * 월드몰은 건물 4개(기능 가이드 5절), 백화점 지점은 건물 하나.
 */
export const LOTTE_BUILDINGS: Record<LotteBranchCode, readonly string[]> = {
  W011: ['롯데월드몰', '롯데타워', '롯데백화점', '롯데월드'],
  W012: ['롯데백화점 청량리점'],
  W013: ['롯데백화점 건대스타시티점'],
};

export const LOTTE_EVENT_KINDS: { value: LotteEventKind; label: string }[] = [
  { value: 'MAIN_EVENT', label: 'MAIN EVENT' },
  { value: 'POP_UP', label: 'POP-UP' },
  { value: 'ENTERTAINMENT', label: 'ENTERTAINMENT' },
  { value: 'STORE_EVENT', label: 'STORE EVENT' },
];

export const LOTTE_EVENT_KIND_LABEL: Record<LotteEventKind, string> = Object.fromEntries(
  LOTTE_EVENT_KINDS.map((k) => [k.value, k.label]),
) as Record<LotteEventKind, string>;

export type LotteEventTab = LotteEventStatus | 'ALL';

export const LOTTE_EVENT_TABS: { key: LotteEventTab; label: string }[] = [
  { key: 'ONGOING', label: '진행 중' },
  { key: 'UPCOMING', label: '예정' },
  { key: 'ENDED', label: '종료' },
  { key: 'ALL', label: '전체' },
];

export const LOTTE_EVENT_STATUS_LABEL: Record<LotteEventStatus, string> = {
  ONGOING: '진행 중',
  UPCOMING: '예정',
  ENDED: '종료',
};

export const LOTTE_EVENT_STATUS_BADGE: Record<LotteEventStatus, string> = {
  ONGOING: `${shared.badge} ${shared.badgeGreen}`,
  UPCOMING: `${shared.badge} ${shared.badgeBlue}`,
  ENDED: `${shared.badge} ${shared.badgeGray}`,
};

/** 오늘(로컬 달력) 기준 상태 — 표시용. 거르기는 서버가 한다. */
export const eventStatusOf = (e: Pick<LotteEventDto, 'startDate' | 'endDate'>, today = ymd(new Date())): LotteEventStatus =>
  today < e.startDate ? 'UPCOMING' : today > e.endDate ? 'ENDED' : 'ONGOING';

/** `2026-11-13` → `11.13` */
const md = (d: string) => `${d.slice(5, 7)}.${d.slice(8, 10)}`;

/** 키오스크에 나가는 한 줄 — `11.13 ~ 11.30 · 롯데월드몰 1F 아트리움` (kiosk-app BuildingEvent.when 과 같은 모양) */
export const kioskWhenLine = (e: {
  startDate: string;
  endDate: string;
  timeText?: string | null;
  building: string;
  place?: string | null;
}): string => {
  const period = !e.startDate ? '' : e.startDate === e.endDate || !e.endDate ? md(e.startDate) : `${md(e.startDate)} ~ ${md(e.endDate)}`;
  const time = e.timeText?.trim() ? ` ${e.timeText.trim()}` : '';
  const where = [e.building, e.place?.trim()].filter(Boolean).join(' ');
  return [`${period}${time}`.trim(), where].filter(Boolean).join(' · ');
};

export const LOTTE_EVENT_MESSAGES = {
  loadError: '이벤트를 불러오지 못했습니다.',
  notReady: '건물 이벤트 API 가 아직 서버에 없습니다(제안: /api/admin/lotte/events). 서버에 반영되면 바로 동작합니다.',
  empty: '조건에 맞는 이벤트가 없습니다.',
  saveFailed: '이벤트를 저장하지 못했습니다.',
  deleteFailed: '이벤트를 삭제하지 못했습니다.',
  branchMissing: (code: string) => `${code} 지점 키오스크가 서버에 아직 없습니다.`,
};
