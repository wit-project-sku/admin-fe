import { useState, useEffect, useMemo, useCallback } from 'react';
import shared from '@commons/shared.module.css';
import { useGetAllDeliveries } from '../hooks/delivery-api/useGetAllDeliveries';
import { extractPaginatedResult } from '../utils/queryHelpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ADMIN_LIST_MAX_FETCH } from '../constants/adminListFetch';
import DeliveryManageModal from '@modals/DeliveryManageModal';

import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import { normalizePhone } from '../utils/normalizePhone';

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'ORDERED', label: '주문완료' },
  { key: 'READY', label: '배송준비' },
  { key: 'DELIVERING', label: '배송중' },
  { key: 'COMPLETED', label: '배송완료' },
  { key: 'PICKED_UP', label: '직접수령' },
  { key: 'CANCELED', label: '취소' },
];

const STATUS_MAP = {
  DELIVERING: { label: '배송중', cls: 'badgeBlue' },
  COMPLETED: { label: '배송완료', cls: 'badgeGreen' },
  CANCELED: { label: '취소', cls: 'badgeRed' },
  PICKED_UP: { label: '직접수령', cls: 'badgeGray' },
  ORDERED: { label: '주문완료', cls: 'badgeAmber' },
  READY: { label: '배송준비', cls: 'badgeBlue' },
};

const DELIVERY_PAGE_SIZE = 5;

export default function DeliveryManagePage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<any>(null);
  const [modalMode, setMode] = useState('view');
  const [showModal, setShowModal] = useState(false);

  const {
    data,
    isLoading: loading,
    error,
  } = useGetAllDeliveries({
    pageSize: DELIVERY_PAGE_SIZE,
    pageNum: page,
    keyword: debouncedSearch || undefined,
    deliveryStatus: filter === 'all' ? undefined : filter,
  });
  const { content: deliveries } = extractPaginatedResult(data);

  const filteredAll = useMemo(() => {
    let list = deliveries;
    const st = (d) => d.deliveryStatus ?? d.status ?? null;

    if (filter !== 'all') list = list.filter((d) => st(d) === filter);

    const kw = debouncedSearch.trim().toLowerCase();
    if (kw) {
      list = list.filter((d) => {
        const idStr = `DEL-${String(d.deliveryId).padStart(3, '0')}`.toLowerCase();
        const purePhone = String(d.phoneNumber || '').replace(/\D/g, '');
        const searchKw = kw.replace(/\D/g, '');

        return (
          idStr.includes(kw) ||
          (d.receiverName ?? '').toLowerCase().includes(kw) ||
          (d.address ?? '').toLowerCase().includes(kw) ||
          purePhone.includes(searchKw || kw)
        );
      });
    }
    return list;
  }, [deliveries, filter, debouncedSearch]);

  const totalCount = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / DELIVERY_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const displayed = useMemo(() => {
    const start = (page - 1) * DELIVERY_PAGE_SIZE;
    return filteredAll.slice(start, start + DELIVERY_PAGE_SIZE);
  }, [filteredAll, page]);

  const clearFilters = useCallback(() => {
    setFilter('all');
    setSearch('');
  }, []);

  const si = (d) => {
    const s = d.deliveryStatus ?? d.status ?? null;
    return STATUS_MAP[s] ?? { label: s ?? '-', cls: 'badgeGray' };
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>배송 관리</h1>
          <p className={shared.pageSubtitle}>Delivery Management</p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead} style={{ gap: 8, flexWrap: 'wrap' }}>
          <FilterGroup filters={STATUS_FILTERS} current={filter} onFilterChange={setFilter} />

          <button
            type="button"
            className={shared.btnFilterReset}
            onClick={clearFilters}
            aria-label="필터 초기화"
            title="필터 초기화"
          />

          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder='주문번호, 수령인, 연락처 검색...'
              minWidth='300px'
            />
          </div>
        </div>

        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                <th className={`${shared.th} ${shared.thCenter}`}>주문번호</th>
                <th className={`${shared.th} ${shared.thCenter}`}>수령인</th>
                <th className={`${shared.th} ${shared.thCenter}`}>전화번호</th>
                <th className={`${shared.th} ${shared.thCenter}`}>주소</th>
                <th className={`${shared.th} ${shared.thRight}`}>결제금액</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`delivery-skeleton-${idx}`} className={shared.skeletonRow}>
                    {Array.from({ length: 8 }).map((__, col) => (
                      <td key={`delivery-skeleton-${idx}-${col}`} className={shared.td}>
                        <span className={shared.skeletonLine} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                    배송 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className={shared.tableStateCell}>
                    해당 조건의 배송 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                displayed.map((d) => {
                  const info = si(d);
                  return (
                    <tr key={d.deliveryId} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>1</td>
                      <td className={`${shared.td} ${shared.tdMono} ${shared.tdCenter}`}>
                        {`DEL-${String(d.deliveryId).padStart(3, '0')}`}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>{d.receiverName ?? '-'}</td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMuted}`}>
                        {normalizePhone(d.phoneNumber)}
                      </td>
                      <td
                        className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}
                        style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {d.address ?? '-'}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>
                        {d.totalAmount ? `${Number(d.totalAmount).toLocaleString()}원` : '-'}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>
                      </td>
                      <td className={shared.td}>
                        <div className={shared.actionGroup}>
                          <button
                            className={shared.btnOutline}
                            onClick={() => {
                              setSelected(d);
                              setMode('view');
                              setShowModal(true);
                            }}
                          >
                            상세
                          </button>
                          <button
                            className={shared.btnPrimary}
                            style={{ padding: '5px 11px', fontSize: 10 }}
                            onClick={() => {
                              setSelected(d);
                              setMode('edit');
                              setShowModal(true);
                            }}
                          >
                            수정
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={totalCount}
          unit='건'
        />
      </div>

      {showModal && (
        <DeliveryManageModal
          open={showModal}
          mode={modalMode}
          deliveryId={selected?.deliveryId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
