/** 의상 타입(백엔드 OutfitType enum). 기본값 NORMAL. */
export type OutfitType = 'NORMAL' | 'PREMIUM';

/** JSON body inside multipart `data` blob for POST/PUT `/admin/outfits`. */
export type OutfitWriteBody = {
  outfitCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  /** 의상 유형 (NORMAL | PREMIUM). */
  type: OutfitType;
  categoryId: number;
  kioskIds: number[];
  /** `YYYY-MM-DD`. `null`/omit = 제한 없음 (백엔드 스펙에 맞게 전송). */
  startDate?: string | null;
  /** `YYYY-MM-DD`. `null` = 종료일 없음(무기한). */
  endDate?: string | null;
};
