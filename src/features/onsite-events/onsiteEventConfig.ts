export const ONSITE_EVENT_PAGE_SIZE = 10;

export const ONSITE_EVENT_MEMO_MAX = 500;
export const ONSITE_EVENT_NAME_MAX = 100;
export const ONSITE_EVENT_VENUE_MAX = 100;

/** 사용 콘텐츠 후보 = 상설 키오스크(이름이 `#W` 로 시작). 촬영 기기는 `#W` 가 아닌 기기를 앞에 둔다. */
export const isPermanentKioskName = (name: string): boolean => name.trimStart().startsWith('#W');

/** 연도 세그먼트 — 전체 / 올해 / 작년. 라벨은 시안대로 실제 연도 숫자. */
export function buildYearFilters(thisYear: number) {
  return [
    { key: 'ALL', label: '전체' },
    { key: String(thisYear), label: String(thisYear) },
    { key: String(thisYear - 1), label: String(thisYear - 1) },
  ];
}

export const ONSITE_EVENT_MESSAGES = {
  loadError: '행사 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  empty: '등록된 행사가 없습니다.',
  deleteFailed: '삭제에 실패했습니다.',
  saveFailed: '저장에 실패했습니다. 입력값을 확인해 주세요.',
  noEvents: '행사 등록 관리에서 행사를 먼저 등록해 주세요',
  notStarted: '아직 행사 기간 전입니다',
  statsLoadError: '리포트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
} as const;
