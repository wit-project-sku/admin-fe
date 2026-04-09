import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGetAllOutfits } from '../../hooks/inventory-api/useGetAllOutfits';
import { useDeleteOutfit } from '../../hooks/inventory-api/useDeleteOutfit';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractPaginatedResult } from '../../utils/queryHelpers';
import { unwrapList } from '../../utils/unwrapApi';
import { buildKioskNameById } from '../../utils/kioskHelpers';
import { filterOutfitsForTable } from './filterOutfitsForTable';
import { mapOutfitListItemToRow, type OutfitRow } from './outfitListMappers';
import { OUTFIT_API_FETCH_SIZE, OUTFIT_PAGE_SIZE, OUTFIT_TABLE_MESSAGES } from './outfitListConfig';

export function useOutfitManageList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: outfitsData, isLoading: loading, error: outfitsError, refetch } = useGetAllOutfits(
    1,
    OUTFIT_API_FETCH_SIZE,
  );
  const { content: outfits } = extractPaginatedResult(outfitsData);

  const { data: kiosksData } = useGetKiosks();
  const kiosks = unwrapList(kiosksData) as { id: string | number; name: string }[];
  const kioskNameById = useMemo(() => buildKioskNameById(kiosks), [kiosks]);

  const errorMessage = outfitsError ? OUTFIT_TABLE_MESSAGES.loadError : '';

  const outfitRows = useMemo(() => (outfits as unknown[]).map(mapOutfitListItemToRow), [outfits]);

  const filtered = useMemo(
    () => filterOutfitsForTable(outfitRows, filter, debouncedSearch),
    [outfitRows, filter, debouncedSearch],
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / OUTFIT_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const displayed = useMemo(() => {
    const start = (page - 1) * OUTFIT_PAGE_SIZE;
    return filtered.slice(start, start + OUTFIT_PAGE_SIZE);
  }, [filtered, page]);

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
    page,
    setPage,
    loading,
    errorMessage,
    displayed,
    totalPages,
    totalCount,
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
