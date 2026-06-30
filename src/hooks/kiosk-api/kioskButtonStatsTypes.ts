/** `GET /admin/stats/buttons/summary` — nested shapes under `data.content[]`. */
export type KioskButtonStatsNamedValue = {
  buttonType: string;
  /** 집계 값(클릭 차트는 횟수, 사용 시간 차트는 초) */
  value: number;
  buttonName: string;
};

export type KioskButtonStatsChartPoint = {
  label: string;
  clicks: number;
  /** 사용 시간(초) */
  duration: number;
};

export type KioskButtonStatsDetailRow = {
  kioskId: number;
  representativeKioskName: string;
  buttonType: string;
  iconKey: string;
  position: number;
  totalClicks: number;
  buttonName: string;
  /** 총 사용 시간(초) */
  totalDuration: number;
  /** 평균 체류(초) */
  avgDuration: number;
  mostClickedDistrict: string;
};

export type KioskButtonStatsSummaryBlock = {
  totalClicks: number;
  /** 총 사용 시간(초) */
  totalDuration: number;
  /** 평균 체류(초) */
  avgDuration: number;
  statsByClicks: KioskButtonStatsNamedValue[];
  statsByDurations: KioskButtonStatsNamedValue[];
  chartData: KioskButtonStatsChartPoint[];
  cityActivityGraph: KioskButtonStatsNamedValue[];
  kioskUsageGraph: KioskButtonStatsNamedValue[];
  buttonDetails: KioskButtonStatsDetailRow[];
};

export type KioskButtonStatsSummaryPage = {
  content: KioskButtonStatsSummaryBlock[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type KioskButtonStatsSummaryResponse = {
  success: boolean;
  code: number;
  message: string;
  data: KioskButtonStatsSummaryPage;
};

export type KioskButtonStatsSummaryParams = {
  startDate: string;
  endDate: string;
  pageNum: number;
  pageSize: number;
  kioskId?: number;
  buttonType?: string;
  city?: string;
};
