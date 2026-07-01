import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';

/** 그리드가 담을 수 있는 넉넉한 상한(줄 × 한 줄당). 표시/안내용. */
export const MAX_BUTTONS_PER_KIOSK = 40;

/** Page size for kiosk button manage lists (card grid + API pagination). */
export const KIOSK_BUTTON_MANAGE_PAGE_SIZE = 22;

/** 한 줄당 버튼 수 기본값 / 최대값 (백엔드 kiosk.buttonsPerLine 과 일치). */
export const DEFAULT_BUTTONS_PER_LINE = 4;
export const MAX_BUTTONS_PER_LINE = 4;

/** 레이아웃 미리보기의 "한 줄당 버튼 수" 선택 옵션 (자유 조절, 최대 4). */
export const BUTTONS_PER_LINE_OPTIONS = [1, 2, 3, 4] as const;

/** 줄별 최대 버튼 수 선택 옵션 (보통 3~4, 최대 4). */
export const LINE_CAPACITY_OPTIONS = [3, 4] as const;

/** 줄별 기본 용량: 상단 2줄은 3칸, 그 외는 buttonsPerLine. 백엔드 capacityForLine 과 동일 규칙. */
export const TOP_DEFAULT_NARROW_LINES = 2;
export const TOP_DEFAULT_LINE_CAPACITY = 3;

/**
 * 줄의 유효 용량(1~4). 명시 용량(lineCapacities[line])이 있으면 그 값,
 * 없으면 상단 2줄은 기본 3칸, 그 외는 buttonsPerLine.
 */
export function resolveLineCapacity(
  lineCapacities: number[] | undefined,
  line: number,
  buttonsPerLine: number,
): number {
  const base = Math.max(1, Math.min(MAX_BUTTONS_PER_LINE, buttonsPerLine || DEFAULT_BUTTONS_PER_LINE));
  const explicit = lineCapacities?.[line];
  if (explicit != null && explicit >= 1 && explicit <= MAX_BUTTONS_PER_LINE) {
    return explicit;
  }
  if (line < TOP_DEFAULT_NARROW_LINES) {
    return Math.min(TOP_DEFAULT_LINE_CAPACITY, base);
  }
  return base;
}

/** 버튼 배치 유형 옵션. MAIN=그리드 관리 대상, FIXED/OFF_MAIN=레이아웃 예외. */
export const PLACEMENT_OPTIONS = [
  { value: 'MAIN', label: '그리드' },
  { value: 'FIXED', label: '고정' },
  { value: 'OFF_MAIN', label: '미표시' },
] as const;

export function placementLabel(p?: string): string {
  if (p === 'FIXED') return '고정';
  if (p === 'OFF_MAIN') return '미표시';
  return '그리드';
}

/** 추가 모달의 줄(line) 선택 옵션 (0-based). */
export const LINE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** 줄 안에서의 위치(position) 선택 옵션 (0-based, 최대 4칸). */
export const POSITION_IN_LINE_OPTIONS = [0, 1, 2, 3] as const;

/** 버튼을 (line → position) 오름차순으로 정렬. */
export function sortByLinePosition(list: KioskButtonDto[]): KioskButtonDto[] {
  return [...list].sort(
    (a, b) => (a.line ?? 0) - (b.line ?? 0) || a.position - b.position || a.id - b.id,
  );
}

/** 레거시(flat 1~22) — 남아있는 참조 호환용. 신규 UI 는 (line, position) 사용. */
export const POSITIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const;
