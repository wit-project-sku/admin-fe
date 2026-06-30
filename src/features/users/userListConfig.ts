export const USER_PAGE_SIZE = 10;

export type UserFilterTab = 'ALL' | 'ROLE_ADMIN' | 'ROLE_USER' | 'INACTIVE';

export const USER_FILTER_TABS: { key: UserFilterTab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ROLE_ADMIN', label: '관리자' },
  { key: 'ROLE_USER', label: '일반 사용자' },
  { key: 'INACTIVE', label: '비활성' },
];

export const USER_ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: '관리자',
  ROLE_USER: '일반 사용자',
};

export const USER_TABLE_MESSAGES = {
  deleteFailed: '사용자 삭제에 실패했습니다.',
  blockFailed: '사용자 상태 변경에 실패했습니다.',
  saveFailed: '저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.',
};
