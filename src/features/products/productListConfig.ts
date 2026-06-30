export const PRODUCT_PAGE_SIZE = 200;

export const PRODUCT_STATUS_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'ON_SALE', label: '판매중' },
  { key: 'SOLD_OUT', label: '품절' },
  { key: 'HIDDEN', label: '숨김' },
] as const;

export const PRODUCT_TABLE_MESSAGES = {
  loadError: '상품 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  empty: '등록된 상품이 없습니다.',
  deleteFailed: '삭제 실패',
} as const;
