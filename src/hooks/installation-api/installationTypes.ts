/**
 * 키오스크 설치 정보 · admin-be `/api/admin/kiosk-installations` (ADMIN 전용).
 * 한 키오스크에 여러 건을 둘 수 있다(이전·재설치 이력). 설치일은 `yyyy-MM-dd`, 시각은 KST.
 */

/** 목록 한 줄. 담당자 연락처는 목록에 오지 않는다(상세에서만). */
export type InstallationSummaryDto = {
  id: number;
  kioskId: number;
  kioskName: string;
  installedAt: string;
  address: string;
  siteName: string | null;
  clientName: string;
  managerName: string | null;
  /** 대표 사진(첫 장). 없으면 null */
  thumbnailUrl: string | null;
  imageCount: number;
  updatedAt: string;
};

export type InstallationDetailDto = {
  id: number;
  kioskId: number;
  kioskName: string;
  installedAt: string;
  address: string;
  siteName: string | null;
  clientName: string;
  managerName: string | null;
  managerPhone: string | null;
  detail: string | null;
  memo: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
};

/** POST·PUT 의 `data` 파트. PUT 은 칸 전체를 덮어쓴다 — 선택 칸을 비워 보내면 지운다. */
export type InstallationPayload = {
  kioskId: number;
  installedAt: string;
  address: string;
  siteName: string | null;
  clientName: string;
  managerName: string | null;
  managerPhone: string | null;
  detail: string | null;
  memo: string | null;
  /** 수정 때만: 남길 기존 사진 URL. 빠진 사진은 서버에서도 지워지고, 빈 배열이면 모두 지운다. */
  imageUrls?: string[];
};

export type InstallationListParams = {
  kioskId?: number;
  keyword?: string;
  pageNum: number;
  pageSize: number;
};
