import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import s from './OutfitsPage.module.css';
import { getAllOutfits, deleteOutfit } from '@apis/outfitApi';
import { getKiosks } from '@apis/kioskApi';
import { getCategories } from '@apis/categoryApi';

import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import OutfitManageModal from '@modals/OutfitManageModal';
import DeleteModal from '@modals/DeleteModal';
import EditBtn from '../components/common/EditBtn';
import DeleteBtn from '../components/common/DeleteBtn';
import RegisterBtn from '../components/common/RegisterBtn';

const DUMMY_OUTFITS = [
  {
    id: 1,
    name: '궁중 당의 한복 A세트',
    categoryName: '여성 한복',
    price: 159000,
    stock: 5,
    status: 'ACTIVE',
    kioskIds: [1, 2],
    images: [{ imageUrl: 'https://picsum.photos/id/101/200/300' }],
  },
  {
    id: 2,
    name: '선비 도포 세트 (남성)',
    categoryName: '남성 한복',
    price: 129000,
    stock: 0,
    status: 'INACTIVE',
    kioskIds: [3],
    images: [{ imageUrl: 'https://picsum.photos/id/102/200/300' }],
  },
  {
    id: 3,
    name: '아동용 색동저고리',
    categoryName: '아동 한복',
    price: 89000,
    stock: 12,
    status: 'ACTIVE',
    kioskIds: [1, 4],
    images: [{ imageUrl: 'https://picsum.photos/id/103/200/300' }],
  },
];

const DUMMY_KIOSKS = [
  { id: 1, name: '화성휴게소(상)' },
  { id: 2, name: '화성휴게소(하)' },
  { id: 3, name: '인사동 본점' },
  { id: 4, name: '강남 팝업' },
  { id: 5, name: '제주공항점' },
];

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState(DUMMY_OUTFITS);
  const [kiosks, setKiosks] = useState(DUMMY_KIOSKS);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // 모달 제어 상태
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 기초 데이터 로드
  const fetchBasics = useCallback(async () => {
    try {
      const [kRes, cRes] = await Promise.all([getKiosks(), getCategories()]);
      setKiosks(kRes?.data ?? kRes ?? []);
      setCategories(cRes?.data ?? cRes ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 의상 목록 로드
  const fetchOutfits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllOutfits(page, pageSize);
      const payload = res?.data?.data ?? res?.data ?? res;
      setOutfits(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch {
      setOutfits([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // fetchBasics();
    // fetchOutfits();
  }, [fetchBasics, fetchOutfits]);

  const kioskNameById = useMemo(() => {
    return kiosks.reduce((acc, k) => {
      acc[k.id] = k.name;
      return acc;
    }, {});
  }, [kiosks]);

  // 통합 검색 (의상명, No, 카테고리)
  const displayed = useMemo(() => {
    return outfits.filter((o) => {
      const matchesFilter = filter === 'ALL' || o.status === filter;
      const kw = search.toLowerCase();
      const matchesSearch = o.name.toLowerCase().includes(kw) || (o.categoryName ?? '').toLowerCase().includes(kw);
      return matchesFilter && matchesSearch;
    });
  }, [outfits, filter, search]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setShowManageModal(true);
  };

  const openEditModal = (outfit) => {
    setModalMode('edit');
    setSelectedId(outfit.id);
    setShowManageModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOutfit(selectedId);
      setShowDeleteModal(false);
      fetchOutfits();
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const STATUS_MAP = {
    ACTIVE: { label: '활성화', cls: 'badgeGreen' },
    INACTIVE: { label: '비활성화', cls: 'badgeGray' },
  };

  const STATUS_FILTERS = [
    { key: 'ALL', label: '전체' },
    { key: 'ACTIVE', label: '활성화' },
    { key: 'INACTIVE', label: '비활성화' },
  ];

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>의상 관리 시스템</h1>
          <p className={shared.pageSubtitle}>Inventory & Management</p>
        </div>

        <RegisterBtn title='의상 등록' onClick={openCreateModal} />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
        >
          <FilterGroup filters={STATUS_FILTERS} current={filter} onFilterChange={setFilter} />
          <div style={{ flexShrink: 0 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder='의상 이름 또는 카테고리 검색...'
              minWidth='280px'
            />
          </div>
        </div>

        <div className={s.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                <th className={`${shared.th} ${shared.thCenter}`}>Preview</th>
                <th className={`${shared.th} ${shared.thCenter}`}>의상명</th>
                <th className={`${shared.th} ${shared.thCenter}`}>카테고리</th>
                <th className={`${shared.th} ${shared.thCenter}`}>설치 키오스크</th>
                <th className={`${shared.th} ${shared.thRight}`}>가격</th>
                <th className={`${shared.th} ${shared.thCenter}`}>재고</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={shared.tdCenter} style={{ padding: '40px' }}>
                    데이터 로딩 중...
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className={shared.tdCenter} style={{ padding: '40px' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                displayed.map((o, i) => (
                  <tr key={o.id} className={shared.tr}>
                    <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                      #{String((page - 1) * pageSize + i + 1).padStart(3, '0')}
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <div className={s.previewWrapper}>
                        <img src={o.imageUrl || o.images?.[0]?.imageUrl} alt='' className={s.tableThumb} />
                      </div>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <div className={shared.tdBold}>{o.name}</div>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={shared.badge} style={{ background: '#fdf4ff', color: '#9333ea' }}>
                        {o.categoryName}
                      </span>
                    </td>
                    <td className={`${shared.td} ${shared.tdRight}`}>{o.price?.toLocaleString()}원</td>
                    <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>{o.stock}</td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span
                        className={`${shared.badge} ${o.status === 'ACTIVE' ? shared.badgeGreen : shared.badgeGray}`}
                      >
                        {o.status === 'ACTIVE' ? '활성화' : '비활성화'}
                      </span>
                    </td>
                    <td className={shared.td}>
                      <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                        <EditBtn
                          onClick={() => {
                            setModalMode('edit');
                            setSelectedId(o.id);
                            setShowManageModal(true);
                          }}
                        />
                        <DeleteBtn
                          onClick={() => {
                            setSelectedId(o.id);
                            setSelectedName(o.name);
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
        {/* 페이지네이션 중앙 정렬 */}
        <div className={shared.pagination} style={{ position: 'relative' }}>
          <span className={shared.pageInfo} style={{ position: 'absolute', left: '22px' }}>
            총 {outfits.length}건
          </span>
          <div className={shared.pageButtons} style={{ margin: '0 auto' }}>
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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

      {/* 관리 모달 (등록/수정) */}
      {showManageModal && (
        <OutfitManageModal
          open={showManageModal}
          mode={modalMode}
          outfitId={selectedId}
          onClose={() => setShowManageModal(false)}
          onSuccess={() => {
            setShowManageModal(false);
            fetchOutfits();
          }}
        />
      )}

      {/* 삭제 모달 */}
      {showDeleteModal && (
        <DeleteModal
          open={showDeleteModal}
          target={selectedName}
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
