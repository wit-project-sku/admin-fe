/** JSON inside the multipart `data` blob for POST `/admin/shops` and PUT `/admin/shops/:id`. */
export type ShopWriteBody = {
  /** 키오스크(지역) 식별자 (필수). 인사동=1, 오색시장=4, 화성휴게소=5 */
  kioskId: number;
  /** 위트&보존회 NO(업무 복합코드) */
  no?: string;

  // ── 한국어 (shopNameKr 필수) ──
  shopNameKr: string;
  baseCategoryKr?: string;
  regionKr?: string;
  secondCategoryKr?: string;
  aiCategoryKr?: string;
  addressKr?: string;
  hashTagKr?: string;
  descriptionKr?: string;

  // ── 영어 ──
  shopNameEn?: string;
  baseCategoryEn?: string;
  regionEn?: string;
  secondCategoryEn?: string;
  aiCategoryEn?: string;
  addressEn?: string;
  hashTagEn?: string;
  descriptionEn?: string;

  // ── 일본어 ──
  shopNameJp?: string;
  baseCategoryJp?: string;
  regionJp?: string;
  secondCategoryJp?: string;
  aiCategoryJp?: string;
  addressJp?: string;
  hashTagJp?: string;
  descriptionJp?: string;

  // ── 중국어 ──
  shopNameCh?: string;
  baseCategoryCh?: string;
  regionCh?: string;
  secondCategoryCh?: string;
  aiCategoryCh?: string;
  addressCh?: string;
  hashTagCh?: string;
  descriptionCh?: string;

  // ── 공통 ──
  openTime?: string;
  tel?: string;
  naverLink?: string;
  naverRating?: number;
};

/** 상점 이미지 (응답). */
export type ShopImageItem = {
  id: number;
  imageUrl: string;
  sortOrder?: number;
};
