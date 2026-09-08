/**
 * 키오스크별 의상 카테고리 표시 설정 타입.
 *
 * 서버는 **기본값(`base`)과 오버라이드를 둘 다** 내려준다. 합쳐서 하나로 주면 화면에서
 * "지금 값이 기본인지 내가 덮어쓴 것인지"를 구분할 수 없어 되돌리기를 만들 수 없다.
 * → 기본 라벨은 입력칸 placeholder 로, 오버라이드는 입력값으로 쓴다.
 */

/** 라벨 8칸. 서버 DTO 와 칸 이름이 같다. `null` 은 '비었다'가 아니라 '기본을 따른다'는 뜻이다. */
export type OutfitCategoryLabels = {
  labelKr?: string | null;
  labelEn?: string | null;
  labelJp?: string | null;
  labelCh?: string | null;
  labelVn?: string | null;
  labelId?: string | null;
  labelTh?: string | null;
  labelRu?: string | null;
};

export type OutfitCategoryLabelKey = keyof OutfitCategoryLabels;

/** 입력칸을 그리는 순서. DB 컬럼 순서와 같다. */
export const OUTFIT_LABEL_FIELDS: ReadonlyArray<{ key: OutfitCategoryLabelKey; label: string }> = [
  { key: 'labelKr', label: '한국어' },
  { key: 'labelEn', label: '영어' },
  { key: 'labelJp', label: '일본어' },
  { key: 'labelCh', label: '중국어' },
  { key: 'labelVn', label: '베트남어' },
  { key: 'labelId', label: '인도네시아어' },
  { key: 'labelTh', label: '태국어' },
  { key: 'labelRu', label: '러시아어' },
] as const;

/** 카테고리 기본값(오버라이드가 없을 때 실제로 보이는 값). */
export type OutfitCategoryBase = OutfitCategoryLabels & {
  id: number;
  categoryName: string;
  sortOrder: number;
};

/** 카테고리 하나가 **이 키오스크에서** 어떻게 보이는가. */
export type KioskOutfitCategorySetting = OutfitCategoryLabels & {
  categoryId: number;
  /** 카테고리 코드. 앱이 의상 필터로 쓰는 값이라 화면에서 바꿀 수 없다. */
  categoryName: string;
  base: OutfitCategoryBase;
  hidden: boolean;
  /** 이 키오스크에 배정된 유효 의상 수. **0이면 숨김과 무관하게 탭이 안 나온다.** */
  assignedOutfitCount: number;
  /** `assignedOutfitCount > 0 && !hidden` */
  visible: boolean;
};

/**
 * PUT 요청 본문 — **전체 치환**이다.
 *
 * 보내지 않은 언어는 지워지는 게 아니라 카테고리 기본값으로 되돌아간다.
 * 화면이 8칸을 모두 들고 있으므로 늘 전체를 보낸다.
 */
export type KioskOutfitCategoryOverrideBody = OutfitCategoryLabels & {
  hidden: boolean;
};

/** 오버라이드가 하나라도 걸려 있는가(= 되돌리기를 쓸 수 있는가). */
export const hasOverride = (row: KioskOutfitCategorySetting): boolean =>
  row.hidden || OUTFIT_LABEL_FIELDS.some((f) => (row[f.key] ?? '') !== '');

/** 지금 이 키오스크에서 실제로 쓰이는 라벨(오버라이드 우선, 없으면 기본값). */
export const effectiveLabel = (
  row: KioskOutfitCategorySetting,
  key: OutfitCategoryLabelKey,
): string => row[key] || row.base?.[key] || '';
