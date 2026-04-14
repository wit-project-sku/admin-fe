import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGetAllProducts } from '../../hooks/product-api/useGetAllProducts';
import { useDeleteProduct } from '../../hooks/product-api/useDeleteProduct';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractPaginatedResult } from '../../utils/queryHelpers';
import { mapProductListItemToRow, type ProductRow } from './productListMappers';
import { PRODUCT_PAGE_SIZE, PRODUCT_TABLE_MESSAGES } from './productListConfig';
import type { ProductStatus } from '../../hooks/product-api/productApiTypes';

export type ProductFilterTab = 'ALL' | ProductStatus;

export function useProductManageList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<ProductFilterTab>('ALL');
  const [page, setPage] = useState(1);

  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading: loading, error, refetch } = useGetAllProducts({
    pageNum: page,
    pageSize: PRODUCT_PAGE_SIZE,
    productStatus: filter === 'ALL' ? undefined : filter,
    keyword: debouncedSearch.trim() || undefined,
  });
  const { content: products, totalPages, totalElements: totalCount } = extractPaginatedResult(data);
  const { deleteProductAsync } = useDeleteProduct();

  const displayedProducts = useMemo(
    () => (products as unknown[]).map(mapProductListItemToRow),
    [products],
  );

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

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
