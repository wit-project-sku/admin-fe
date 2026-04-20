import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import { formatDurationSeconds } from '../kioskFormatters';
import { formatReadableCount } from '@/utils/formatReadableCount';
import { KioskAppIconVisual } from '@/features/kiosk/kioskAppIcons';
import { resolveKioskButtonIconKey } from '@/features/kiosk/manage/kioskButtonDisplay';
import type { KioskAnalyticsTableRow } from './analyticsTypes';
import styles from './KioskAnalyticsPage.module.css';

type Props = {
  pageRows: KioskAnalyticsTableRow[];
  safePage: number;
  totalTablePages: number;
  tableTotalCount: number;
  onPageChange: (p: number) => void;
  isLoading: boolean;
  /** API 집계 블록이 없을 때 테이블 안내 문구 분기 */
  statsEmpty: boolean;
};

export function KioskAnalyticsAppTable({
  pageRows,
  safePage,
  totalTablePages,
  tableTotalCount,
  onPageChange,
  isLoading,
  statsEmpty,
}: Props) {
  const emptyMessage = statsEmpty
    ? '집계 데이터가 없어 버튼 상세를 표시할 수 없습니다.'
    : '표시할 버튼 상세 데이터가 없습니다.';

  return (
    <div className={shared.card}>
      <div className={shared.cardHead}>
        <span className={shared.cardTitle}>버튼 상세</span>
      </div>
      <div className={shared.tableResponsive}>
        <table className={shared.table}>
          <thead className={shared.thead}>
            <tr>
              <th className={shared.th}>버튼</th>
              <th className={shared.th}>키오스크</th>
              <th className={`${shared.th} ${shared.thRight}`}>총 클릭</th>
              <th className={`${shared.th} ${shared.thRight}`}>총 사용 시간</th>
              <th className={`${shared.th} ${shared.thRight}`}>평균 체류</th>
              <th className={shared.th}>최다 클릭 지역</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={shared.tableStateCell}>
                  불러오는 중…
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className={shared.tableStateCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className={shared.tr}>
                  <td className={shared.td}>
                    <div className={styles.appCell}>
                      <KioskAppIconVisual iconKey={resolveKioskButtonIconKey(row.iconKey)} tileSize={36} size={18} />
                      <div>
                        <div className={shared.tdBold}>{`${row.buttonName}=${row.buttonType}`}</div>
                        <div className={shared.tdSub}>위치 {row.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted}`}>{row.representativeKioskName}</td>
                  <td className={`${shared.td} ${shared.tdRight} ${styles.mono}`}>{formatReadableCount(row.totalClicks)}</td>
                  <td className={`${shared.td} ${shared.tdRight}`}>{formatDurationSeconds(row.totalDuration)}</td>
                  <td className={`${shared.td} ${shared.tdRight}`}>{formatDurationSeconds(row.avgDuration)}</td>
                  <td className={shared.td}>{row.mostClickedDistrict}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {tableTotalCount > 0 ? (
        <Pagination
          currentPage={safePage}
          totalPages={totalTablePages}
          onPageChange={onPageChange}
          totalCount={tableTotalCount}
          unit='건'
          formatTotalCount={formatReadableCount}
        />
      ) : null}
    </div>
  );
}
