// 실사 미러 위에 '기간 통계'를 얹는 읽기 전용 오버레이.
// 아이콘 등록 관리(편집)와 통계 리포트(읽기)가 같은 레이아웃을 쓰되, 리포트에서만 수치를 덧그린다.
import s from './kioskButtonStatOverlay.module.css';

/** buttonType → 해당 기간 집계. 리포트에서만 넘긴다(관리 화면은 undefined). */
export type ButtonStat = { clicks: number; durationSec: number; avgSec: number };
export type ButtonStatMap = Map<string, ButtonStat>;

function fmtDur(sec: number): string {
  const v = Math.max(0, Math.round(sec));
  if (v < 60) return `${v}초`;
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/**
 * 타일 위에 겹치는 수치 배지. 버튼 이미지를 가리지 않도록 하단에 얇게 깐다.
 * 클릭 수에 따라 배경 농도를 달리해 '어느 자리가 많이 눌렸는지'가 배치 그대로 보이게 한다.
 */
export function ButtonStatBadge({
  stat,
  max,
  unit,
}: {
  stat?: ButtonStat;
  max: number;
  /** 미러별 축소 방식이 달라 글자 단위를 나눈다 — cq: 컨테이너쿼리, board: 보드 원본 px */
  unit: 'cq' | 'board';
}) {
  if (!stat) return null;
  const ratio = max > 0 ? stat.clicks / max : 0;
  const level = stat.clicks === 0 ? 0 : ratio >= 0.5 ? 3 : ratio >= 0.15 ? 2 : 1;
  return (
    <span className={`${s.badge} ${s[unit]} ${s[`lv${level}`]}`}>
      <b className={s.clicks}>{stat.clicks.toLocaleString()}</b>
      <span className={s.sub}>
        {fmtDur(stat.durationSec)} · {Math.round(stat.avgSec)}초
      </span>
    </span>
  );
}
