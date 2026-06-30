import shared from '@commons/shared.module.css';

type DashboardChartFallbackProps = {
  variant: 'loading' | 'error' | 'empty';
  message?: string;
};

const DEFAULTS = {
  loading: '불러오는 중…',
  error: '차트 데이터를 불러오지 못했습니다.',
  empty: '표시할 데이터가 없습니다.',
};

export function DashboardChartFallback({ variant, message }: DashboardChartFallbackProps) {
  const text = message ?? DEFAULTS[variant];

  if (variant === 'loading') {
    return (
      <div style={{ padding: '24px 20px', minHeight: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={shared.skeletonLine} style={{ maxWidth: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontSize: 12,
        fontWeight: 600,
        color: variant === 'error' ? 'var(--red-text, #dc2626)' : 'var(--text-muted, #64748b)',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}
