import { getTodayKoreanWeekdayShort } from './dashboardWeekday';

type RechartsTickProps = { x?: number; y?: number; payload?: { value?: string } };

export function DashboardWeekdayAxisTick(props: RechartsTickProps) {
  const { x = 0, y = 0, payload } = props;
  const todayLabel = getTodayKoreanWeekdayShort();
  const isToday = payload?.value === todayLabel;

  return (
    <g transform={`translate(${x},${y})`}>
      {isToday ? <circle cx="0" cy="11" r="11" fill="#3b82f6" fillOpacity="0.12" /> : null}
      <text
        x={0}
        y={0}
        dy={15}
        textAnchor="middle"
        fill={isToday ? '#3b82f6' : '#94a3b8'}
        fontSize={10}
        fontWeight={isToday ? 900 : 700}
      >
        {payload?.value}
      </text>
    </g>
  );
}
