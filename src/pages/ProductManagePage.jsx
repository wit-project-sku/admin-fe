import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ProductManagePage.module.css';
import SearchPanel from '@components/common/SearchPanel';
import DataTable from '@components/common/DataTable';
import ProductManageModal from '@components/modal/ProductManageModal';
import DeleteModal from '@components/modal/DeleteModal';
import { getAllProducts, hardDeleteProduct } from '@apis/productApi';

const FILTERS = [
  { label: '전체', value: 'all' },
  { label: '판매중', value: 'selling' },
  { label: '품절', value: 'soldout' },
  { label: '숨김', value: 'hide' },
];

const SEARCH_OPTIONS = [{ label: '상품명', value: 'name' }];

const COLUMNS = ['No', '상태', '카테고리', '상품명', '상품 가격', '현재 재고', '관리'];
const GRID = '50px 90px 1fr 2fr 1fr 1fr 1fr';

const formatPrice = (value) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '-';
  return `${num.toLocaleString()}원`;
};

const mapStatusLabel = (status) => {
  if (status === 'ON_SALE') return '판매중';
  if (status === 'SOLD_OUT') return '품절';
  if (status === 'HIDDEN') return '숨김';
  return status ?? '-';
};

export default function ProductManagePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchType] = useState('name');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status =
        activeFilter === 'selling'
          ? 'ON_SALE'
          : activeFilter === 'soldout'
            ? 'SOLD_OUT'
            : activeFilter === 'hide'
              ? 'HIDDEN'
              : undefined;

      const res = await getAllProducts(page, pageSize, status);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setProducts(Array.isArray(payload?.content) ? payload.content : []);
      setTotalElements(typeof payload?.totalElements === 'number' ? payload.totalElements : 0);
      setTotalPages(typeof payload?.totalPages === 'number' ? payload.totalPages : 1);
    } catch (e) {
      setError(e);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((item) => (item?.name ?? '').toLowerCase().includes(keyword));
  }, [products, search]);

  const handleReset = () => {
    setActiveFilter('all');
    setSearch('');
    setStartDate('2026-01-01');
    setEndDate('2026-02-28');
    setPage(1);
  };

  const getStatusClass = (status) => {
    if (status === 'ON_SALE') return styles.statusSelling;
    if (status === 'SOLD_OUT') return styles.statusSoldout;
    return styles.statusHidden;
  };

  return (
    <div className={styles.container}>
      <SearchPanel
        filterLabel='상품 상태'
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showDateRange
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        searchLabel='상세 검색'
        searchOptions={SEARCH_OPTIONS}
        searchType={searchType}
        searchValue={search}
        onSearchValueChange={setSearch}
        searchPlaceholder='상품명을 입력해주세요'
        onSearch={fetchProducts}
        onReset={handleReset}
      />

      <DataTable
        title='상품 목록'
        total={totalElements || filteredData.length}
        columns={COLUMNS}
        gridTemplateColumns={GRID}
        data={filteredData}
        renderRow={(item, idx) => (
          <>
            <div>{(page - 1) * pageSize + idx + 1}</div>
            <div>
              <span className={getStatusClass(item.status)}>{mapStatusLabel(item.status)}</span>
            </div>
            <div>{item.categoryName ?? '-'}</div>
            <div>{item.name}</div>
            <div>{formatPrice(item.price)}</div>
            <div>{item.stock ?? '-'}</div>
            <div className={styles.actionIcons}>
              <button
                className={styles.actionBtn}
                type='button'
                aria-label='수정'
                onClick={() => {
                  setModalMode('edit');
                  setSelectedProduct(item);
                  setShowProductModal(true);
                }}
              >
                수정
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                type='button'
                aria-label='삭제'
                onClick={() => {
                  setDeleteTarget(item);
                  setShowDeleteModal(true);
                }}
              >
                삭제
              </button>
            </div>
          </>
        )}
        rowKey={(item, idx) => item.id ?? idx}
        loading={loading}
        error={error}
        errorMessage='상품 조회에 실패했습니다.'
        emptyMessage='검색 결과가 없습니다.'
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        toolbarRight={
          <button
            type='button'
            className={styles.addButton}
            onClick={() => {
              setModalMode('create');
              setSelectedProduct(null);
              setShowProductModal(true);
            }}
          >
            등록
          </button>
        }
      />

      {showProductModal && (
        <ProductManageModal
          mode={modalMode}
          initialProduct={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onSuccess={fetchProducts}
        />
      )}

      <DeleteModal
        open={showDeleteModal}
        title='상품을 삭제하시겠습니까?'
        message='삭제 이후에는 복구할 수 없습니다.'
        cancelText='취소'
        confirmText={deleting ? '삭제 중...' : '삭제하기'}
        onClose={() => {
          if (deleting) return;
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget?.id) return;
          try {
            setDeleting(true);
            await hardDeleteProduct(deleteTarget.id);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            await fetchProducts();
          } catch (e) {
            console.error(e);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
