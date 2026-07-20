import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGetAllOutfits } from '../../hooks/inventory-api/useGetAllOutfits';
import { useDeleteOutfit } from '../../hooks/inventory-api/useDeleteOutfit';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractPaginatedResult } from '../../utils/queryHelpers';
import { unwrapList } from '../../utils/unwrapApi';
import { buildKioskNameById } from '../../utils/kioskHelpers';
import { mapOutfitListItemToRow, type OutfitRow } from './outfitListMappers';
import { OUTFIT_PAGE_SIZE, OUTFIT_TABLE_MESSAGES } from './outfitListConfig';

export function useOutfitManageList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusParam = filter === 'ACTIVE' || filter === 'INACTIVE' ? filter : undefined;
  const typeParam =
    typeFilter === 'NORMAL' || typeFilter === 'PREMIUM' || typeFilter === 'SCHOOL_UNIFORM'
      ? typeFilter
      : undefined;

  const { data: outfitsData, isLoading: loading, error: outfitsError, refetch } = useGetAllOutfits({
    pageNum: page,
    pageSize: OUTFIT_PAGE_SIZE,
    keyword: debouncedSearch.trim() || undefined,
    status: statusParam,
    type: typeParam,
  });

  const { content: outfits, totalPages, totalElements } = extractPaginatedResult(outfitsData);

  const { data: kiosksData } = useGetKiosks();
  const kiosks = unwrapList(kiosksData) as { id: string | number; name: string }[];
  const kioskNameById = useMemo(() => buildKioskNameById(kiosks), [kiosks]);

  const errorMessage = outfitsError ? OUTFIT_TABLE_MESSAGES.loadError : '';

  const displayed = useMemo(() => (outfits as unknown[]).map(mapOutfitListItemToRow), [outfits]);

  useEffect(() => {
    setPage(1);
  }, [filter, typeFilter, debouncedSearch]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const { deleteOutfitAsync } = useDeleteOutfit();

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedId(null);
    setShowManageModal(true);
  }, []);

  const openEdit = useCallback((row: OutfitRow) => {
    setModalMode('edit');
    setSelectedId(row.id);
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((row: OutfitRow) => {
    setSelectedId(row.id);
    setSelectedName(row.displayName);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedId == null) return;
    setIsDeleting(true);
    try {
      await deleteOutfitAsync(selectedId);
      setShowDeleteModal(false);
      refetch();
    } catch {
      alert(OUTFIT_TABLE_MESSAGES.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedId, deleteOutfitAsync, refetch]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    loading,
    errorMessage,
    displayed,
    totalPages,
    totalCount: totalElements,
    kioskNameById,
    modalMode,
    selectedId,
    showManageModal,
    setShowManageModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedName,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
    refetch,
  };
}
