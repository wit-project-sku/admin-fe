import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGetAllShops } from '../../hooks/shop-api/useGetAllShops';
import { useDeleteShop } from '../../hooks/shop-api/useDeleteShop';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractPaginatedResult } from '../../utils/queryHelpers';
import { unwrapList } from '../../utils/unwrapApi';
import { mapShopListItemToRow, type ShopRow } from './shopsListMappers';
import { SHOP_PAGE_SIZE, SHOP_TABLE_MESSAGES } from './shopsListConfig';

export type KioskOption = { key: string; label: string };

export function useShopsManageList() {
  const [selectedKioskId, setSelectedKioskId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedShop, setSelectedShop] = useState<ShopRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: kiosksData, isLoading: kiosksLoading } = useGetKiosks();
  const kioskOptions = useMemo<KioskOption[]>(() => {
    const list = unwrapList(kiosksData) as { id?: number | string; name?: string }[];
    return list
      .filter((k) => k?.id != null)
      .map((k) => ({ key: String(k.id), label: String(k.name ?? `키오스크 ${k.id}`) }));
  }, [kiosksData]);

  // 키오스크 목록이 로드되면 첫 번째 키오스크를 기본 선택한다.
  useEffect(() => {
    if (selectedKioskId == null && kioskOptions.length > 0) {
      setSelectedKioskId(Number(kioskOptions[0].key));
    }
  }, [kioskOptions, selectedKioskId]);

  const { data, isLoading, error, refetch } = useGetAllShops({
    kioskId: selectedKioskId,
    keyword: debouncedSearch,
    pageNum: page,
    pageSize: SHOP_PAGE_SIZE,
  });
  const { content: shops, totalPages, totalElements: totalCount } = extractPaginatedResult(data);
  const { deleteShopAsync } = useDeleteShop();

  const displayedShops = useMemo(
    () => (shops as unknown[]).map(mapShopListItemToRow),
    [shops],
  );

  // 키오스크 변경 또는 검색어 변경 시 1페이지로.
  useEffect(() => {
    setPage(1);
  }, [selectedKioskId, debouncedSearch]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const setKiosk = useCallback((key: string) => {
    setSelectedKioskId(Number(key));
  }, []);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedShop(null);
    setShowManageModal(true);
  }, []);

  const openEdit = useCallback((s: ShopRow) => {
    setSelectedShop(s);
    setModalMode('edit');
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((s: ShopRow) => {
    setSelectedShop(s);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedShop?.id == null) return;
    setIsDeleting(true);
    try {
      await deleteShopAsync(selectedShop.id);
      setShowDeleteModal(false);
      refetch();
    } catch {
      alert(SHOP_TABLE_MESSAGES.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedShop, deleteShopAsync, refetch]);

  return {
    selectedKioskId,
    kioskOptions,
    setKiosk,
    search,
    setSearch,
    page,
    setPage,
    loading: isLoading || (kiosksLoading && selectedKioskId == null),
    hasError: Boolean(error),
    noKiosk: !kiosksLoading && kioskOptions.length === 0,
    displayedShops,
    totalPages,
    totalCount,
    showManageModal,
    setShowManageModal,
    showDeleteModal,
    setShowDeleteModal,
    modalMode,
    selectedShop,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
    refetch,
  };
}
