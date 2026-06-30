import type { ReactNode } from 'react';
import s from '@pages/DashboardPage.module.css';

export type DashboardStatCardProps = {
  title: string;
  value: ReactNode;
  unit?: string;
  color: string;
  icon: ReactNode;
  trendPct?: number;
  onClick?: () => void;
};

export function DashboardStatCard({
  title,
  value,
  unit = '건',
  color,
  icon,
  trendPct,
  onClick,
}: DashboardStatCardProps) {
  return (
    <div className={`${s.statCard} ${onClick ? s.clickable : ''}`} onClick={onClick}>
      <div className={s.statTop}>
        <div className={s.statIcon} style={{ background: color }}>
          {icon}
        </div>
        {trendPct ? <span className={s.trendBadge}>▲ {trendPct}%</span> : null}
        {onClick && !trendPct ? <span className={s.viewBadge}>VIEW</span> : null}
      </div>
      <p className={s.statLabel}>{title}</p>
      <h3 className={s.statValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className={s.statUnit}>{unit}</span>
      </h3>
    </div>
  );
}
