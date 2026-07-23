/** Tabs on 지점 성과 리포트 */
export type ReportTab = 'monthly' | 'daily' | 'ranking' | 'stats' | 'statreports';

/** Saved outfit filters after 사용자 clicks 조회 */
export type OutfitSubmittedFilters = {
  start: string;
  end: string;
  kioskId: string;
};
