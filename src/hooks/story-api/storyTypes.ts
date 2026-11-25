/**
 * 오늘의 사연 · admin-be `/api/admin/stories` (ADMIN 전용, 롯데 키오스크 W011~W013).
 * 시각은 모두 KST `yyyy-MM-ddTHH:mm:ss`.
 */

export type StoryStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';
export type StoryType = 'TEXT' | 'PHOTO' | 'VIDEO';

export type StoryDto = {
  id: number;
  /** 사연을 보여 줄 키오스크 id */
  kioskId: number;
  mobileUserId: number;
  /** 키오스크에 나가는 이름(앱 닉네임) */
  displayName: string;
  type: StoryType;
  title: string;
  body: string | null;
  /** 사진(webp)·영상(mp4). 글 사연은 null */
  mediaUrl: string | null;
  durationSeconds: number | null;
  status: StoryStatus;
  /** 관리자가 정한 순서(1부터). null = 승인 최신순 */
  displayOrder: number | null;
  createdAt: string;
  approvedAt: string | null;
  reviewedBy: number | null;
  /** 처리한 관리자 이름 — 서버가 채운다. 옛 응답·탈퇴 관리자는 null */
  reviewedByName?: string | null;
  reviewedAt: string | null;
};

export type StoryListParams = {
  status?: StoryStatus;
  kioskId?: number;
  /** 올린 시각(createdAt, KST) 기준 시작일 yyyy-MM-dd — 선택 */
  startDate?: string;
  /** 종료일(포함) yyyy-MM-dd — 선택 */
  endDate?: string;
  pageNum: number;
  pageSize: number;
};
