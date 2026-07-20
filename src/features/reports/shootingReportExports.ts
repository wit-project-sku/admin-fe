import { APIService } from '../../utils/axios';
import { downloadXlsx, type XlsxColumn } from '../../utils/xlsxExport';
import type { MonthlyShootingSort } from '../../hooks/dashboard-api/useGetMonthlyShootingStats';
import { buildShootingStatsTableModel } from './shootingStatsMappers';

type Row = Record<string, string | number>;

/** 시간열 + 지점(키오스크)별 열 + 합계 열 정의. */
function buildColumns(timeKey: 'month' | 'date', timeHeader: string, kioskNames: string[]): XlsxColumn<Row>[] {
  return [
    { header: timeHeader, value: (r) => String(r[timeKey] ?? ''), width: 12 },
    ...kioskNames.map<XlsxColumn<Row>>((k) => ({ header: k, value: (r) => r[k] ?? 0, width: 12 })),
    { header: '합계', value: (r) => r.total ?? 0, width: 10 },
  ];
}

/**
 * 지점별 월별 상세 → 진짜 .xlsx. 화면의 현재 페이지가 아니라 <b>조회된 전체 데이터</b>를 추출하며,
 * 정렬(최신순/등록순)은 화면과 동일하게 반영한다(추출 시점에 pageSize=전체건수로 재조회).
 */
export async function downloadMonthlyShootingXlsx(
  monthSort: MonthlyShootingSort,
  totalElements: number,
): Promise<void> {
  const sort = monthSort === 'latest' ? 'DESC' : 'ASC';
  const raw = await APIService.private.get('/admin/stats/monthly', {
    params: { pageNum: 1, pageSize: Math.max(1, totalElements), sort },
  });
  const { rows, kioskNames } = buildShootingStatsTableModel(raw, 'month');
  if (rows.length === 0) return;
  downloadXlsx('지점_월별_상세.xlsx', '월별 상세', buildColumns('month', '월', kioskNames), rows);
}

/**
 * 지점별 일별 상세 → 진짜 .xlsx. <b>조회 기간(start~end) 내 전체 데이터</b>만 추출한다
 * (추출 시점에 동일 기간 + pageSize=전체건수로 재조회).
 */
export async function downloadDailyShootingXlsx(
  range: { start: string; end: string },
  totalElements: number,
): Promise<void> {
  if (!range.start || !range.end) return;
  const raw = await APIService.private.get('/admin/stats/daily', {
    params: { start: range.start, end: range.end, pageNum: 1, pageSize: Math.max(1, totalElements) },
  });
  const { rows, kioskNames } = buildShootingStatsTableModel(raw, 'date');
  if (rows.length === 0) return;
  downloadXlsx(
    `지점_일별_상세_${range.start}_${range.end}.xlsx`,
    '일별 상세',
    buildColumns('date', '일자', kioskNames),
    rows,
  );
}
