import { formatDurationSeconds } from '../kioskFormatters';
import { statsSinceLabel } from '@/utils/statsSince';
import { formatReadableCount } from '@/utils/formatReadableCount';
import styles from './KioskAnalyticsPage.module.css';

type Props = {
  isLoading: boolean;
  /** 집계 블록이 없을 때(기간·조건에 맞는 데이터 없음) 안내 표시 */
  statsEmpty: boolean;
  totalClicks: number;
  totalDurationSec: number;
  avgSessionSec: number;
  activeRegionCount: number;
};

function Metric({ loading, value }: { loading: boolean; value: string }) {
  return <span className={styles.kpiValue}>{loading ? '…' : value}</span>;
}

export function KioskAnalyticsKpiSection({
  isLoading,
  statsEmpty,
  totalClicks,
  totalDurationSec,
  avgSessionSec,
  activeRegionCount,
}: Props) {
  return (
    <section className={styles.kpiSection} aria-label='요약 지표'>
      {statsEmpty ? (
        <p className={styles.kpiEmptyBanner} role='status'>
          선택한 기간·조건에 맞는 집계 데이터가 없습니다.
        </p>
      ) : null}
      <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>총 클릭</span>
        <Metric loading={isLoading} value={formatReadableCount(totalClicks)} />
        <span className={styles.kpiHint}>버튼 클릭 횟수 합계</span>
        <span className={styles.kpiHint}>{statsSinceLabel()}</span>
      </div>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>총 사용 시간</span>
        <Metric loading={isLoading} value={formatDurationSeconds(totalDurationSec)} />
        <span className={styles.kpiHint}>체류 시간 합계</span>
        <span className={styles.kpiHint}>{statsSinceLabel()}</span>
      </div>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>활동 지역 수</span>
        <Metric loading={isLoading} value={formatReadableCount(activeRegionCount)} />
        <span className={styles.kpiHint}>도시 활동 그래프 기준</span>
      </div>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>평균 체류</span>
        <Metric loading={isLoading} value={formatDurationSeconds(avgSessionSec)} />
        <span className={styles.kpiHint}>응답 평균 기준</span>
      </div>
      </div>
    </section>
  );
}
