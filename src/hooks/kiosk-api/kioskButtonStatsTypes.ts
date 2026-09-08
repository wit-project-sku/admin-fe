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
  /** 지점×버튼 상세 — `includeKioskDetails=true` 일 때만 온다.
   *  buttonDetails 는 버튼타입별 전 지점 합계(+대표지점)라 지점별 수치로 쓰면 안 된다. */
  kioskButtonDetails?: KioskButtonStatsKioskRow[];
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

/** 지점 하나의 버튼 하나 — 지점 간 합산이 없는 유일한 소스. */
export type KioskButtonStatsKioskRow = {
  kioskId: number;
  kioskName: string;
  buttonType: string;
  buttonName: string | null;
  iconKey: string | null;
  totalClicks: number;
  totalDuration: number;
  avgDuration: number;
};
