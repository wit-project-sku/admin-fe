import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import s from './OutfitsPage.module.css';
import { getAllOutfits, deleteOutfit } from '@apis/outfitApi';
import { getKiosks } from '@apis/kioskApi';
import { getCategories } from '@apis/categoryApi';
import OutfitManageModal from '@modals/OutfitManageModal';
import DeleteModal from '@modals/DeleteModal';

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
  const [statusFilter, setStatusFilter] = useState('ALL'); // 필터링 상태 추가

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // 모달 제어 상태
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
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
    return outfits.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [outfits, search, statusFilter]);

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

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>의상 관리 시스템</h1>
          <p className={shared.pageSubtitle}>Inventory & Management</p>
        </div>
        {/* 1번 요청: 등록 버튼으로 단일화 */}
        <button className={shared.btnPrimary} onClick={openCreateModal}>
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='3'
            style={{ marginRight: 6 }}
          >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
          의상 등록
        </button>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={shared.filterGroup}>
            <button
              className={`${shared.filterBtn} ${statusFilter === 'ALL' ? shared.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              전체 <span className={shared.filterCount}>{outfits.length}</span>
            </button>
            <button
              className={`${shared.filterBtn} ${statusFilter === 'ACTIVE' ? shared.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              활성화 <span className={shared.filterCount}>{outfits.filter((o) => o.status === 'ACTIVE').length}</span>
            </button>
            <button
              className={`${shared.filterBtn} ${statusFilter === 'INACTIVE' ? shared.filterBtnActive : ''}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              비활성화{' '}
              <span className={shared.filterCount}>{outfits.filter((o) => o.status === 'INACTIVE').length}</span>
            </button>
          </div>
          <div className={shared.searchBox} style={{ minWidth: 260 }}>
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='2'>
              <circle cx='11' cy='11' r='8' />
              <line x1='21' y1='21' x2='16.65' y2='16.65' />
            </svg>
            <input
              placeholder='의상명, ID, 카테고리 검색...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {displayed.map((p, i) => {
                const si = STATUS_MAP[p.status] || STATUS_MAP.INACTIVE;
                return (
                  <tr key={p.id} className={shared.tr}>
                    <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                      #{String(i + 1).padStart(3, '0')}
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      {/* 4번 요청: 더 작고 둥근 Preview 이미지 스타일 */}
                      <div className={s.previewWrapper}>
                        <img src={p.images?.[0]?.imageUrl} alt='' className={s.tableThumb} />
                      </div>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <div className={shared.tdBold}>{p.name}</div>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={shared.badge} style={{ background: '#fdf4ff', color: '#9333ea' }}>
                        {p.categoryName}
                      </span>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <div className={shared.tagGroup} style={{ justifyContent: 'center' }}>
                        {(p.kioskIds ?? []).map((id) => (
                          <span key={id} className={shared.tag}>
                            {kioskNameById[id]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`${shared.td} ${shared.tdRight}`}>{p.price?.toLocaleString()}원</td>
                    <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>{p.stock}</td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={`${shared.badge} ${shared[si.cls]}`}>{si.label}</span>
                    </td>
                    <td className={shared.td}>
                      <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                        <button className={shared.btnEdit} onClick={() => openEditModal(p)}>
                          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#3b82f6' strokeWidth='2'>
                            <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                            <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                          </svg>
                        </button>
                        <button
                          className={shared.btnDelete}
                          onClick={() => {
                            setSelectedId(p.id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#ef4444' strokeWidth='2'>
                            <polyline points='3 6 5 6 21 6' />
                            <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          target='선택한 의상'
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
