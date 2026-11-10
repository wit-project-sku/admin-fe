// 제주국제공항(W008)·제주국제여객터미널(W009) 리포트 규칙 — 미러(JejuAirportStatsMirror)와 집계(LiveReportViews)가 함께 쓴다.
// 두 지점은 키오스크 앱에서 같은 4·3·4 홈(2026-10-29)을 쓰고 두 칸만 다르다(렌트카 ↔ 크루즈 운항, 제주공항 안내 ↔ 여객터미널 안내).
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';

/** 4·3·4 홈을 쓰는 제주 지점. 세계자연유산본부(W010)는 홈이 달라 아직 리포트 대상이 아니다. */
export type JejuCardsVenue = 'airport' | 'terminal';

/** 키오스크가 4·3·4 제주 홈이면 그 지점, 아니면 null(id 또는 이름). */
export function jejuCardsVenueOf(kioskId?: number, kioskName = ''): JejuCardsVenue | null {
  if (kioskId === 8 || kioskName.includes('제주국제공항')) return 'airport';
  if (kioskId === 9 || kioskName.includes('제주국제여객터미널')) return 'terminal';
  return null;
}

/**
 * 4·3·4 홈에서 빠진 버튼 — 기부·위드마켓·TAX-FREE. 제주공항은 2026-10-28 '준비중'(회색·터치 불가)이 됐다가 10-29 개편에서
 * 화면에서 빠졌다(V205 에서 행 삭제). 여객터미널은 처음부터 이 홈으로 열었고 V212 에서 행을 지웠다.
 * 리포트 집계 대상이 아니다(2026-10-28 사용자 결정) — 행이 지워지기 전 기간의 클릭도 세지 않는다.
 */
export const JEJU_AIRPORT_COMING_SOON = new Set([
  '#W008_아이콘16',
  '#W008_아이콘05',
  '#W008_아이콘10',
  '#W009_아이콘16',
  '#W009_아이콘05',
  '#W009_아이콘10',
]);

/** 이 행이 '준비중' 버튼인가. button_name 이 없으면(예전 이름으로 쌓인 기록) 등록 버튼 목록에서 같은 이름으로 찾는다. */
export function isJejuAirportComingSoon(
  row: { buttonName?: string | null; buttonType: string },
  buttons: readonly KioskButtonDto[],
): boolean {
  const name = row.buttonName ?? buttons.find((b) => (b.buttonType ?? '').trim() === row.buttonType.trim())?.buttonName;
  return !!name && JEJU_AIRPORT_COMING_SOON.has(name);
}
