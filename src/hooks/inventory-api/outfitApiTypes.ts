/** 의상 타입(백엔드 OutfitType enum). 기본값 NORMAL. SCHOOL_UNIFORM = 교복. */
export type OutfitType = 'NORMAL' | 'PREMIUM' | 'SCHOOL_UNIFORM';

/** JSON body inside multipart `outfit` blob for POST/PUT `/admin/outfits`. */
export type OutfitWriteBody = {
  /** 의상 코드. 선택값(교복은 없어도 됨). */
  outfitCode?: string;
  status: 'ACTIVE' | 'INACTIVE';
  /** 의상 유형 (NORMAL | PREMIUM | SCHOOL_UNIFORM). */
  type: OutfitType;
  /** 일반/프리미엄 의상일 때 필수. 교복이면 생략. */
  categoryId?: number;
  /** 대분류에 세부(남/여 등)가 있을 때 필수. 세부가 없는 대분류·교복이면 생략. */
  subCategoryId?: number;
  /** 교복(SCHOOL_UNIFORM)일 때 필수. 그 외 생략. */
  schoolId?: number;
  kioskIds: number[];
  /** `YYYY-MM-DD`. `null`/omit = 제한 없음 (백엔드 스펙에 맞게 전송). */
  startDate?: string | null;
  /** `YYYY-MM-DD`. `null` = 종료일 없음(무기한). */
  endDate?: string | null;
};
