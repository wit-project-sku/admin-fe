import type { AnalyticsFilters, DatePreset } from '../kioskAnalyticsMock';

export const TABLE_PAGE_SIZE = 8;

export const DATE_PRESETS: ReadonlyArray<[DatePreset, string]> = [
  ['today', '오늘'],
  ['7d', '최근 7일'],
  ['30d', '최근 30일'],
  ['custom', '직접 선택'],
];

export function defaultAnalyticsFilters(): AnalyticsFilters {
  return {
    preset: '7d',
    customStart: '',
    customEnd: '',
    city: '',
    kioskId: '',
    buttonType: '',
  };
}
