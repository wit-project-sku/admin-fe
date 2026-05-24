import type { CSSProperties, ReactNode } from 'react';
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
  trendPct,
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
