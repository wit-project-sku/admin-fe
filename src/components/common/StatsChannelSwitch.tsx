import { STATS_CHANNELS, useStatsChannelStore } from '@/stores/statsChannelStore';
import s from './StatsChannelSwitch.module.css';

/** 촬영 통계 주체 선택 — 키오스크 / WITS 앱 / 전체. 값은 화면 사이에서 공유된다. */
export function StatsChannelSwitch({ className, align = 'end' }: { className?: string; align?: 'start' | 'end' }) {
  const channel = useStatsChannelStore((st) => st.channel);
  const setChannel = useStatsChannelStore((st) => st.setChannel);
  const active = STATS_CHANNELS.find((c) => c.id === channel);

  return (
    <div className={`${s.wrap} ${align === 'start' ? s.alignStart : ''} ${className ?? ''}`}>
      <span className={s.label}>촬영 주체</span>
      <div className={s.segment} role='radiogroup' aria-label='촬영 통계 주체'>
        {STATS_CHANNELS.map((c) => (
          <button
            key={c.id}
            type='button'
            role='radio'
            aria-checked={channel === c.id}
            title={c.hint}
            className={`${s.btn} ${channel === c.id ? s.btnActive : ''} ${s[`tone${c.id}`] ?? ''}`}
            onClick={() => setChannel(c.id)}
          >
            <span className={s.dot} aria-hidden='true' />
            {c.label}
          </button>
        ))}
      </div>
      {active ? <span className={s.hint}>{active.hint}</span> : null}
    </div>
  );
}
