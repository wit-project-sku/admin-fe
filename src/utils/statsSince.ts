// 통계 집계 개시일 문구 — 대시보드 '총 누적 촬영', 아이콘 사용 분석 '총 클릭/총 사용 시간'에 표시.
// 개시일 = 통계 스키마(photo_shot·menu_touch) 도입일(admin-be V1, 2026-05-18).
export const STATS_SINCE = '2026-05-18';

/** "통계 집계 개시 2026. 5. 18. · 2개월 5일 경과" */
export function statsSinceLabel(since: string = STATS_SINCE): string {
  const st = new Date(`${since}T00:00:00`);
  if (Number.isNaN(st.getTime())) return '통계 집계 개시 후';
  const now = new Date();
  let y = now.getFullYear() - st.getFullYear();
  let m = now.getMonth() - st.getMonth();
  let d = now.getDate() - st.getDate();
  if (d < 0) { m -= 1; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y -= 1; m += 12; }
  const parts = [y > 0 ? `${y}년` : '', m > 0 ? `${m}개월` : '', `${d}일`].filter(Boolean).join(' ');
  return `통계 집계 개시 ${st.getFullYear()}. ${st.getMonth() + 1}. ${st.getDate()}. · ${parts} 경과`;
}
