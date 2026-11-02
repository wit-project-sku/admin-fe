export const INSTALLATION_PAGE_SIZE = 10;

export const INSTALLATION_ADDRESS_MAX = 255;
export const INSTALLATION_SITE_MAX = 200;
export const INSTALLATION_CLIENT_MAX = 100;
export const INSTALLATION_MANAGER_MAX = 50;
export const INSTALLATION_PHONE_MAX = 20;
export const INSTALLATION_DETAIL_MAX = 5000;
export const INSTALLATION_MEMO_MAX = 2000;
export const INSTALLATION_IMAGE_MAX_BYTES = 20 * 1024 * 1024;

/** 서버 검증과 같은 규칙 — 숫자·하이픈 7~20자. */
export const isValidPhone = (value: string): boolean => /^[0-9-]{7,20}$/.test(value);

export const INSTALLATION_MESSAGES = {
  loadError: '설치 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  detailLoadError: '설치 정보를 불러오지 못했습니다. 이미 삭제되었을 수 있습니다.',
  empty: '등록된 설치 정보가 없습니다.',
  emptyFiltered: '조건에 맞는 설치 정보가 없습니다.',
  deleteFailed: '삭제에 실패했습니다.',
  deleteWarning: '사진과 담당자 연락처까지 함께 삭제되며 복구할 수 없습니다.',
  saveFailed: '저장에 실패했습니다. 입력값을 확인해 주세요.',
  saveNotFound: '선택한 키오스크나 설치 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.',
  imageInvalid: '이미지 파일만 등록할 수 있습니다.',
  imageTooLarge: '사진은 20MB 이하만 등록할 수 있습니다.',
} as const;
