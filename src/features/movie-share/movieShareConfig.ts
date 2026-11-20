import shared from '@commons/shared.module.css';
import type { MovieShareCinema, MovieShareShare, VerificationStatus } from '../../hooks/movie-share-api/movieShareTypes';
import type { CsvColumn } from '../../utils/csvExport';
import { formatDateTime } from '../lotte/lotteFormat';

export const MOVIE_SHARE_PAGE_SIZE = 20;
export const CANCEL_REASON_MAX = 200;
/** 예매번호 검색 — 끝자리 일치, 숫자 4~12자리(서버 규칙). */
export const RESERVATION_RE = /^\d{4,12}$/;

export type MovieShareTab = 'verifications' | 'shares';

export const VERIFICATION_STATUS_FILTERS: { key: VerificationStatus | ''; label: string }[] = [
  { key: '', label: '전체' },
  { key: 'ACTIVE', label: '유효' },
  { key: 'CANCELLED', label: '취소' },
];

export const VERIFICATION_STATUS_BADGE: Record<VerificationStatus, string> = {
  ACTIVE: `${shared.badge} ${shared.badgeGreen}`,
  CANCELLED: `${shared.badge} ${shared.badgeRed}`,
};

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  ACTIVE: '유효',
  CANCELLED: '취소',
};

/**
 * 통계 응답의 영화관별 인증 수. Swagger 의 `Cinema` 스키마가 다른 DTO 와 이름이 겹쳐 수 필드가 문서에 빠져 있어
 * 몇 가지 이름을 차례로 본다. 하나도 없으면 null(표에 '—').
 */
export const cinemaCount = (c: MovieShareCinema): number | null => {
  const raw = c as MovieShareCinema & { count?: number; verifications?: number };
  const v = raw.verificationCount ?? raw.count ?? raw.verifications;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

export const SHARE_CSV_COLUMNS: CsvColumn<MovieShareShare>[] = [
  { header: '증서 번호', value: (r) => r.certificateNo },
  { header: '나눈 시각', value: (r) => formatDateTime(r.sharedAt) },
  { header: '사용자', value: (r) => r.maskedUser },
  { header: '응원 한마디', value: (r) => r.message ?? '' },
];

export const MOVIE_SHARE_MESSAGES = {
  statsError: '통계를 불러오지 못했습니다.',
  listError: '목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  badRange: '시작일이 종료일보다 늦습니다.',
  badReservation: '예매번호는 숫자 4~12자리로 입력하세요(뒤 4자리만 넣어도 됩니다).',
  emptyVerifications: '조건에 맞는 인증 내역이 없습니다.',
  emptyShares: '나눔 내역이 없습니다.',
  noCinemaForBranch: (code: string) => `${code} 극장의 인증 기록을 아직 찾지 못했습니다(기간 안 인증 없음).`,
  cancelFailed: '인증을 취소하지 못했습니다.',
  cancelConflict: '이미 취소된 인증입니다. 목록을 새로 불러왔습니다.',
  exportEmpty: '이 기간에 나눔 내역이 없습니다.',
  exportFailed: '나눔 내역을 내려받지 못했습니다.',
} as const;
