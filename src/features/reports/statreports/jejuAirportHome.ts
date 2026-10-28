// 제주국제공항(W008) 리포트 규칙 — 미러(JejuAirportStatsMirror)와 집계(LiveReportViews)가 함께 쓴다.
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';

/** 제주국제공항 홈 미러·규칙을 쓰는 키오스크(id 또는 이름). 여객터미널·유산본부는 아직 리포트 대상이 아니다. */
export function isJejuAirportKiosk(kioskId?: number, kioskName = ''): boolean {
  return kioskId === 8 || kioskName.includes('제주국제공항');
}

/**
 * 2026-10-28 홈 개편으로 '준비중'(회색·터치 불가)이 된 버튼 — 기부·위드마켓·TAX-FREE.
 * 리포트 집계 대상이 아니다(2026-10-28 사용자 결정) — 개편 전 기간의 클릭도 세지 않는다.
 */
export const JEJU_AIRPORT_COMING_SOON = new Set(['#W008_아이콘16', '#W008_아이콘05', '#W008_아이콘10']);

/** 이 행이 '준비중' 버튼인가. button_name 이 없으면(예전 이름으로 쌓인 기록) 등록 버튼 목록에서 같은 이름으로 찾는다. */
export function isJejuAirportComingSoon(
  row: { buttonName?: string | null; buttonType: string },
  buttons: readonly KioskButtonDto[],
): boolean {
  const name = row.buttonName ?? buttons.find((b) => (b.buttonType ?? '').trim() === row.buttonType.trim())?.buttonName;
  return !!name && JEJU_AIRPORT_COMING_SOON.has(name);
}
