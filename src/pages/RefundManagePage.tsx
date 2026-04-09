import { useState, useEffect, useMemo, useCallback } from 'react';
import shared from '@commons/shared.module.css';
import { useGetAllRefunds } from '../hooks/payment-api/useGetAllRefunds';
import { extractPaginatedResult } from '../utils/queryHelpers';
import { ADMIN_LIST_MAX_FETCH } from '../constants/adminListFetch';
import RefundManageModal from '@modals/RefundManageModal';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import { normalizePhone } from '../utils/normalizePhone';

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'WAITING', label: '대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
  { key: 'COMPLETED', label: '완료' },
];

const STATUS_MAP = {
  WAITING: { label: '대기', cls: 'badgeAmber' },
  APPROVED: { label: '승인', cls: 'badgeGreen' },
  ACCEPTED: { label: '승인', cls: 'badgeGreen' },
  REJECTED: { label: '반려', cls: 'badgeRed' },
  COMPLETED: { label: '완료', cls: 'badgeBlue' },
  DONE: { label: '완료', cls: 'badgeBlue' },
};

const REASON_MAP = {
  ETC: '기타',
  DEFECT: '상품불량',
  CHANGE_OF_MIND: '단순변심',
  WRONG_ORDER: '오주문',
};

const REFUND_PAGE_SIZE = 7;

export default function RefundManagePage() {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading: loading, error } = useGetAllRefunds(1, ADMIN_LIST_MAX_FETCH);
  const { content: refunds } = extractPaginatedResult(data);

  const filteredAll = useMemo(() => {
    if (filter === 'all') return refunds;
    return refunds.filter((r) => {
      const s = r.refundStatus ?? '';
      if (filter === 'APPROVED') return s === 'APPROVED' || s === 'ACCEPTED';
      if (filter === 'COMPLETED') return s === 'COMPLETED' || s === 'DONE';
      return s === filter;
    });
  }, [refunds, filter]);

  const totalCount = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / REFUND_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const displayed = useMemo(() => {
    const start = (page - 1) * REFUND_PAGE_SIZE;
    return filteredAll.slice(start, start + REFUND_PAGE_SIZE);
  }, [filteredAll, page]);

  const clearFilters = useCallback(() => {
    setFilter('all');
  }, []);

  const si = (r) => STATUS_MAP[r.refundStatus] ?? { label: r.refundStatus ?? '-', cls: 'badgeGray' };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>환불 관리</h1>
          <p className={shared.pageSubtitle}>Refund Management</p>
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
        </div>

        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                <th className={`${shared.th} ${shared.thCenter}`}>주문번호</th>
                <th className={`${shared.th} ${shared.thCenter}`}>수령인</th>
                <th className={`${shared.th} ${shared.thCenter}`}>전화번호</th>
                <th className={`${shared.th} ${shared.thCenter}`}>환불사유</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`refund-skeleton-${idx}`} className={shared.skeletonRow}>
                    {Array.from({ length: 7 }).map((__, col) => (
                      <td key={`refund-skeleton-${idx}-${col}`} className={shared.td}>
                        <span className={shared.skeletonLine} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                    환불 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className={shared.tableStateCell}>
                    환불 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                displayed.map((r) => {
                  const info = si(r);
                  return (
                    <tr key={r.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>{1}</td>
                      <td className={`${shared.td} ${shared.tdMono} ${shared.tdCenter}`}>{r.transactionId ?? '-'}</td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>{r.receiverName ?? '-'}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>{normalizePhone(r.phoneNumber)}</td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {REASON_MAP[r.refundReason] ?? r.refundReason ?? '-'}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>
                      </td>
                      <td className={shared.td}>
                        <div className={shared.actionGroup}>
                          <button
                            className={shared.btnOutline}
                            onClick={() => {
                              setSelected(r);
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

      {showModal && <RefundManageModal open={showModal} refund={selected} onClose={() => setShowModal(false)} />}
    </div>
  );
}
