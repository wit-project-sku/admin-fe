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
import { downloadXlsx, type XlsxColumn } from '../utils/xlsxExport';

// 외주사 환불 요청 파일 형식(첨부 양식과 동일): 거래일자·거래시간·카드번호·승인번호·거래금액
const fmtRefundDate = (d?: string | null) =>
  d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : (d ?? '');
const fmtRefundTime = (t?: string | null) =>
  t && t.length >= 4 ? `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6) || '00'}` : (t ?? '');

const REFUND_EXPORT_COLUMNS: XlsxColumn<AdminRefundListRow>[] = [
  { header: '거래일자', value: (r) => fmtRefundDate(r.approvedDate), width: 14 },
  { header: '거래시간', value: (r) => fmtRefundTime(r.approvedTime), width: 12 },
  { header: '카드번호', value: (r) => r.cardNumber ?? '', width: 22 },
  { header: '승인번호', value: (r) => r.approvalNumber ?? '', width: 14 },
  { header: '거래금액', value: (r) => r.totalAmount ?? '', width: 12 },
];

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
  SCRATCH: '긁힘/손상',
  PRINT: '인쇄 불량',
};

const REFUND_PAGE_SIZE = 20;

type RefundFilterTab = 'all' | RefundListStatusFilter;

export default function RefundManagePage() {
  const [filter, setFilter] = useState<RefundFilterTab>('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // 엑셀 추출용 선택 상태 — 페이지를 넘겨도 유지되도록 선택 시점의 행 데이터를 id별로 보관.
  const [selectedRows, setSelectedRows] = useState<Map<number, AdminRefundListRow>>(new Map());
  const toggleRow = (r: AdminRefundListRow) =>
    setSelectedRows((prev) => {
      const next = new Map(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.set(r.id, r);
      return next;
    });

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

  const allOnPageSelected = refunds.length > 0 && refunds.every((r) => selectedRows.has(r.id));
  const toggleAllOnPage = () =>
    setSelectedRows((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) refunds.forEach((r) => next.delete(r.id));
      else refunds.forEach((r) => next.set(r.id, r));
      return next;
    });

  const handleExportXlsx = () => {
    const rows = [...selectedRows.values()];
    if (rows.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadXlsx(`환불내역_${stamp}.xlsx`, '환불내역', REFUND_EXPORT_COLUMNS, rows);
  };

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
          <button
            type="button"
            className={shared.btnPrimary}
            style={{ marginLeft: 'auto' }}
            onClick={handleExportXlsx}
            disabled={selectedRows.size === 0}
            title="선택한 환불 건을 외주사 요청용 엑셀(.xlsx)로 다운로드"
          >
            엑셀 다운로드{selectedRows.size > 0 ? ` (${selectedRows.size}건)` : ''}
          </button>
        </div>

        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>
                  <input
                    type="checkbox"
                    aria-label="현재 페이지 전체 선택"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
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
                    {Array.from({ length: 8 }).map((__, col) => (
                      <td key={`refund-skeleton-${idx}-${col}`} className={shared.td}>
                        <span className={shared.skeletonLine} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                    환불 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className={shared.tableStateCell}>
                    환불 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => {
                  const info = si(r);
                  return (
                    <tr
                      key={r.id}
                      className={shared.tr}
                      onClick={() => {
                        setSelected(r);
                        setShowModal(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td
                        className={`${shared.td} ${shared.tdCenter}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`환불 ${r.id} 선택`}
                          checked={selectedRows.has(r.id)}
                          onChange={() => toggleRow(r)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
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
                        <div className={shared.actionGroup} onClick={(e) => e.stopPropagation()}>
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
