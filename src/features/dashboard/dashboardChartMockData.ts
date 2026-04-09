/** Static chart datasets until trend/share APIs exist */

export const WEEKLY_TREND_MOCK = [
  { day: '월', thisWeek: 102, lastWeek: 88 },
  { day: '화', thisWeek: 95, lastWeek: 110 },
  { day: '수', thisWeek: 120, lastWeek: 105 },
  { day: '목', thisWeek: 135, lastWeek: 128 },
  { day: '금', thisWeek: 88, lastWeek: 92 },
  { day: '토', thisWeek: 110, lastWeek: 105 },
  { day: '일', thisWeek: 155, lastWeek: 140 },
];

export type PieSlice = { name: string; value: number; color: string };

export const MARKET_SHARE_MOCK: PieSlice[] = [
  { name: '화성(상)', value: 42, color: '#3b82f6' },
  { name: '화성(하)', value: 38, color: '#60a5fa' },
  { name: '인사동', value: 21, color: '#93c5fd' },
  { name: '강남', value: 15, color: '#bfdbfe' },
  { name: '제주', value: 8, color: '#dbeafe' },
];
