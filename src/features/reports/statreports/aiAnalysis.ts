// AI 종합 분석 — 실데이터 지표를 규칙 기반으로 문장화(무과금, 외부 API 불필요).
//
// ⚠️ 확장 지점: 추후 서버/외부 API(예: Gemini) 결과로 교체할 수 있도록 순수 함수로 분리했다.
//    교체 시 build*Ai(...) 반환 형태({ overall, sites })만 맞추면 뷰는 그대로 동작한다.
//    (뷰는 EditableAiCard 에 overall/sites 를 넘길 뿐, 생성 출처를 모른다.)
//
// 반환: overall/sites = string[][] — 각 항목 [강조어(head), 본문(body)]. EditableAiCard 가 <b>head</b>body 로 렌더.

/** 증감률(%) 계산 — prev<=0 이면 null */
function pct(cur: number, prev: number): number | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}

function trendWord(p: number | null): string {
  if (p == null) return '전기 대비 비교 기준 데이터가 없어 증감은 산출하지 않았습니다';
  if (p > 3) return `전기 대비 ${p.toFixed(1)}% 증가`;
  if (p < -3) return `전기 대비 ${Math.abs(p).toFixed(1)}% 감소`;
  return '전기 대비 보합';
}

/* ═══════════ 촬영 리포트 ═══════════ */

export type ShootingAiInput = {
  periodLabel: string; // '전주' | '전월'
  total: number;
  prevTotal: number;
  am: number;
  pm: number;
  peakHour: number; // -1 = 없음
  weekendRatio: number | null; // 0~1
  sites: { name: string; cur: number; prev: number }[];
  topOutfit?: { name: string; count: number } | null;
};

export function buildShootingAi(d: ShootingAiInput): { overall: string[][]; sites: string[][] } {
  const overall: string[][] = [];
  if (d.total === 0) return { overall: [], sites: [] };

  const p = pct(d.total, d.prevTotal);
  const delta = d.total - d.prevTotal;
  overall.push([
    `총 촬영 ${d.total.toLocaleString()}건`,
    ` — ${trendWord(p)}${p != null ? ` (${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString()}건)` : ''}.`,
  ]);

  const apTotal = d.am + d.pm;
  if (apTotal > 0) {
    const amR = Math.round((d.am / apTotal) * 100);
    const peak = d.peakHour >= 0 ? ` 피크 시간대는 ${d.peakHour}시입니다.` : '';
    overall.push([
      `오전 ${amR}% · 오후 ${100 - amR}%`,
      ` — ${amR >= 50 ? '오전 방문 비중이 높습니다' : '오후 집중형 방문 패턴입니다'}.${peak}`,
    ]);
  }

  if (d.weekendRatio != null) {
    const wr = Math.round(d.weekendRatio * 100);
    overall.push([
      `주말 비중 ${wr}%`,
      ` — ${wr >= 40 ? '주말 유입 의존도가 높아 평일 단체 관광 연계가 과제입니다' : '평일·주말이 비교적 고른 분포입니다'}.`,
    ]);
  }

  if (d.topOutfit && d.topOutfit.count > 0) {
    overall.push([`인기 의상 1위 ${d.topOutfit.name}(${d.topOutfit.count.toLocaleString()}건)`, ' — 대표 의상으로 재고·노출 우선순위 유지를 권장합니다.']);
  }

  // 키오스크별 — 증감 상·하위 위주로 요약
  const withPct = d.sites
    .map((sSite) => ({ ...sSite, p: pct(sSite.cur, sSite.prev) }))
    .sort((a, b) => b.cur - a.cur);
  const sites: string[][] = withPct.map((sSite) => {
    const share = d.total > 0 ? Math.round((sSite.cur / d.total) * 100) : 0;
    return [`${sSite.name}(${sSite.cur.toLocaleString()}건, 점유 ${share}%)`, `${trendWord(sSite.p)}.`];
  });

  return { overall, sites };
}

/* ═══════════ 버튼 사용 리포트 ═══════════ */

export type ButtonAiInput = {
  periodLabel: string;
  totalClicks: number;
  prevClicks: number;
  avgDurationSec: number;
  topButton?: { name: string; clicks: number } | null; // 클릭 1위
  longestButton?: { name: string; avgSec: number } | null; // 평균 체류 최장
  kiosks: { name: string; clicks: number; prevClicks: number; topButton?: string }[];
};

export function buildButtonAi(d: ButtonAiInput): { overall: string[][]; sites: string[][] } {
  const overall: string[][] = [];
  if (d.totalClicks === 0) return { overall: [], sites: [] };

  const p = pct(d.totalClicks, d.prevClicks);
  const delta = d.totalClicks - d.prevClicks;
  overall.push([
    `총 클릭 ${d.totalClicks.toLocaleString()}회`,
    ` — ${trendWord(p)}${p != null ? ` (${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString()}회)` : ''}. 평균 체류 ${Math.round(d.avgDurationSec)}초.`,
  ]);

  if (d.topButton && d.topButton.clicks > 0) {
    const share = Math.round((d.topButton.clicks / d.totalClicks) * 100);
    overall.push([`클릭 1위 ${d.topButton.name}(${d.topButton.clicks.toLocaleString()}회, ${share}%)`, ' — 홈 진입 후 대표 동선입니다.']);
  }
  if (d.longestButton && d.longestButton.avgSec > 0) {
    overall.push([`평균 체류 최장 ${d.longestButton.name}(${Math.round(d.longestButton.avgSec)}초)`, ' — 체류가 긴 콘텐츠형 버튼으로, 노출 상향 시 참여 확대 여지가 있습니다.']);
  }

  const sites: string[][] = [...d.kiosks]
    .sort((a, b) => b.clicks - a.clicks)
    .map((k) => {
      const kp = pct(k.clicks, k.prevClicks);
      const top = k.topButton ? ` ${k.topButton} 중심.` : '';
      return [`${k.name}(${k.clicks.toLocaleString()}회)`, `${trendWord(kp)}.${top}`];
    });

  return { overall, sites };
}
