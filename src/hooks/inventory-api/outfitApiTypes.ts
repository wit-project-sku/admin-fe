/** JSON body inside multipart `data` blob for POST/PUT `/admin/outfits`. */
export type OutfitWriteBody = {
  outfitCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  categoryId: number;
  kioskIds: number[];
  /** `YYYY-MM-DD`. `null`/omit = 제한 없음 (백엔드 스펙에 맞게 전송). */
  operationStartDate?: string | null;
  /** `YYYY-MM-DD`. `null` = 종료일 없음(무기한). */
  operationEndDate?: string | null;
};
