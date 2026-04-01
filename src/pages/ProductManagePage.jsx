import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import { getAllProducts, hardDeleteProduct } from '@apis/productApi';

import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import ProductManageModal from '@modals/ProductManageModal';
import DeleteModal from '@modals/DeleteModal';
import EditBtn from '../components/common/EditBtn';
import DeleteBtn from '../components/common/DeleteBtn';
import RegisterBtn from '../components/common/RegisterBtn';

export default function ProductManagePage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllProducts(page, pageSize);
      const payload = res?.data?.data ?? res?.data ?? res;
      setProducts(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const STATUS_FILTERS = [
    { key: 'ALL', label: '전체' },
    { key: 'ON_SALE', label: '판매중' },
    { key: 'SOLD_OUT', label: '품절' },
  ];

  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesFilter = filter === 'ALL' || p.status === filter;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, search]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await hardDeleteProduct(selectedProduct.id);
      setShowDeleteModal(false);
      fetchProducts();
    } catch {
      alert('삭제 실패');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={shared.pageContainer}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>상품 관리</h1>
          <p className={shared.pageSubtitle}>Product Inventory Management</p>
        </div>
        <RegisterBtn
          title='상품 등록'
          onClick={() => {
            setModalMode('create');
            setShowManageModal(true);
          }}
        />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
        >
          <FilterGroup filters={STATUS_FILTERS} current={filter} onFilterChange={setFilter} />
          <div style={{ flexShrink: 0 }}>
            <SearchBar value={search} onChange={setSearch} placeholder='상품명 검색...' minWidth='280px' />
          </div>
        </div>

        {/* 테이블 영역: 기존 방식으로 복구 */}
        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                <th className={shared.th}>상품명</th>
                <th className={`${shared.th} ${shared.thCenter}`}>카테고리</th>
                <th className={`${shared.th} ${shared.thRight}`}>가격</th>
                <th className={`${shared.th} ${shared.thCenter}`}>재고</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={shared.tdCenter} style={{ padding: '40px' }}>
                    불러오는 중...
                  </td>
                </tr>
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={shared.tdCenter} style={{ padding: '40px' }}>
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => (
                  <tr key={p.id} className={shared.tr}>
                    <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMono}`}>
                      #{String(p.id).padStart(3, '0')}
                    </td>
                    <td className={shared.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {p.images?.[0]?.imageUrl && (
                          <img
                            src={p.images[0].imageUrl}
                            alt=''
                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.subTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={shared.badge} style={{ background: '#f1f5f9' }}>
                        {p.categoryName}
                      </span>
                    </td>
                    <td className={`${shared.td} ${shared.tdRight}`}>
                      <strong>{p.price?.toLocaleString()}원</strong>
                    </td>
                    <td
                      className={`${shared.td} ${shared.tdCenter}`}
                      style={{ color: p.stock === 0 ? '#ef4444' : 'inherit' }}
                    >
                      {p.stock}
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span
                        className={`${shared.badge} ${p.status === 'ON_SALE' ? shared.badgeGreen : shared.badgeOrange}`}
                      >
                        {p.status === 'ON_SALE' ? '판매중' : '품절'}
                      </span>
                    </td>
                    <td className={shared.td}>
                      <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                        <EditBtn
                          onClick={() => {
                            setSelectedProduct(p);
                            setModalMode('edit');
                            setShowManageModal(true);
                          }}
                        />
                        <DeleteBtn
                          onClick={() => {
                            setSelectedProduct(p);
                            setShowDeleteModal(true);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={products.length}
          unit='종'
        />
      </div>

      {showManageModal && (
        <ProductManageModal
          open={showManageModal}
          mode={modalMode}
          product={selectedProduct}
          onClose={() => setShowManageModal(false)}
          onSuccess={() => {
            setShowManageModal(false);
            fetchProducts();
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          open={showDeleteModal}
          target={selectedProduct?.name}
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
