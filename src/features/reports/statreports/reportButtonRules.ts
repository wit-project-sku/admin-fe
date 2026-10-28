// 버튼 사용 통계 — 모든 지점에 공통인 집계 규칙.

/**
 * 홈 버튼은 집계하지 않는다(2026-10-28 사용자 결정) — 홈 화면의 홈 버튼은 터치해도 아무 일이 없고,
 * 앱도 터치를 기록하지 않아 언제나 '0회'만 나온다. 모든 지점의 홈 버튼 button_type 이 '홈'(슬롯 아이콘01)이라
 * 새 키오스크가 들어와도 같은 규칙이 적용된다.
 */
export function isHomeButton(buttonType: string | null | undefined): boolean {
  return (buttonType ?? '').trim() === '홈';
}
