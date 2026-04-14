import { useState, useEffect, useCallback } from 'react';
import shared from '@commons/shared.module.css';
import {
  useGetAllRefunds,
  type AdminRefundListRow,
  type RefundListStatusFilter,
} from '../hooks/payment-api/useGetAllRefunds';
import { extractPaginatedResult } from '../utils/queryHelpers';
import RefundManageModal from '@modals/RefundManageModal';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import { normalizePhone } from '../utils/normalizePhone';

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'WAITING', label: '대기' },
  { key: 'COMPLETE', label: '완료' },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  WAITING: { label: '대기', cls: 'badgeAmber' },
  COMPLETE: { label: '완료', cls: 'badgeBlue' },
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

const REFUND_PAGE_SIZE = 20;

type RefundFilterTab = 'all' | RefundListStatusFilter;

export default function RefundManagePage() {
  const [filter, setFilter] = useState<RefundFilterTab>('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading: loading, error } = useGetAllRefunds({
    pageNum: page,
    pageSize: REFUND_PAGE_SIZE,
    refundStatus: filter === 'all' ? undefined : filter,
  });
  const { content: refunds, totalPages, totalElements: totalCount } = extractPaginatedResult<AdminRefundListRow>(data);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const clearFilters = useCallback(() => {
    setFilter('all');
  }, []);

  const si = (r: AdminRefundListRow) =>
    STATUS_MAP[r.refundStatus] ?? { label: r.refundStatus ?? '-', cls: 'badgeGray' };

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
          <FilterGroup
            filters={STATUS_FILTERS}
            current={filter}
            onFilterChange={(key) => setFilter(key as RefundFilterTab)}
          />
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
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className={shared.tableStateCell}>
                    환불 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => {
                  const info = si(r);
                  return (
                    <tr key={r.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>{r.id}</td>
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
