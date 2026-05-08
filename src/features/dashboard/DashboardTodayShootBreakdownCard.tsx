import shared from '@commons/shared.module.css';
import s from '@pages/DashboardPage.module.css';

export type TodayShootBreakdownItem = { label: string; value: number };

type DashboardTodayShootBreakdownCardProps = {
  items: TodayShootBreakdownItem[];
  loading: boolean;
  error: boolean;
};

export function DashboardTodayShootBreakdownCard({
  items,
  loading,
  error,
}: DashboardTodayShootBreakdownCardProps) {
  return (
    <div className={`${shared.card} ${s.todayShootBreakdownCard}`}>
      <div className={s.todayShootBreakdownHead}>
        <span className={shared.cardTitle}>오늘 촬영 상세</span>
      </div>
      <div className={s.todayShootBreakdownBody}>
        {loading ? (
          <p className={s.todayShootBreakdownMuted}>불러오는 중…</p>
        ) : error ? (
          <p className={s.todayShootBreakdownError}>데이터를 불러오지 못했습니다.</p>
        ) : (
          <div className={s.todayShootBreakdownRow}>
            {items.map((row) => (
              <div key={row.label} className={s.todayShootBreakdownCell}>
                <div className={s.todayShootBreakdownLabel}>{row.label}</div>
                <div className={s.todayShootBreakdownValue}>
                  {row.value.toLocaleString()}
                  <span className={s.todayShootBreakdownUnit}>건</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
