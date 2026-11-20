/**
 * 영화 나눔 · admin-be `/api/admin/movie-share/*` (ADMIN 전용, 롯데 키오스크 W011~W013).
 * 사용자는 가운데를 가린 닉네임(`maskedUser`), 예매번호는 뒤 4자리만 온다. 시각은 KST.
 */

export type MovieShareCinema = {
  cinemaCode: string;
  cinemaName: string;
  /** 그 영화관에 놓인 키오스크 id. 없으면 null */
  kioskId: number | null;
  /** 그 달 그 영화관의 유효 인증 수 — 통계 응답에만 */
  verificationCount?: number;
};

export type MovieShareMonth = {
  /** yyyy-MM */
  month: string;
  verificationCount: number;
  shareCount: number;
  /** 영화관별 인증 수(많은 순). 나누기는 영화관에 묶이지 않아 없다. */
  cinemas: MovieShareCinema[];
};

export type MovieShareStats = {
  startDate: string;
  endDate: string;
  totalVerificationCount: number;
  totalShareCount: number;
  months: MovieShareMonth[];
};

export type MovieShareShare = {
  shareId: number;
  certificateNo: string;
  sharedAt: string;
  maskedUser: string;
  message: string | null;
};

export type VerificationStatus = 'ACTIVE' | 'CANCELLED';

export type MovieShareVerification = {
  verificationId: number;
  verifiedAt: string;
  maskedUser: string;
  maskedReservationNo: string;
  movieTitle: string;
  cinemaCode: string;
  cinemaName: string;
  screenName: string | null;
  kioskId: number | null;
  showStartAt: string;
  showEndAt: string;
  status: VerificationStatus;
  /** 이 필름을 이미 나누기에 썼는지 — true 면 취소해도 필름 수는 그대로 */
  used: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
};

export type VerificationListParams = {
  startDate?: string;
  endDate?: string;
  status?: VerificationStatus;
  cinemaCode?: string;
  /** 끝자리 일치 — 숫자 4~12자리 */
  reservationNo?: string;
  pageNum: number;
  pageSize: number;
};

export type MovieShareCancelResult = {
  verificationId: number;
  status: string;
  cancelledAt: string;
  /** 필름 1칸을 뺐는가 — 이미 나누기에 쓰인 필름이면 false */
  filmDeducted: boolean;
  /** 취소 뒤 그 사용자의 필름 수 */
  filmCount: number;
};
