import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';

import { isTestKiosk, useGetKiosks } from '../../hooks/useGetKiosks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  useBodyMeasurementDetail,
  useBodyMeasurementList,
  useDeleteBodyMeasurement,
} from '../../hooks/body-measurement-api/useBodyMeasurements';
import type {
  BodyMeasurementFilterParams,
  BodyMeasurementShooterFilter,
  BodyMeasurementShotType,
} from '../../hooks/body-measurement-api/bodyMeasurementTypes';
import { downloadBodyMeasurementXlsx } from './bodyMeasurementExport';
import { defaultDateRange, kioskShortName, shortEventId } from './bodyMeasurementFormat';

/** 서버 기본값(50)과 같게 — 한 장에 50행. */
export const BODY_MEASUREMENT_PAGE_SIZE = 50;

export type ShotTypeFilter = 'ALL' | BodyMeasurementShotType;
export type SuccessFilter = 'ALL' | 'true' | 'false';
export type ShooterFilter = 'ALL' | BodyMeasurementShooterFilter;

export const SHOT_TYPE_OPTIONS: { key: ShotTypeFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'SOLO', label: '혼자찍기' },
  { key: 'TOGETHER', label: '같이찍기' },
];

export const SUCCESS_OPTIONS: { key: SuccessFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'true', label: '성공' },
  { key: 'false', label: '실패' },
];

export const SHOOTER_OPTIONS: { key: ShooterFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'SUBMITTED', label: '입력' },
  { key: 'NOT_SUBMITTED', label: '미입력' },
];

export const BODY_MEASUREMENT_MESSAGES = {
  loadError: '체형 측정 데이터를 불러오지 못했습니다.',
  empty: '조건에 맞는 측정 데이터가 없습니다.',
  emptyByEventId: '이 eventId 의 측정 데이터가 없습니다.',
  detailError: '상세 정보를 불러오지 못했습니다.',
  deleted: '체형 측정 데이터가 삭제되었습니다.',
  deleteFailed: '삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  exportEmpty: '내보낼 데이터가 없습니다.',
  exportFailed: '엑셀 내려받기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  copied: 'eventId 를 복사했습니다.',
  copyFailed: '복사하지 못했습니다.',
} as const;

/** 서버 거절 문구(400 STATS4110·404 STATS4109 등)를 그대로 보여 준다. */
function serverMessage(err: unknown): string | null {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | string | undefined;
    if (typeof body === 'string' && body.trim()) return body.trim();
    const msg = body && typeof body === 'object' ? body.message : undefined;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return null;
}

const NOTICE_MS = 3200;
/** 같은 대상의 이미지 재요청 간격 하한 — 이보다 빨리 또 깨지면 만료가 아니라고 본다. */
const RETRY_WINDOW_MS = 60_000;

/**
 * 체형 측정 데이터 화면 상태 — 필터(칩)·eventId 찾기·페이지·선택 행(상세)·삭제·엑셀·알림.
 *
 * 사진 주소는 300초짜리 서명 주소다. 목록은 페이지를 다시 받을 때 새 주소가 오고, 상세는 열 때마다 새로 부른다.
 * 그래도 화면을 오래 켜 두면 만료되므로 이미지가 깨지면 **한 번만** 다시 받는다(같은 응답으로 두 번 재시도하지 않음).
 */
export function useBodyMeasurementPage() {
  // 처음 연 날의 기본 기간 — '초기화' 버튼을 보일지 가르는 기준.
  const [initialRange] = useState(() => defaultDateRange());
  const [range, setRange] = useState(initialRange);
  const [kioskIds, setKioskIds] = useState<number[]>([]);
  const [shotType, setShotType] = useState<ShotTypeFilter>('ALL');
  const [success, setSuccess] = useState<SuccessFilter>('ALL');
  const [shooter, setShooter] = useState<ShooterFilter>('ALL');
  const [eventIdInput, setEventIdInput] = useState('');
  const eventIdQuery = useDebouncedValue(eventIdInput.trim(), 300);
  const [page, setPage] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const flash = useCallback((text: string, ok = true) => {
    setNotice({ text, ok });
    if (noticeTimer.current != null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current != null) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  // 지점 칩 — 기존 키오스크 목록 API. 사내 테스트 단말(HQ)은 다른 선택 목록처럼 감춘다.
  const { data: kioskData, isLoading: kiosksLoading } = useGetKiosks();
  const kioskOptions = useMemo(
    () =>
      (kioskData ?? [])
        .filter((k) => !isTestKiosk(k.name))
        .map((k) => ({ id: k.id, name: k.name, label: kioskShortName(k.name) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [kioskData],
  );

  /** eventId 로 찾을 때는 그 촬영 하나만 찾는다 — 기간 밖의 삭제 요청도 찾을 수 있게 다른 필터는 싣지 않는다. */
  const searchingByEventId = eventIdQuery.length > 0;

  const filters = useMemo<BodyMeasurementFilterParams>(() => {
    if (searchingByEventId) return { eventId: eventIdQuery };
    return {
      startDate: range.start || undefined,
      endDate: range.end || undefined,
      kioskIds: kioskIds.length > 0 ? [...kioskIds].sort((a, b) => a - b) : undefined,
      shotType: shotType === 'ALL' ? undefined : shotType,
      isSuccess: success === 'ALL' ? undefined : success === 'true',
      shooter: shooter === 'ALL' ? undefined : shooter,
    };
  }, [searchingByEventId, eventIdQuery, range.start, range.end, kioskIds, shotType, success, shooter]);

  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const list = useBodyMeasurementList({ ...filters, pageNum: page, pageSize: BODY_MEASUREMENT_PAGE_SIZE });

  // 마지막 장의 마지막 행을 지우면 빈 장이 남지 않게 당긴다.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), list.totalPages));
  }, [list.totalPages]);

  // 선택한 행이 지금 목록에 없으면(필터·페이지 이동) 상세를 닫는다.
  // eventId 로 찾아 한 건만 나오면 바로 연다 — 삭제 요청 대응 흐름.
  useEffect(() => {
    if (list.isFetching) return;
    if (searchingByEventId && list.rows.length === 1) {
      setSelectedEventId(list.rows[0].eventId);
      return;
    }
    setSelectedEventId((cur) => (cur && list.rows.some((r) => r.eventId === cur) ? cur : null));
  }, [list.rows, list.isFetching, searchingByEventId]);

  const selectedRow = useMemo(
    () => list.rows.find((r) => r.eventId === selectedEventId) ?? null,
    [list.rows, selectedEventId],
  );

  const detail = useBodyMeasurementDetail(selectedEventId);

  // ── 서명 주소 만료 대응 ──
  // 이미지가 깨지면 한 번 다시 받는다. 다시 받은 주소도 곧바로 깨지면(만료가 아닌 다른 이유) 더 부르지 않는다 —
  // 같은 대상에 대한 재시도는 RETRY_WINDOW_MS 안에 한 번뿐이라 무한 재요청이 생기지 않고,
  // 화면을 오래 켜 둬서 또 만료되면(창이 지난 뒤) 다시 한 번 받는다.
  const listKey = `${filterKey}|${page}`;
  const thumbRetry = useRef<{ key: string; at: number } | null>(null);
  const onThumbError = useCallback(() => {
    const now = Date.now();
    const last = thumbRetry.current;
    if (last && last.key === listKey && now - last.at < RETRY_WINDOW_MS) return;
    thumbRetry.current = { key: listKey, at: now };
    void list.refetch();
  }, [list, listKey]);

  const photoRetry = useRef<{ key: string; at: number } | null>(null);
  const [photoBrokenFor, setPhotoBrokenFor] = useState<string | null>(null);
  const onPhotoError = useCallback(() => {
    if (!selectedEventId) return;
    const now = Date.now();
    const last = photoRetry.current;
    if (last && last.key === selectedEventId && now - last.at < RETRY_WINDOW_MS) {
      setPhotoBrokenFor(selectedEventId); // 다시 받은 주소도 깨졌다 → 자리표시로.
      return;
    }
    photoRetry.current = { key: selectedEventId, at: now };
    void detail.refetch();
  }, [detail, selectedEventId]);
  const photoBroken = !!selectedEventId && photoBrokenFor === selectedEventId;

  const toggleRow = useCallback((eventId: string) => {
    // 다시 열면 사진도 처음부터 다시 시도한다(상세 API 는 열 때마다 새로 부른다).
    photoRetry.current = null;
    setPhotoBrokenFor(null);
    setSelectedEventId((cur) => (cur === eventId ? null : eventId));
  }, []);

  const changeStart = useCallback((start: string) => {
    setRange((r) => ({ start, end: start && r.end && start > r.end ? start : r.end }));
  }, []);
  const changeEnd = useCallback((end: string) => {
    setRange((r) => ({ start: end && r.start && end < r.start ? end : r.start, end }));
  }, []);

  const resetRange = useCallback(() => setRange(initialRange), [initialRange]);

  const toggleKiosk = useCallback((id: number) => {
    setKioskIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }, []);

  const filtersAreDefault = useMemo(() => {
    return (
      range.start === initialRange.start &&
      range.end === initialRange.end &&
      kioskIds.length === 0 &&
      shotType === 'ALL' &&
      success === 'ALL' &&
      shooter === 'ALL'
    );
  }, [initialRange, range.start, range.end, kioskIds.length, shotType, success, shooter]);

  const resetFilters = useCallback(() => {
    setRange(initialRange);
    setKioskIds([]);
    setShotType('ALL');
    setSuccess('ALL');
    setShooter('ALL');
  }, [initialRange]);

  const copyEventId = useCallback(
    async (eventId: string) => {
      try {
        await navigator.clipboard.writeText(eventId);
        flash(BODY_MEASUREMENT_MESSAGES.copied);
      } catch {
        flash(BODY_MEASUREMENT_MESSAGES.copyFailed, false);
      }
    },
    [flash],
  );

  const { deleteAsync, isDeleting } = useDeleteBodyMeasurement();

  const openDelete = useCallback(() => {
    if (selectedEventId) setShowDeleteModal(true);
  }, [selectedEventId]);

  const confirmDelete = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      const res = await deleteAsync(selectedEventId);
      const msg = (res as { message?: unknown } | null)?.message;
      setShowDeleteModal(false);
      setSelectedEventId(null);
      flash(typeof msg === 'string' && msg.trim() ? msg : BODY_MEASUREMENT_MESSAGES.deleted);
    } catch (err) {
      setShowDeleteModal(false);
      // 404(이미 지워짐)면 목록을 다시 받아 행을 치운다.
      if (isAxiosError(err) && err.response?.status === 404) {
        setSelectedEventId(null);
        void list.refetch();
      }
      flash(serverMessage(err) ?? BODY_MEASUREMENT_MESSAGES.deleteFailed, false);
    }
  }, [selectedEventId, deleteAsync, flash, list]);

  const exportFileName = searchingByEventId
    ? `체형측정_${shortEventId(eventIdQuery)}.xlsx`
    : `체형측정_${range.start}_${range.end}.xlsx`;

  const exportXlsx = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const count = await downloadBodyMeasurementXlsx(filters, exportFileName);
      if (count === 0) flash(BODY_MEASUREMENT_MESSAGES.exportEmpty, false);
      else flash(`${count.toLocaleString('ko-KR')}행을 엑셀로 내려받았습니다.`);
    } catch (err) {
      // 400 STATS4110(5만 행 초과)은 서버 문구 그대로.
      flash(serverMessage(err) ?? BODY_MEASUREMENT_MESSAGES.exportFailed, false);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, filters, exportFileName, flash]);

  return {
    // 필터
    range,
    defaultRange: initialRange,
    resetRange,
    changeStart,
    changeEnd,
    kioskIds,
    setKioskIds,
    toggleKiosk,
    kioskOptions,
    kiosksLoading,
    shotType,
    setShotType,
    success,
    setSuccess,
    shooter,
    setShooter,
    filtersAreDefault,
    resetFilters,
    eventIdInput,
    setEventIdInput,
    searchingByEventId,
    // 목록
    page,
    setPage,
    rows: list.rows,
    totalCount: list.totalElements,
    totalPages: list.totalPages,
    loading: list.isPending,
    errorMessage: list.isError ? BODY_MEASUREMENT_MESSAGES.loadError : '',
    emptyMessage: searchingByEventId ? BODY_MEASUREMENT_MESSAGES.emptyByEventId : BODY_MEASUREMENT_MESSAGES.empty,
    onThumbError,
    // 상세
    selectedEventId,
    selectedRow,
    toggleRow,
    detail: detail.detail,
    detailPending: detail.isPending,
    detailError: detail.isError,
    photoBroken,
    onPhotoError,
    copyEventId,
    // 삭제
    showDeleteModal,
    setShowDeleteModal,
    openDelete,
    confirmDelete,
    isDeleting,
    // 엑셀
    exportXlsx,
    isExporting,
    // 알림
    notice,
  };
}
