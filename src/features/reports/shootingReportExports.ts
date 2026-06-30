import { downloadOutfitCsv } from '../../utils/outfitReportUtils';

function monthlyExportTag(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return new Date().toISOString().slice(0, 10);
  if (rows.length === 1) return String(rows[0]?.month ?? '').trim() || 'export';
  const first = String(rows[0]?.month ?? '').trim();
  const last = String(rows[rows.length - 1]?.month ?? '').trim();
  return first && last ? `${first}_${last}` : first || 'export';
}

/** 월별 상세 테이블 → CSV (UTF-8 BOM, Excel 호환). */
export function downloadMonthlyShootingCsv(
  rows: Record<string, string | number>[],
  kioskNames: string[],
): void {
  if (rows.length === 0) return;
  const headers = ['Month', ...kioskNames, 'Total'];
  const dataRows = rows.map((row) => [
    String(row.month ?? ''),
    ...kioskNames.map((k) => row[k] ?? 0),
    row.total ?? 0,
  ]);
  downloadOutfitCsv(`지점_월별_상세_${monthlyExportTag(rows)}.csv`, headers, dataRows);
}

/** 일별 상세 테이블 → CSV. */
export function downloadDailyShootingCsv(
  rows: Record<string, string | number>[],
  kioskNames: string[],
  range: { start: string; end: string },
): void {
  if (rows.length === 0) return;
  const s = range.start?.trim();
  const e = range.end?.trim();
  const tag = s && e ? `${s}_${e}` : 'export';
  const headers = ['Date', ...kioskNames, 'Total'];
  const dataRows = rows.map((row) => [
    String(row.date ?? ''),
    ...kioskNames.map((k) => row[k] ?? 0),
    row.total ?? 0,
  ]);
  downloadOutfitCsv(`지점_일별_상세_${tag}.csv`, headers, dataRows);
}
