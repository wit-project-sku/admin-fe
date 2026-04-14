export const OUTFIT_PAGE_SIZE = 20;

export const OUTFIT_STATUS_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'ACTIVE', label: '활성화' },
  { key: 'INACTIVE', label: '비활성화' },
] as const;

export const OUTFIT_TABLE_MESSAGES = {
  loadError: '의상 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  empty: '데이터가 없습니다.',
  deleteFailed: '삭제에 실패했습니다.',
} as const;
