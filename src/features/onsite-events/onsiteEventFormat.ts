// 행사 촬영 통계 — 날짜·숫자 표시 규칙(목록·드롭다운·리포트·PDF 파일명이 같은 규칙을 쓴다).

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `yyyy-MM-dd` 의 요일(한 글자). 시간대 영향을 받지 않도록 UTC 로 계산한다. */
export function weekdayOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? '';
}

/** "2026-10-14 ~ 10-18" — 종료일은 같은 해면 월-일만, 해가 바뀌면 전체. */
export function formatPeriodShort(startDate: string, endDate: string): string {
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  return `${startDate} ~ ${sameYear ? endDate.slice(5) : endDate}`;
}

/** "2026-10-14 (수)" */
export function formatDateWithWeekday(ymd: string): string {
  return `${ymd} (${weekdayOf(ymd)})`;
}

/** "10/17" */
export function formatMonthDay(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** "2026-09-30T10:00:00" → "2026-09-30" */
export function formatCreatedDate(createdAt: string | null | undefined): string {
  return createdAt ? createdAt.slice(0, 10) : '—';
}

export function formatCount(n: number): string {
  return n.toLocaleString('ko-KR');
}

/** 일평균 — 소수 1자리(서버 값 그대로, 표기만 맞춘다). */
export function formatAverage(n: number): string {
  return n.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** 파일명에 쓸 수 없는 문자를 걷어 낸다(행사명은 자유 글이다). */
function safeFilePart(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '').trim() || '행사';
}

/** `행사촬영리포트_{행사명}_{YYYYMMDD}-{YYYYMMDD}.pdf` */
export function buildReportFileName(name: string, startDate: string, endDate: string): string {
  const compact = (ymd: string) => ymd.replace(/-/g, '');
  return `행사촬영리포트_${safeFilePart(name)}_${compact(startDate)}-${compact(endDate)}.pdf`;
}
