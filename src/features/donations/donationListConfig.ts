export const DONATION_CAMPAIGN_PAGE_SIZE = 10;
export const DONATION_HISTORY_PAGE_SIZE = 20;

export type DonationTab = 'campaigns' | 'history' | 'organizations';

export const DONATION_TABS: { key: DonationTab; label: string }[] = [
  { key: 'campaigns', label: '기부 캠페인' },
  { key: 'history', label: '기부 내역' },
  { key: 'organizations', label: '기부 단체' },
];

/** 기부 종류 코드 → 표시 라벨 (payment-be DonationType). */
export const DONATION_TYPE_LABEL: Record<string, string> = {
  NGO: 'NGO',
  SCHOOL: '학교',
};

/** 기부 종류 필터/등록 셀렉트 옵션. */
export const DONATION_TYPE_OPTIONS = [
  { value: 'NGO', label: 'NGO' },
  { value: 'SCHOOL', label: '학교' },
] as const;

export const CAMPAIGN_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: '진행중', cls: 'badgeGreen' },
  INACTIVE: { label: '비활성', cls: 'badgeGray' },
};

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '진행중' },
  { value: 'INACTIVE', label: '비활성' },
] as const;

export const CAMPAIGN_TABLE_MESSAGES = {
  loadError: '캠페인 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  empty: '등록된 기부 캠페인이 없습니다.',
  deleteFailed: '캠페인 삭제에 실패했습니다.',
  saveFailed: '캠페인 저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.',
};

export const DONATION_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '대기', cls: 'badgeAmber' },
  PAID: { label: '완료', cls: 'badgeGreen' },
  COMPLETED: { label: '완료', cls: 'badgeGreen' },
  FAILED: { label: '실패', cls: 'badgeRed' },
  CANCELLED: { label: '취소', cls: 'badgeGray' },
};

export const PAYMENT_METHOD_MAP: Record<string, string> = {
  CARD: '카드',
  TRANSFER: '계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
  MOBILE: '모바일',
};
