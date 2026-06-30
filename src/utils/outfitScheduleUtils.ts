/** Normalize API date-ish values to `YYYY-MM-DD` for `<input type="date">` or display. */
export function toOutfitScheduleYmd(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return '';
}

export function pickOperationStartFromDetail(d: Record<string, unknown>): string {
  return toOutfitScheduleYmd(
    d.operationStartDate ??
      d.operation_start_date ??
      d.displayStartAt ??
      d.display_start_at ??
      d.validFrom ??
      d.valid_from ??
      d.startDate ??
      d.start_date,
  );
}

export function pickOperationEndFromDetail(d: Record<string, unknown>): string {
  return toOutfitScheduleYmd(
    d.operationEndDate ??
      d.operation_end_date ??
      d.displayEndAt ??
      d.display_end_at ??
      d.validUntil ??
      d.valid_until ??
      d.endDate ??
      d.end_date ??
      d.expiresAt ??
      d.expires_at,
  );
}

/** Table / summary: 한 줄 또는 두 줄 표현. */
export function formatOutfitScheduleShort(startYmd: string, endYmd: string): string {
  if (!startYmd && !endYmd) return '—';
  if (startYmd && !endYmd) return `${startYmd} ~ 무기한`;
  if (!startYmd && endYmd) return `~ ${endYmd}`;
  return `${startYmd} ~ ${endYmd}`;
}
