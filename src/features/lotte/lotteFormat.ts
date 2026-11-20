/** `2026-11-02T10:30:00` → `2026-11-02 10:30` */
export const formatDateTime = (value?: string | null): string => (value ? value.replace('T', ' ').slice(0, 16) : '—');

/** `2026-11-02T10:30:00` → `11.02 10:30` */
export const formatShortDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const v = value.replace('T', ' ');
  return `${v.slice(5, 7)}.${v.slice(8, 10)} ${v.slice(11, 16)}`;
};

/** 상영 일시 — `11.02 10:30~12:40` */
export const formatShowtime = (start?: string | null, end?: string | null): string => {
  if (!start) return '—';
  const endTime = end ? end.replace('T', ' ').slice(11, 16) : '';
  return `${formatShortDateTime(start)}${endTime ? `~${endTime}` : ''}`;
};

/** 75 → `1:15` */
export const formatDuration = (sec?: number | null): string => {
  if (sec == null || !Number.isFinite(sec)) return '';
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** 로컬 달력 기준 yyyy-MM-dd */
export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 이번 달을 포함한 최근 n개월의 첫날 — 서버 기본 기간(6개월)과 맞춘다. */
export const firstOfMonthsAgo = (monthsBack: number): string => {
  const d = new Date();
  return ymd(new Date(d.getFullYear(), d.getMonth() - monthsBack, 1));
};

export const formatCount = (n?: number | null): string => (n == null ? '—' : n.toLocaleString('ko-KR'));
