export const DONATION_CAMPAIGN_PAGE_SIZE = 10;
export const DONATION_HISTORY_PAGE_SIZE = 20;
export const DONATION_SCHOOL_PAGE_SIZE = 10;
export const DONATION_ORG_PAGE_SIZE = 10;

/** 최상위 세그먼트: NGO 기부 / 학교 기부. */
export type DonationMode = 'NGO' | 'SCHOOL';

export const DONATION_MODE_OPTIONS: { key: DonationMode; label: string }[] = [
  { key: 'NGO', label: 'NGO 기부' },
  { key: 'SCHOOL', label: '학교 기부' },
];

/** NGO 모드 하위 탭. */
export type NgoDonationTab = 'campaigns' | 'organizations' | 'history';
/** 학교 모드 하위 탭. */
export type SchoolDonationTab = 'schools' | 'history';
export type DonationTab = NgoDonationTab | SchoolDonationTab;

export const NGO_DONATION_TABS: { key: NgoDonationTab; label: string }[] = [
  { key: 'campaigns', label: '캠페인' },
  { key: 'organizations', label: '단체' },
  { key: 'history', label: '기부 내역' },
];

export const SCHOOL_DONATION_TABS: { key: SchoolDonationTab; label: string }[] = [
  { key: 'schools', label: '학교' },
  { key: 'history', label: '기부 내역' },
];

/** 기부 종류 코드 → 표시 라벨 (payment-be DonationType). */
export const DONATION_TYPE_LABEL: Record<string, string> = {
  NGO: 'NGO',
  SCHOOL: '학교',
  CAMPAIGN: '캠페인',
};

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

export const SCHOOL_TABLE_MESSAGES = {
  loadError: '학교 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  empty: '등록된 학교가 없습니다.',
  deleteFailed: '학교 삭제에 실패했습니다.',
  saveFailed: '학교 저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.',
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

/** 학교 초성 필터 버킷(ㄱ~ㅎ + 기타). */
export const SCHOOL_INITIAL_BUCKETS = [
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
  '기타',
] as const;

/** 학교 정렬 옵션. */
export const SCHOOL_SORT_OPTIONS = [
  { value: 'NAME', label: '이름순' },
  { value: 'DONATION', label: '누적 기부액순' },
] as const;
