export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

const escapeCell = (v: string | number | null | undefined): string => {
  const text = v == null ? '' : String(v);
  // 엑셀이 수식으로 읽는 값(=, +, -, @ 로 시작)은 앞에 ' 를 붙여 글자로 둔다.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/**
 * CSV 로 내려받는다. 앞에 BOM 을 붙여 엑셀이 한글을 UTF-8 로 연다.
 */
export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const lines = [
    columns.map((c) => escapeCell(c.header)).join(','),
    ...rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(',')),
  ];
  const blob = new Blob(['﻿', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
