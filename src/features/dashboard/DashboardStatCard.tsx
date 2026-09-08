import type { CSSProperties, ReactNode } from 'react';
import s from '@pages/DashboardPage.module.css';

export type DashboardStatCardProps = {
  title: string;
  value: ReactNode;
  unit?: string;
  color: string;
  icon: ReactNode;
  /** Positive = up vs prior period, negative = down. Badge shows absolute difference. */
  trendDiff?: number;
  /** When true, renders the trend badge (including when diff is 0). */
  hasTrendBadge?: boolean;
  /** 값 아래 보조 문구(예: 통계 집계 개시 경과) */
  subHint?: string;
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
  hasTrendBadge = false,
  subHint,
  onClick,
}: DashboardStatCardProps) {
  const showTrend = hasTrendBadge;
  const diff = typeof trendDiff === 'number' && Number.isFinite(trendDiff) ? trendDiff : 0;
  const trendMagnitude = Math.abs(diff);
  const trendClass = diff < 0 ? s.trendDown : diff > 0 ? s.trendUp : s.trendFlat;
  const trendIcon = diff < 0 ? '▼' : diff > 0 ? '▲' : '—';

  return (
    <div
      className={`${s.statCard} ${onClick ? s.clickable : ''}`}
      style={statCardTheme(color)}
      onClick={onClick}
    >
      <div className={s.statTop}>
        <div className={s.statIcon}>{icon}</div>
        {onClick && !showTrend ? <span className={s.viewBadge}>VIEW</span> : null}
      </div>
      <p className={s.statLabel}>{title}</p>
      <div className={s.statValueRow}>
        <h3 className={s.statValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className={s.statUnit}>{unit}</span>
        </h3>
        {showTrend ? (
          <span className={`${s.trendBadge} ${trendClass}`}>
            {trendIcon} {trendMagnitude.toLocaleString()}
          </span>
        ) : null}
      </div>
      {subHint ? (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{subHint}</p>
      ) : null}
    </div>
  );
}
