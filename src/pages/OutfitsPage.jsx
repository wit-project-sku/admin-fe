import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import s from './OutfitsPage.module.css';
import { getAllProducts, createProduct } from '@apis/productApi';
import { getKiosks } from '@apis/kioskApi';
import { getCategories } from '@apis/categoryApi';

export default function OutfitsPage() {
  const [view, setView] = useState('list');
  const [products, setProducts] = useState([]);
  const [kiosks, setKiosks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const [form, setForm] = useState({
    name: '',
    subTitle: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    kioskIds: [],
    images: [],
    status: 'ON_SALE',
  });

  // 키오스크 목록 조회
  useEffect(() => {
    getKiosks()
      .then((res) => {
        const data = res?.data ?? res;
        setKiosks(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  // 카테고리 목록 조회
  useEffect(() => {
    getCategories()
      .then((res) => {
        const data = res?.data ?? res;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  // 상품(의상) 목록 조회
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

  // 키오스크 ID → 이름 변환 헬퍼
  const kioskNameById = useMemo(() => {
    return kiosks.reduce((acc, k) => {
      acc[k.id] = k.name;
      return acc;
    }, {});
  }, [kiosks]);

  const displayed = useMemo(() => {
    if (!search.trim()) return products;
    const kw = search.toLowerCase();
    return products.filter((p) => (p.name ?? '').toLowerCase().includes(kw));
  }, [products, search]);

  const toggleKiosk = (id) =>
    setForm((f) => ({
      ...f,
      kioskIds: f.kioskIds.includes(id) ? f.kioskIds.filter((k) => k !== id) : [...f.kioskIds, id],
    }));

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files ?? []);
    setForm((f) => ({ ...f, images: [...f.images, ...files] }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: form.name,
        subTitle: form.subTitle,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        status: form.status,
        kioskIds: form.kioskIds,
      };
      await createProduct(form.categoryId, body, form.images);
      setForm({
        name: '',
        subTitle: '',
        description: '',
        price: '',
        stock: '',
        categoryId: '',
        kioskIds: [],
        images: [],
        status: 'ON_SALE',
      });
      setView('list');
      fetchProducts();
    } catch (err) {
      console.error('의상 등록 실패:', err);
      alert('등록에 실패했습니다.');
    }
  };

  const STATUS_MAP = {
    ON_SALE: { label: 'Active', cls: 'badgeGreen' },
    SOLD_OUT: { label: 'Sold Out', cls: 'badgeOrange' },
    HIDDEN: { label: 'Inactive', cls: 'badgeGray' },
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>의상 관리 시스템</h1>
          <p className={shared.pageSubtitle}>Inventory & Registration</p>
        </div>
        <div className={s.viewToggle}>
          <button
            className={`${s.toggleBtn} ${view === 'list' ? s.toggleBtnActive : ''}`}
            onClick={() => setView('list')}
          >
            의상 목록
          </button>
          <button
            className={`${s.toggleBtn} ${view === 'register' ? s.toggleBtnRegister : ''}`}
            onClick={() => setView('register')}
          >
            신규 등록
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className={shared.card}>
          <div className={shared.cardHead}>
            <span className={shared.cardTitle}>
              현재 등록된 의상
              <span className={s.countBadge}>{products.length}</span>
            </span>
            <div className={shared.searchBox}>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='2'>
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
              <input placeholder='의상명 검색...' value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={shared.th}>No</th>
                <th className={shared.th}>Preview</th>
                <th className={shared.th}>의상명</th>
                <th className={shared.th}>카테고리</th>
                <th className={shared.th}>설치 키오스크</th>
                <th className={`${shared.th} ${shared.thRight}`}>가격</th>
                <th className={`${shared.th} ${shared.thCenter}`}>재고</th>
                <th className={`${shared.th} ${shared.thRight}`}>상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}
                  >
                    등록된 의상이 없습니다.
                  </td>
                </tr>
              ) : (
                displayed.map((p, i) => {
                  const si = STATUS_MAP[p.status] ?? { label: p.status, cls: 'badgeGray' };
                  return (
                    <tr key={p.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdMuted}`}>
                        #{String((page - 1) * pageSize + i + 1).padStart(3, '0')}
                      </td>
                      <td className={shared.td}>
                        {p.images?.[0]?.imageUrl ? (
                          <img
                            src={p.images[0].imageUrl}
                            alt={p.name}
                            style={{
                              width: 44,
                              height: 52,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 52,
                              borderRadius: 8,
                              background: 'var(--bg-page)',
                              border: '1px solid var(--border)',
                            }}
                          />
                        )}
                      </td>
                      <td className={shared.td}>
                        <div className={shared.tdBold}>{p.name}</div>
                        {p.subTitle && <div className={shared.tdSub}>{p.subTitle}</div>}
                      </td>
                      <td className={shared.td}>
                        <span className={shared.badge} style={{ background: '#fdf4ff', color: '#9333ea' }}>
                          {p.categoryName ?? '-'}
                        </span>
                      </td>
                      <td className={shared.td}>
                        <div className={shared.tagGroup}>
                          {(p.kioskIds ?? []).map((id) => (
                            <span key={id} className={shared.tag}>
                              {kioskNameById[id] ?? `키오스크 ${id}`}
                            </span>
                          ))}
                          {(p.kioskIds ?? []).length === 0 && <span className={shared.tag}>미배정</span>}
                        </div>
                      </td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>
                        {p.price?.toLocaleString()}원
                      </td>
                      <td
                        className={`${shared.td} ${shared.tdCenter}`}
                        style={{ color: p.stock === 0 ? '#ef4444' : 'var(--text-primary)', fontWeight: 700 }}
                      >
                        {p.stock}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        <span className={`${shared.badge} ${shared[si.cls]}`}>{si.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className={shared.pagination}>
            <span className={shared.pageInfo}>총 {products.length}종</span>
            <div className={shared.pageButtons}>
              <button
                className={shared.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`${shared.pageBtn} ${page === n ? shared.pageBtnActive : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className={shared.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={s.registerGrid}>
          <div className={shared.card} style={{ padding: '22px 24px' }}>
            <h3 className={s.formTitle}>신규 의상 정보 입력</h3>
            <form onSubmit={handleRegister} className={s.form}>
              <div className={s.formRow}>
                <div className={s.formField}>
                  <label className={s.label}>의상 이름</label>
                  <input
                    required
                    className={s.input}
                    placeholder='예: 전통 한복 A'
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className={s.formField}>
                  <label className={s.label}>부제목</label>
                  <input
                    className={s.input}
                    placeholder='예: 프리미엄 한복 컬렉션'
                    value={form.subTitle}
                    onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formField}>
                  <label className={s.label}>카테고리</label>
                  <select
                    required
                    className={s.input}
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value=''>선택하세요</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.formField}>
                  <label className={s.label}>상태</label>
                  <select
                    className={s.input}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value='ON_SALE'>판매중</option>
                    <option value='SOLD_OUT'>품절</option>
                    <option value='HIDDEN'>숨김</option>
                  </select>
                </div>
              </div>

              <div className={s.formRow}>
                <div className={s.formField}>
                  <label className={s.label}>가격 (원)</label>
                  <input
                    required
                    type='number'
                    min={0}
                    className={s.input}
                    placeholder='0'
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className={s.formField}>
                  <label className={s.label}>재고</label>
                  <input
                    required
                    type='number'
                    min={0}
                    className={s.input}
                    placeholder='0'
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className={s.formField}>
                <label className={s.label}>설명</label>
                <textarea
                  className={s.input}
                  placeholder='의상 설명을 입력하세요'
                  style={{ minHeight: 72, resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className={s.formField}>
                <label className={s.label}>설치 키오스크 선택</label>
                <div className={s.kioskGrid}>
                  {kiosks.map((k) => (
                    <div
                      key={k.id}
                      className={`${s.kioskItem} ${form.kioskIds.includes(k.id) ? s.kioskActive : ''}`}
                      onClick={() => toggleKiosk(k.id)}
                    >
                      <div className={`${s.kioskCheck} ${form.kioskIds.includes(k.id) ? s.kioskChecked : ''}`} />
                      <span>{k.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button type='submit' className={`${shared.btnPrimary} ${s.submitBtn}`}>
                의상 등록 완료
              </button>
            </form>
          </div>

          <div className={shared.card} style={{ padding: '22px 24px' }}>
            <label className={s.label} style={{ display: 'block', marginBottom: 10 }}>
              이미지 업로드
            </label>
            <div className={s.imageUpload}>
              {form.images.length > 0 ? (
                <img
                  src={URL.createObjectURL(form.images[0])}
                  alt='preview'
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                />
              ) : (
                <div className={s.uploadPlaceholder}>
                  <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='1.5'>
                    <rect x='3' y='3' width='18' height='18' rx='2' />
                    <circle cx='8.5' cy='8.5' r='1.5' />
                    <polyline points='21 15 16 10 5 21' />
                  </svg>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 10 }}>클릭하여 업로드</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>JPG, PNG, WEBP</p>
                </div>
              )}
              <input
                type='file'
                accept='image/*'
                multiple
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onChange={handleImageAdd}
              />
            </div>
            {form.images.length > 1 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                + {form.images.length - 1}개 추가 이미지
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
