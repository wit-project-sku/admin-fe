/**
 * WITS 앱 관리 화면 공통 시각 변환.
 * 서버는 KST `yyyy-MM-ddTHH:mm:ss`, 입력창(datetime-local)은 `yyyy-MM-ddTHH:mm` — 분 단위까지만 다룬다.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** 서버 시각 → 화면 표시 `2026.10.14 09:00`. 값이 없으면 '-'. */
export function formatDateTime(v: string | null | undefined): string {
  if (!v) return '-';
  const s = v.replace(' ', 'T');
  const date = s.slice(0, 10).replace(/-/g, '.');
  const time = s.slice(11, 16);
  return time ? `${date} ${time}` : date;
}

/** 서버 날짜 → `2026.10.14`. */
export function formatDate(v: string | null | undefined): string {
  if (!v) return '-';
  return v.slice(0, 10).replace(/-/g, '.');
}

/** 기간 표시 — 같은 날이면 날짜를 한 번만. */
export function formatDateTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const a = formatDateTime(start);
  const b = formatDateTime(end);
  if (start && end && start.slice(0, 10) === end.slice(0, 10)) return `${a} ~ ${b.slice(11)}`;
  return `${a} ~ ${b}`;
}

/** 서버 시각 → datetime-local 입력값(초 버림). */
export function toInputDateTime(v: string | null | undefined): string {
  if (!v) return '';
  return v.replace(' ', 'T').slice(0, 16);
}

/** datetime-local 입력값 → 서버 시각(`…:00`). */
export function toServerDateTime(v: string): string {
  return v.length === 16 ? `${v}:00` : v;
}

/** 지금(브라우저 현지 시각 = KST 가정)을 datetime-local 형식으로. */
export function nowInputDateTime(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 빈 문자열이면 null — 선택 입력칸을 서버에 넘길 때. */
export const blankToNull = (v: string): string | null => (v.trim() ? v.trim() : null);

const MB = 1024 * 1024;

/** 장당 용량 초과면 안내 문구, 괜찮으면 null. */
export function fileTooBigMessage(file: File, maxBytes: number): string | null {
  if (file.size <= maxBytes) return null;
  return `‘${file.name}’ 이(가) 너무 큽니다(${(file.size / MB).toFixed(1)}MB, 장당 최대 ${Math.round(maxBytes / MB)}MB).`;
}
