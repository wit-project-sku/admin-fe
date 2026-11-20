import shared from '@commons/shared.module.css';
import type { StoryDto, StoryStatus, StoryType } from '../../hooks/story-api/storyTypes';

export const STORY_PAGE_SIZE = 20;

/** 키오스크는 최근 이만큼 안에 승인된 사연만 보여 준다(서버 설정 기본값). 표시용 안내에만 쓴다. */
export const STORY_KIOSK_WINDOW_DAYS = 7;

export type StoryTab = StoryStatus | 'ALL';

export const STORY_TABS: { key: StoryTab; label: string }[] = [
  { key: 'PENDING', label: '검수 대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'HIDDEN', label: '숨김' },
  { key: 'ALL', label: '전체' },
];

export const STORY_STATUS_LABEL: Record<StoryStatus, string> = {
  PENDING: '검수 대기',
  APPROVED: '승인',
  HIDDEN: '숨김',
};

export const STORY_STATUS_BADGE: Record<StoryStatus, string> = {
  PENDING: `${shared.badge} ${shared.badgeAmber}`,
  APPROVED: `${shared.badge} ${shared.badgeGreen}`,
  HIDDEN: `${shared.badge} ${shared.badgeGray}`,
};

export const STORY_TYPE_LABEL: Record<StoryType, string> = {
  TEXT: '글',
  PHOTO: '사진',
  VIDEO: '영상',
};

/** 승인 뒤 기본 노출 기간이 지났는가 — 키오스크에서 이미 내려간 사연 표시용. */
export const isPastKioskWindow = (story: Pick<StoryDto, 'approvedAt'>, now = Date.now()): boolean => {
  if (!story.approvedAt) return false;
  const t = new Date(story.approvedAt).getTime();
  return Number.isFinite(t) && now - t > STORY_KIOSK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

/** 키오스크 표시 순서 — 고정 순서(1부터) 먼저, 나머지는 승인 최신순. */
export const sortForKiosk = (stories: StoryDto[]): StoryDto[] =>
  [...stories].sort((a, b) => {
    if (a.displayOrder != null && b.displayOrder != null) return a.displayOrder - b.displayOrder;
    if (a.displayOrder != null) return -1;
    if (b.displayOrder != null) return 1;
    return (b.approvedAt ?? '').localeCompare(a.approvedAt ?? '');
  });

export const STORY_MESSAGES = {
  loadError: '사연을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  empty: '올라온 사연이 없습니다.',
  emptyPending: '검수할 사연이 없습니다.',
  branchMissing: (code: string) =>
    `${code} 키오스크가 아직 서버에 등록되지 않아 사연을 거를 수 없습니다. 키오스크 관리에서 지점을 등록하면 나타납니다.`,
  statusFailed: '상태를 바꾸지 못했습니다.',
  orderFailed: '순서를 저장하지 못했습니다.',
  orderNeedsBranch: '순서는 지점마다 따로 정합니다. 위에서 지점을 고르세요.',
} as const;
