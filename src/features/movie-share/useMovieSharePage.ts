import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  fetchSharesInRange,
  useMovieShareShares,
  useMovieShareStats,
  useMovieShareTotal,
  useMovieShareVerifications,
} from '../../hooks/movie-share-api/useMovieShare';
import type { MovieShareCinema, MovieShareVerification, VerificationStatus } from '../../hooks/movie-share-api/movieShareTypes';
import { downloadCsv } from '../../utils/csvExport';
import { branchCodeForCinema, useLotteBranches, type LotteBranchCode, type LotteBranchFilter } from '../lotte/lotteBranches';
import { firstOfMonthsAgo, ymd } from '../lotte/lotteFormat';
import {
  MOVIE_SHARE_MESSAGES,
  MOVIE_SHARE_PAGE_SIZE,
  RESERVATION_RE,
  SHARE_CSV_COLUMNS,
  cinemaCount,
  type MovieShareTab,
} from './movieShareConfig';

/** 영화 나눔 현황 — 기간·지점, 요약·월별 표, 인증 내역(취소)·나눔 내역(내려받기). */
export function useMovieSharePage() {
  const { branches } = useLotteBranches();
  // 서버 기본(이번 달을 포함한 최근 6개월)과 같은 기간으로 시작한다.
  const [startDate, setStartDate] = useState(() => firstOfMonthsAgo(5));
  const [endDate, setEndDate] = useState(() => ymd(new Date()));
  const [branch, setBranch] = useState<LotteBranchFilter>('');
  const [tab, setTab] = useState<MovieShareTab>('verifications');

  const [statusFilter, setStatusFilter] = useState<VerificationStatus | ''>('');
  const [reservation, setReservation] = useState('');
  const debouncedReservation = useDebouncedValue(reservation.trim(), 400);
  const [verPage, setVerPage] = useState(1);
  const [sharePage, setSharePage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<MovieShareVerification | null>(null);
  const [exporting, setExporting] = useState(false);

  const rangeError = startDate && endDate && startDate > endDate ? MOVIE_SHARE_MESSAGES.badRange : '';
  const reservationError =
    debouncedReservation && !RESERVATION_RE.test(debouncedReservation) ? MOVIE_SHARE_MESSAGES.badReservation : '';

  const { stats, isPending: statsLoading, isError: statsError } = useMovieShareStats(startDate, endDate, !rangeError);
  const totalShared = useMovieShareTotal();

  /** 기간 안에 나온 영화관(지점 코드가 붙는다). */
  const cinemas = useMemo(() => {
    const map = new Map<string, MovieShareCinema & { branchCode: LotteBranchCode | null }>();
    for (const m of stats?.months ?? []) {
      for (const c of m.cinemas ?? []) {
        if (!map.has(c.cinemaCode)) map.set(c.cinemaCode, { ...c, branchCode: branchCodeForCinema(c, branches) });
      }
    }
    return [...map.values()];
  }, [stats, branches]);

  const branchCinema = branch ? cinemas.find((c) => c.branchCode === branch) : undefined;
  /** 지점을 골랐는데 그 극장을 못 찾으면 인증 목록은 거를 수 없다 — 다른 극장이 섞이지 않게 비워 둔다. */
  const branchUnresolved = branch !== '' && !branchCinema;

  const hideVerifications = !!rangeError || branchUnresolved;
  const verifications = useMovieShareVerifications({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: statusFilter || undefined,
    cinemaCode: branchCinema?.cinemaCode,
    reservationNo: reservationError ? undefined : debouncedReservation || undefined,
    pageNum: verPage,
    pageSize: MOVIE_SHARE_PAGE_SIZE,
  }, !hideVerifications);
  const shares = useMovieShareShares(sharePage, MOVIE_SHARE_PAGE_SIZE);

  useEffect(() => {
    setVerPage(1);
  }, [startDate, endDate, statusFilter, branch, debouncedReservation]);

  useEffect(() => {
    setVerPage((p) => Math.min(Math.max(1, p), verifications.totalPages));
  }, [verifications.totalPages]);

  /** 요약 — 지점을 고르면 인증 수는 그 극장만, 나눔은 지점 구분이 없어 전체 그대로. */
  const summary = useMemo(() => {
    if (!stats) return { verifications: undefined, shares: undefined };
    if (!branch) return { verifications: stats.totalVerificationCount, shares: stats.totalShareCount };
    let sum = 0;
    let known = false;
    for (const m of stats.months) {
      for (const c of m.cinemas ?? []) {
        if (branchCodeForCinema(c, branches) !== branch) continue;
        const n = cinemaCount(c);
        if (n != null) {
          sum += n;
          known = true;
        }
      }
    }
    return { verifications: known || !branchCinema ? sum : undefined, shares: stats.totalShareCount };
  }, [stats, branch, branches, branchCinema]);

  const exportShares = useCallback(async () => {
    if (rangeError) {
      alert(rangeError);
      return;
    }
    setExporting(true);
    try {
      const rows = await fetchSharesInRange(startDate, endDate);
      if (rows.length === 0) {
        alert(MOVIE_SHARE_MESSAGES.exportEmpty);
        return;
      }
      downloadCsv(`영화나눔_나눔내역_${startDate || '처음'}_${endDate || '오늘'}.csv`, SHARE_CSV_COLUMNS, rows);
    } catch {
      alert(MOVIE_SHARE_MESSAGES.exportFailed);
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, rangeError]);

  return {
    branches,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    rangeError,
    branch,
    setBranch,
    tab,
    setTab,
    stats,
    statsLoading,
    statsError,
    cinemas,
    summary,
    totalShared,
    // 인증 내역
    statusFilter,
    setStatusFilter,
    reservation,
    setReservation,
    reservationError,
    branchUnresolved,
    verRows: hideVerifications ? [] : verifications.rows,
    verLoading: hideVerifications ? branchUnresolved && statsLoading : verifications.isPending,
    verError: !hideVerifications && verifications.isError ? MOVIE_SHARE_MESSAGES.listError : '',
    verEmpty: branchUnresolved
      ? MOVIE_SHARE_MESSAGES.noCinemaForBranch(branch)
      : rangeError || MOVIE_SHARE_MESSAGES.emptyVerifications,
    verPage,
    setVerPage,
    verTotalPages: verifications.totalPages,
    verTotal: hideVerifications ? 0 : verifications.totalElements,
    cancelTarget,
    openCancel: setCancelTarget,
    closeCancel: () => setCancelTarget(null),
    // 나눔 내역
    shareRows: shares.rows,
    shareLoading: shares.isPending,
    shareError: shares.isError ? MOVIE_SHARE_MESSAGES.listError : '',
    sharePage,
    setSharePage,
    shareTotalPages: shares.totalPages,
    shareTotal: shares.totalElements,
    exporting,
    exportShares,
  };
}
