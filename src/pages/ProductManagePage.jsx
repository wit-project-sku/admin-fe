import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import { getAllProducts, hardDeleteProduct } from '@apis/productApi';
import ProductManageModal from '@modals/ProductManageModal';
import DeleteModal from '@modals/DeleteModal';

const STATUS_FILTERS = [
  { key: 'all',      label: '전체' },
  { key: 'selling',  label: '판매중' },
  { key: 'soldout',  label: '품절' },
  { key: 'hide',     label: '숨김' },
];

const STATUS_MAP = {
  ON_SALE: { label: '판매중',  cls: 'badgeGreen' },
  SOLD_OUT:{ label: '품절',    cls: 'badgeOrange' },
  HIDDEN:  { label: '숨김',    cls: 'badgeGray' },
};

const STATUS_API = { selling: 'ON_SALE', soldout: 'SOLD_OUT', hide: 'HIDDEN' };

export default function ProductManagePage() {
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const pageSize = 5;

  const [products, setProducts]     = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('create');
  const [selectedProduct, setSelected]  = useState(null);
  const [showDelete, setShowDelete]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = STATUS_API[filter];
      const res = await getAllProducts(page, pageSize, status);
      const payload = res?.data?.data ?? res?.data ?? res;
      setProducts(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (e) {
      setError(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [filter]);

  const displayed = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return products;
    return products.filter((p) => (p.name ?? '').toLowerCase().includes(kw));
  }, [products, search]);

  const openCreate = () => { setModalMode('create'); setSelected(null); setShowModal(true); };
  const openEdit   = (p)  => { setModalMode('edit');   setSelected(p);    setShowModal(true); };
  const openDelete = (p)  => { setDeleteTarget(p); setShowDelete(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hardDeleteProduct(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      fetchProducts();
    } catch { /* handle */ }
    finally { setDeleting(false); }
  };

  const fmt = (v) => {
    const n = Number(v);
    return isNaN(n) ? '-' : `${n.toLocaleString()}원`;
  };

  const statusInfo = (s) => STATUS_MAP[s] ?? { label: s ?? '-', cls: 'badgeGray' };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>상품 관리</h1>
          <p className={shared.pageSubtitle}>Product Management</p>
        </div>
        <button className={shared.btnPrimary} onClick={openCreate}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          상품 등록
        </button>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={shared.filterGroup}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${shared.filterBtn} ${filter === f.key ? shared.filterBtnActive : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className={shared.searchBox}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="상품명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            불러오는 중...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontSize: 12 }}>
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={shared.th}>No</th>
                <th className={shared.th}>상품명</th>
                <th className={shared.th}>카테고리</th>
                <th className={`${shared.th} ${shared.thRight}`}>가격</th>
                <th className={`${shared.th} ${shared.thCenter}`}>재고</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>관리</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    {search ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
                  </td>
                </tr>
              ) : displayed.map((p, i) => {
                const si = statusInfo(p.status);
                return (
                  <tr key={p.id} className={shared.tr}>
                    <td className={`${shared.td} ${shared.tdMuted}`}>#{String((page - 1) * pageSize + i + 1).padStart(3, '0')}</td>
                    <td className={shared.td}>
                      <div className={shared.tdBold}>{p.name ?? '-'}</div>
                      {p.subTitle && <div className={shared.tdSub}>{p.subTitle}</div>}
                    </td>
                    <td className={shared.td}>
                      <span className={shared.badge} style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {p.category?.name ?? '-'}
                      </span>
                    </td>
                    <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>{fmt(p.price)}</td>
                    <td className={`${shared.td} ${shared.tdCenter}`}
                      style={{ color: p.stock === 0 ? '#ef4444' : 'var(--text-primary)', fontWeight: 700 }}>
                      {p.stock ?? 0}
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={`${shared.badge} ${shared[si.cls]}`}>{si.label}</span>
                    </td>
                    <td className={shared.td}>
                      <div className={shared.actionGroup}>
                        <button className={shared.btnEdit} onClick={() => openEdit(p)} title="수정">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className={shared.btnDelete} onClick={() => openDelete(p)} title="삭제">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className={shared.pagination}>
          <span className={shared.pageInfo}>총 {products.length}개 상품</span>
          <div className={shared.pageButtons}>
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`${shared.pageBtn} ${page === n ? shared.pageBtnActive : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>

      {showModal && (
        <ProductManageModal
          open={showModal}
          mode={modalMode}
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchProducts(); }}
        />
      )}

      {showDelete && (
        <DeleteModal
          open={showDelete}
          target={deleteTarget?.name}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
