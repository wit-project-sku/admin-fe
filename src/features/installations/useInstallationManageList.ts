import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { isTestKiosk, useGetKiosks } from '../../hooks/useGetKiosks';
import { useInstallationList, useInstallationMutations } from '../../hooks/installation-api/useInstallations';
import type { InstallationSummaryDto } from '../../hooks/installation-api/installationTypes';
import { INSTALLATION_MESSAGES, INSTALLATION_PAGE_SIZE } from './installationConfig';

/** 설치 등록 관리 — 행사 등록 관리(useOnsiteEventManageList)와 같은 구성에 상세 보기 창을 더했다. */
export function useInstallationManageList() {
  const [kioskFilter, setKioskFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: kiosks } = useGetKiosks();
  const kioskOptions = useMemo(
    () => [
      { value: '', label: '전체 키오스크' },
      ...(Array.isArray(kiosks) ? kiosks : [])
        .filter((k) => !isTestKiosk(k.name))
        .map((k) => ({ value: String(k.id), label: k.name })),
    ],
    [kiosks],
  );

  const keyword = debouncedSearch.trim();
  const list = useInstallationList({
    pageNum: page,
    pageSize: INSTALLATION_PAGE_SIZE,
    kioskId: kioskFilter ? Number(kioskFilter) : undefined,
    keyword: keyword || undefined,
  });

  const { deleteAsync, isDeleting } = useInstallationMutations();

  useEffect(() => {
    setPage(1);
  }, [kioskFilter, debouncedSearch]);

  // 마지막 장의 마지막 행을 지우면 빈 장이 남지 않게 당긴다.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), list.totalPages));
  }, [list.totalPages]);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedId(null);
    setShowManageModal(true);
  }, []);

  const openDetail = useCallback((row: { id: number }) => {
    setSelectedId(row.id);
    setShowDetailModal(true);
  }, []);

  const openEdit = useCallback((row: { id: number }) => {
    setModalMode('edit');
    setSelectedId(row.id);
    setShowDetailModal(false);
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((row: Pick<InstallationSummaryDto, 'id' | 'clientName'>) => {
    setSelectedId(row.id);
    setSelectedName(row.clientName);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedId == null) return;
    try {
      await deleteAsync(selectedId);
      setShowDeleteModal(false);
    } catch (err) {
      // 404 = 이미 지워진 설치 정보. 지우려던 결과와 같으니 실패로 알리지 않는다.
      if (isAxiosError(err) && err.response?.status === 404) setShowDeleteModal(false);
      else alert(INSTALLATION_MESSAGES.deleteFailed);
    }
  }, [selectedId, deleteAsync]);

  const hasFilter = kioskFilter !== '' || keyword !== '';

  return {
    kioskOptions,
    kioskFilter,
    setKioskFilter,
    search,
    setSearch,
    page,
    setPage,
    rows: list.rows,
    loading: list.isPending,
    errorMessage: list.isError ? INSTALLATION_MESSAGES.loadError : '',
    emptyMessage: hasFilter ? INSTALLATION_MESSAGES.emptyFiltered : INSTALLATION_MESSAGES.empty,
    totalPages: list.totalPages,
    totalCount: list.totalElements,
    modalMode,
    selectedId,
    selectedName,
    showManageModal,
    setShowManageModal,
    showDetailModal,
    setShowDetailModal,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    openCreate,
    openDetail,
    openEdit,
    openDelete,
    confirmDelete,
  };
}
