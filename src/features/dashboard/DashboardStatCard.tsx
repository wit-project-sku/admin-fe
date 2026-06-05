import type { CSSProperties, ReactNode } from 'react';
import s from '@pages/DashboardPage.module.css';

export type DashboardStatCardProps = {
  title: string;
  value: ReactNode;
  unit?: string;
  color: string;
  icon: ReactNode;
  trendDiff?: number;
  onClick?: () => void;
};

function statCardTheme(accent: string): CSSProperties {
  return {
    ['--stat-accent' as string]: accent,
    ['--stat-card-bg' as string]: `color-mix(in srgb, ${accent} 12%, var(--bg-card))`,
    ['--stat-icon-bg' as string]: accent,
    ['--stat-border' as string]: `color-mix(in srgb, ${accent} 26%, var(--border))`,
  };
}

export function DashboardStatCard({
  title,
  value,
  unit = '건',
  color,
  icon,
  trendDiff,
  onClick,
}: DashboardStatCardProps) {
  return (
    <div
      className={`${s.statCard} ${onClick ? s.clickable : ''}`}
      style={statCardTheme(color)}
      onClick={onClick}
    >
      <div className={s.statTop}>
        <div className={s.statIcon}>{icon}</div>
        {trendDiff !== undefined && trendDiff !== 0 ? (
          <span className={`${s.trendBadge} ${trendDiff < 0 ? s.trendDown : s.trendUp}`}>
            {trendDiff < 0 ? '▼' : '▲'} {Math.abs(trendDiff).toLocaleString()}
          </span>
        ) : null}
        {onClick && (trendDiff === undefined || trendDiff === 0) ? <span className={s.viewBadge}>VIEW</span> : null}
      </div>
      <p className={s.statLabel}>{title}</p>
      <h3 className={s.statValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className={s.statUnit}>{unit}</span>
      </h3>
    </div>
  );
}
