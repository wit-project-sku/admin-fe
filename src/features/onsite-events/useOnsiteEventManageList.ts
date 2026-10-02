import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useOnsiteEventList, useOnsiteEventMutations } from '../../hooks/onsite-event-api/useOnsiteEvents';
import type { OnsiteEventDto } from '../../hooks/onsite-event-api/onsiteEventTypes';
import { buildYearFilters, ONSITE_EVENT_MESSAGES, ONSITE_EVENT_PAGE_SIZE } from './onsiteEventConfig';

/** 행사 등록 관리 — 의상 등록 관리(useOutfitManageList)와 같은 구성: 필터·검색·페이지 + 등록/수정/삭제 모달 상태. */
export function useOnsiteEventManageList() {
  const thisYear = useMemo(() => new Date().getFullYear(), []);
  const yearFilters = useMemo(() => buildYearFilters(thisYear), [thisYear]);

  const [yearFilter, setYearFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const list = useOnsiteEventList({
    pageNum: page,
    pageSize: ONSITE_EVENT_PAGE_SIZE,
    year: yearFilter === 'ALL' ? undefined : Number(yearFilter),
    keyword: debouncedSearch.trim() || undefined,
  });

  const { deleteAsync, isDeleting } = useOnsiteEventMutations();

  useEffect(() => {
    setPage(1);
  }, [yearFilter, debouncedSearch]);

  // 마지막 장의 마지막 행을 지우면 빈 장이 남지 않게 당긴다.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), list.totalPages));
  }, [list.totalPages]);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedId(null);
    setShowManageModal(true);
  }, []);

  const openEdit = useCallback((row: OnsiteEventDto) => {
    setModalMode('edit');
    setSelectedId(row.id);
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((row: OnsiteEventDto) => {
    setSelectedId(row.id);
    setSelectedName(row.name);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedId == null) return;
    try {
      await deleteAsync(selectedId);
      setShowDeleteModal(false);
    } catch {
      alert(ONSITE_EVENT_MESSAGES.deleteFailed);
    }
  }, [selectedId, deleteAsync]);

  return {
    yearFilters,
    yearFilter,
    setYearFilter,
    search,
    setSearch,
    page,
    setPage,
    rows: list.rows,
    loading: list.isPending,
    errorMessage: list.isError ? ONSITE_EVENT_MESSAGES.loadError : '',
    totalPages: list.totalPages,
    totalCount: list.totalElements,
    modalMode,
    selectedId,
    selectedName,
    showManageModal,
    setShowManageModal,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
  };
}
