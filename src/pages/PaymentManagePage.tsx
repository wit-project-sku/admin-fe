import { useState, useEffect, useMemo, useCallback } from 'react';
import shared from '@commons/shared.module.css';
import { useGetAllPayments } from '../hooks/payment-api/useGetAllPayments';
import { extractPaginatedResult } from '../utils/queryHelpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ADMIN_LIST_MAX_FETCH } from '../constants/adminListFetch';

import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import DateRangePicker from '../components/common/DateRangePicker';
import PaymentManageModal from '@modals/PaymentManageModal';
import { normalizePhone } from '../utils/normalizePhone';
import { formatCompactDateTime, getPastDateYmd, getTodayYmd } from '../utils/dateUtils';

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'APPROVED', label: '결제완료' },
  { key: 'CANCELED', label: '결제취소' },
];

const STATUS_MAP = {
  APPROVED: { label: '결제완료', cls: 'badgeGreen' },
  CANCELED: { label: '결제취소', cls: 'badgeRed' },
};

const PAYMENT_PAGE_SIZE = 7;

export default function PaymentManagePage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const [startDate, setStartDate] = useState(getPastDateYmd(30));
  const [endDate, setEndDate] = useState(getTodayYmd());

  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading: loading, error } = useGetAllPayments(1, ADMIN_LIST_MAX_FETCH);
  const { content: payments } = extractPaginatedResult(data);

  const filteredAll = useMemo(() => {
    let list = payments;

    if (startDate && endDate) {
      const s = startDate.replace(/-/g, '');
      const e = endDate.replace(/-/g, '');
      list = list.filter((p) => p.approvedDate >= s && p.approvedDate <= e);
    }

    if (filter !== 'all') list = list.filter((p) => p.paymentStatus === filter);

    const kw = debouncedSearch.trim().replace(/-/g, '');
    if (kw) {
      list = list.filter((p) => {
        const phone = String(p.phoneNumber || '').replace(/\D/g, '');
        const card = String(p.cardNumber || '').replace(/\D/g, '');
        return phone.includes(kw) || card.includes(kw);
      });
    }
    return list;
  }, [payments, filter, debouncedSearch, startDate, endDate]);

  const totalCount = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAYMENT_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const displayed = useMemo(() => {
    const start = (page - 1) * PAYMENT_PAGE_SIZE;
    return filteredAll.slice(start, start + PAYMENT_PAGE_SIZE);
  }, [filteredAll, page]);

  const clearFilters = useCallback(() => {
    setFilter('all');
    setSearch('');
    setStartDate(getPastDateYmd(30));
    setEndDate(getTodayYmd());
  }, []);

  const si = (s) => STATUS_MAP[s] ?? { label: s ?? '-', cls: 'badgeGray' };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>결제 관리</h1>
          <p className={shared.pageSubtitle}>Payment Management</p>
        </div>
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
          }}
        >
          <FilterGroup filters={STATUS_FILTERS} current={filter} onFilterChange={setFilter} />

          <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 8px' }} />

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />

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
              placeholder="주문번호 또는 상품명 검색..."
              minWidth="300px"
            />
          </div>
        </div>

        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                <th className={`${shared.th} ${shared.thCenter}`}>주문번호</th>
                <th className={`${shared.th} ${shared.thCenter}`}>전화번호</th>
                <th className={`${shared.th} ${shared.thCenter}`}>승인일시</th>
                <th className={`${shared.th} ${shared.thCenter}`}>카드번호</th>
                <th className={`${shared.th} ${shared.thRight}`}>결제금액</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`payment-skeleton-${idx}`} className={shared.skeletonRow}>
                    {Array.from({ length: 8 }).map((__, col) => (
                      <td key={`payment-skeleton-${idx}-${col}`} className={shared.td}>
                        <span className={shared.skeletonLine} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                    결제 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className={shared.tableStateCell}>
                    해당 조건의 결제 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                displayed.map((p) => {
                  const info = si(p.paymentStatus);
                  return (
                    <tr key={p.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>1</td>
                      <td className={`${shared.td} ${shared.tdMono} ${shared.tdCenter}`}>{p.transactionId ?? '-'}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>{normalizePhone(p.phoneNumber)}</td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {formatCompactDateTime(p.approvedDate, p.approvedTime)}
                      </td>
                      <td
                        className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}
                        style={{ fontFamily: 'monospace', fontSize: 10 }}
                      >
                        {p.cardNumber ? `${p.cardNumber.slice(0, 4)}-****-****-${p.cardNumber.slice(-4)}` : '-'}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>
                        {Number(p.totalAmount).toLocaleString()}원
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>
                      </td>
                      <td className={shared.td}>
                        <div className={shared.actionGroup} style={{ justifyContent: 'center' }}>
                          <button
                            className={shared.btnOutline}
                            onClick={() => {
                              setSelected(p);
                              setShowModal(true);
                            }}
                          >
                            상세보기
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
          unit="건"
        />
      </div>

      {showModal && <PaymentManageModal open={showModal} payment={selected} onClose={() => setShowModal(false)} />}
    </div>
  );
}
