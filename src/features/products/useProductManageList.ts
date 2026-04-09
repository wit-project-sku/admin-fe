import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGetAllProducts } from '../../hooks/product-api/useGetAllProducts';
import { useDeleteProduct } from '../../hooks/product-api/useDeleteProduct';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractPaginatedResult } from '../../utils/queryHelpers';
import { filterProductsForTable } from './filterProductsForTable';
import { mapProductListItemToRow, type ProductRow } from './productListMappers';
import { PRODUCT_API_FETCH_SIZE, PRODUCT_PAGE_SIZE, PRODUCT_TABLE_MESSAGES } from './productListConfig';

export function useProductManageList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading: loading, error, refetch } = useGetAllProducts(
    1,
    PRODUCT_API_FETCH_SIZE,
    filter === 'ALL' ? undefined : filter,
  );
  const { content: products } = extractPaginatedResult(data);
  const { deleteProductAsync } = useDeleteProduct();

  const productRows = useMemo(() => (products as unknown[]).map(mapProductListItemToRow), [products]);

  const filtered = useMemo(
    () => filterProductsForTable(productRows, filter, debouncedSearch),
    [productRows, filter, debouncedSearch],
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCT_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const displayedProducts = useMemo(() => {
    const start = (page - 1) * PRODUCT_PAGE_SIZE;
    return filtered.slice(start, start + PRODUCT_PAGE_SIZE);
  }, [filtered, page]);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedProduct(null);
    setShowManageModal(true);
  }, []);

  const openEdit = useCallback((p: ProductRow) => {
    setSelectedProduct(p);
    setModalMode('edit');
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((p: ProductRow) => {
    setSelectedProduct(p);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedProduct?.id == null) return;
    setIsDeleting(true);
    try {
      await deleteProductAsync(selectedProduct.id);
      setShowDeleteModal(false);
      refetch();
    } catch {
      alert(PRODUCT_TABLE_MESSAGES.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedProduct, deleteProductAsync, refetch]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    loading,
    hasError: Boolean(error),
    displayedProducts,
    totalPages,
    totalCount,
    showManageModal,
    setShowManageModal,
    showDeleteModal,
    setShowDeleteModal,
    modalMode,
    selectedProduct,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
    refetch,
  };
}
