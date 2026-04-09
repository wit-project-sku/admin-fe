const KOREAN_WEEKDAYS_SHORT = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function getTodayKoreanWeekdayShort(): string {
  return KOREAN_WEEKDAYS_SHORT[new Date().getDay()] ?? '월';
}
