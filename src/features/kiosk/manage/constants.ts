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

/** 키오스크별 테마(실기기 디자인 근사) — 인사동=코랄, 오색=네이비, 화성=그린. */
export type KioskTheme = {
  accent: string;
  bg: string;
  tileBg: string;
  location: string;
};

export function kioskTheme(kioskId?: number, kioskName?: string): KioskTheme {
  const name = kioskName ?? '';
  if (kioskId === 4 || name.includes('오색') || name.includes('오산')) {
    return { accent: '#1C5FA8', bg: '#EAF3FB', tileBg: '#F4F9FE', location: '오색시장' };
  }
  if (kioskId === 5 || name.includes('화성') || name.includes('휴게소')) {
    // 화성휴게소 실기기 테마 = 파란색(Figma). 오색(네이비)과 구분되는 밝은 블루.
    return { accent: '#2680EB', bg: '#E9F3FC', tileBg: '#F2F8FE', location: '화성휴게소' };
  }
  return { accent: '#E8663C', bg: '#FBF3E6', tileBg: '#FBEFE0', location: '인사동' };
}

/** 파스텔 타일 배경 팔레트 — position 인덱스로 순환(이미지 없는 버튼용). */
const TILE_PALETTE = [
  '#FDE6DA', '#E9DCC3', '#CFE3F7', '#F5D9C9', '#F3E3B8', '#CBE7DC',
  '#F7D6E0', '#E7DFF7', '#DDEBC6', '#FBE1B8', '#D7ECF5', '#F5DCE6',
];
export function tileBgFor(seed: number): string {
  return TILE_PALETTE[Math.abs(seed) % TILE_PALETTE.length];
}

/** 버튼을 (line → position) 오름차순으로 정렬. */
export function sortByLinePosition(list: KioskButtonDto[]): KioskButtonDto[] {
  return [...list].sort(
    (a, b) => (a.line ?? 0) - (b.line ?? 0) || a.position - b.position || a.id - b.id,
  );
}
