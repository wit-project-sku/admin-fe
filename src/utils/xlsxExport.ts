import * as XLSX from 'xlsx';

/** 엑셀 한 컬럼 정의: 헤더 + 행 → 셀 값 추출 함수. */
export type XlsxColumn<T> = {
  header: string;
  /** 셀 값(문자열/숫자). 숫자로 반환하면 엑셀에서 숫자 셀로 저장된다. */
  value: (row: T) => string | number | null | undefined;
  /** 열 너비(문자 수 기준, 선택). */
  width?: number;
};

/**
 * 행 배열을 진짜 .xlsx 파일로 즉시 다운로드한다(SheetJS). 필요없는 컬럼은 외주사 쪽에서 엑셀로 직접 편집 가능.
 *
 * @param filename 확장자 포함 파일명(예: `환불내역_20260720.xlsx`)
 * @param sheetName 시트 이름
 * @param columns  컬럼 정의(순서대로 열이 된다)
 * @param rows     데이터 행
 */
export function downloadXlsx<T>(
  filename: string,
  sheetName: string,
  columns: XlsxColumn<T>[],
  rows: T[],
): void {
  const header = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((c) => c.value(row) ?? ''));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);

  // 열 너비 지정(있으면)
  if (columns.some((c) => c.width != null)) {
    worksheet['!cols'] = columns.map((c) => ({ wch: c.width ?? 14 }));
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
