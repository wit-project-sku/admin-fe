// 실사 미러 위에 '기간 통계'를 얹는 읽기 전용 오버레이.
// 아이콘 등록 관리(편집)와 통계 리포트(읽기)가 같은 레이아웃을 쓰되, 리포트에서만 수치를 덧그린다.
import s from './kioskButtonStatOverlay.module.css';

/** buttonType → 해당 기간 집계. 리포트에서만 넘긴다(관리 화면은 undefined). */
export type ButtonStat = { clicks: number; durationSec: number; avgSec: number };
export type ButtonStatMap = Map<string, ButtonStat>;

/**
 * 타일 위 클릭 수 배지. 사용시간·평균체류는 옆 표에서 읽으므로 여기엔 클릭만 크게 둔다
 * (미러가 두 번 축소돼 작은 글자는 인쇄물에서 사라진다).
 * 위치는 절대 재배열하지 않고 클릭량은 배경 농도로만 표현한다.
 */
export function ButtonStatBadge({
  stat,
  max,
  unit,
}: {
  stat?: ButtonStat;
  /** 이 미러에서 가장 많이 클릭된 수 — 1위 강조 판정에만 쓴다 */
  max: number;
  /** 미러별 축소 방식이 달라 글자 단위를 나눈다 — cq: 컨테이너쿼리, board: 보드 원본 px */
  unit: 'cq' | 'board';
}) {
  if (!stat) return null;
  // 배경·글자색·크기는 모든 버튼이 같고, 1위만 조금 크고 굵게 구분한다.
  const isTop = max > 0 && stat.clicks === max;
  return (
    <span className={`${s.badge} ${s[unit]} ${isTop ? s.top : ''}`}>
      <b className={s.clicks}>{stat.clicks.toLocaleString()}회</b>
    </span>
  );
}
