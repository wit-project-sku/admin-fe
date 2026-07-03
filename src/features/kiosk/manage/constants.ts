import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';

/** 그리드가 담을 수 있는 넉넉한 상한(줄 × 한 줄당). 표시/안내용. */
export const MAX_BUTTONS_PER_KIOSK = 40;

/** Page size for kiosk button manage lists (card grid + API pagination). */
export const KIOSK_BUTTON_MANAGE_PAGE_SIZE = 22;

/**
 * 키오스크 메인 화면 좌표 v2 (백엔드 V32와 일치):
 *   1열 = 공지 + 날씨(고정) · 2열 = 홈/검색/언어선택(고정)
 *   3~6열 = 이동 가능한 그리드(MAIN), 한 줄 4칸(1-based)
 *   7열 = 관광명소·사진촬영·화장실(고정) · 8열 = 배너(표시 전용)
 */
export const GRID_FIRST_LINE = 3;
export const GRID_LAST_LINE = 6;
export const SLOTS_PER_LINE = 4;
export const MAX_SPAN = 2;

/** 그리드(MAIN) 줄 선택 옵션 (3~6열). */
export const GRID_LINE_OPTIONS = [3, 4, 5, 6] as const;

/** 줄 안 시작 칸 선택 옵션 (1-based). */
export const POSITION_OPTIONS = [1, 2, 3, 4] as const;

/** 가로 점유 칸 수 옵션. */
export const SPAN_OPTIONS = [
  { value: 1, label: '1칸' },
  { value: 2, label: '2칸 (와이드)' },
] as const;

/** 위치 표기: "3열 1~2" / "4열 3". 파킹(line<1)은 '—'. */
export function positionLabel(line?: number | null, position?: number | null, span?: number | null): string {
  if (line == null || position == null || line < 1) return '—';
  const s = span === 2 ? `${position}~${position + 1}` : String(position);
  return `${line}열 ${s}`;
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

/** 버튼을 (line → position) 오름차순으로 정렬. */
export function sortByLinePosition(list: KioskButtonDto[]): KioskButtonDto[] {
  return [...list].sort(
    (a, b) => (a.line ?? 0) - (b.line ?? 0) || a.position - b.position || a.id - b.id,
  );
}
