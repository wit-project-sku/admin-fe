import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ProductManagePage.module.css';
import ProductManageModal from '@components/modal/ProductManageModal';
import DeleteModal from '@components/modal/DeleteModal';
import updateIcon from '@assets/images/update.png';
import deleteIcon from '@assets/images/delete.png';
import searchIcon from '@assets/images/search.png';
import { getAllProducts, hardDeleteProduct } from '@apis/productApi';

export default function ProductManagePage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 5;
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // 페이지 버튼 목록 생성(최대 5개 노출)
  const pages = useMemo(() => {
    const maxButtons = 5;
    const tp = Math.max(1, totalPages);
    const current = Math.min(Math.max(1, page), tp);

    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = Math.min(tp, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const arr = [];
    for (let p = start; p <= end; p += 1) arr.push(p);
    return arr;
  }, [page, totalPages]);

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <div className={styles.titleWithButton}>
          <span className={styles.title}>상품 관리</span>
          <button
            type='button'
            className={styles.addButton}
            onClick={() => {
              setModalMode('create');
              setSelectedProduct(null);
              setShowProductModal(true);
            }}
          >
            추가
          </button>
        </div>
      </div>

      <div className={styles.topBar}>
        <div className={styles.searchBoxWide}>
          <input
            type='text'
            className={styles.searchInputWide}
            placeholder='상품명을 입력해주세요'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.searchIcon} aria-hidden='true'>
            <img src={searchIcon} alt='검색' />
          </div>

          <div className={styles.filterButtons}>
            <button
              className={activeFilter === 'all' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('all')}
              type='button'
            >
              전체
            </button>
            <button
              className={activeFilter === 'selling' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('selling')}
              type='button'
            >
              판매중
            </button>
            <button
              className={activeFilter === 'soldout' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('soldout')}
              type='button'
            >
              품절
            </button>
            <button
              className={activeFilter === 'hide' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('hide')}
              type='button'
            >
              숨김
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div>순번</div>
          <div>상품명</div>
          <div>카테고리</div>
          <div>가격</div>
          <div>현재 재고</div>
          <div>상태</div>
          <div>비고</div>
        </div>
        {loading && <div className={styles.noData}>불러오는 중...</div>}
        {error && <div className={styles.noData}>상품 조회에 실패했습니다.</div>}
        {!loading && !error && filteredData.length === 0 && <div className={styles.noData}>검색 결과가 없습니다.</div>}
        {!loading && !error && (
          <>
            {filteredData.map((item, idx) => (
              <div className={styles.tableRow} key={item.id ?? idx}>
                <div>{(page - 1) * pageSize + idx + 1}</div>
                <div>{item.name}</div>
                <div>{item.categoryName ?? '-'}</div>
                <div>{formatPrice(item.price)}</div>
                <div>{item.stock ?? '-'}</div>
                <div
                  className={
                    item.status === 'ON_SALE'
                      ? styles.statusSelling
                      : item.status === 'SOLD_OUT'
                        ? styles.statusSoldout
                        : styles.statusHidden
                  }
                >
                  {mapStatusLabel(item.status)}
                </div>
                <div className={styles.actionIcons}>
                  <button
                    className={styles.iconButton}
                    aria-label='수정'
                    type='button'
                    onClick={() => {
                      setModalMode('edit');
                      setSelectedProduct(item);
                      setShowProductModal(true);
                    }}
                  >
                    <img src={updateIcon} alt='수정' />
                  </button>
                  <button
                    className={styles.iconButton}
                    aria-label='삭제'
                    type='button'
                    onClick={() => {
                      setDeleteTarget(item);
                      setShowDeleteModal(true);
                    }}
                  >
                    <img src={deleteIcon} alt='삭제' />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          type='button'
          aria-label='이전 페이지'
          onClick={() => setPage((p) => (p > 1 ? p - 1 : p))}
        >
          &lt;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={p === page ? styles.pageButtonActive : styles.pageButton}
            type='button'
            onClick={() => setPage(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          className={styles.pageButton}
          type='button'
          aria-label='다음 페이지'
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
        >
          &gt;
        </button>
      </div>
      {showProductModal && (
        <ProductManageModal
          mode={modalMode}
          initialProduct={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onSuccess={() => {
            fetchProducts();
          }}
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
