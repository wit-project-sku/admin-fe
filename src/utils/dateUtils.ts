export const getTodayYmd = (): string => new Date().toISOString().split('T')[0]!;

export const getPastDateYmd = (days = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0]!;
};

/** Returns the first day of the current month (YYYY-MM-01) using the user's local calendar. */
export const getFirstOfMonthYmd = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/** Returns today as YYYY-MM-DD in the user's local calendar (safer than UTC-based `getTodayYmd`). */
export const getLocalTodayYmd = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCompactDateTime = (date: string | number | null | undefined, time: string | null | undefined): string => {
  if (!date || String(date).length !== 8) return '-';
  const v = String(date);
  const y = v.slice(0, 4);
  const m = v.slice(4, 6);
  const d = v.slice(6, 8);

  if (!time || String(time).length < 4) return `${y}.${m}.${d}`;
  const t = String(time);
  return `${y}.${m}.${d} ${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6) || '00'}`;
};
