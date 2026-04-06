import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './RefundManagePage.module.css';
import SearchPanel from '@components/common/SearchPanel';
import DataTable from '@components/common/DataTable';
import { getAllRefundsAdmin } from '@apis/refundApi';

const FILTERS = [
  { label: '전체', value: 'all' },
  { label: '대기', value: 'waiting' },
  { label: '승인', value: 'approved' },
  { label: '반려', value: 'rejected' },
  { label: '완료', value: 'completed' },
];

const SEARCH_OPTIONS = [
  { label: '주문번호', value: 'transactionId' },
  { label: '전화번호', value: 'phone' },
];

const COLUMNS = ['No', '환불 상태', '주문번호', '전화번호', '환불 사유', '설명', '세부사항'];
const GRID = '50px 100px 1fr 1fr 1.5fr 1.5fr 90px';

const normalizePhone = (value) => {
  if (!value) return '-';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return String(value);
};

const getStatusEnum = (item) => (typeof item?.refundStatus === 'string' ? item.refundStatus : null);

const getStatusLabel = (statusEnum) => {
  switch (statusEnum) {
    case 'WAITING':
      return '대기';
    case 'APPROVED':
    case 'ACCEPTED':
      return '승인';
    case 'REJECTED':
      return '반려';
    case 'COMPLETED':
    case 'DONE':
      return '완료';
    default:
      return statusEnum ? String(statusEnum) : '-';
  }
};

const getStatusClass = (statusEnum, styles) => {
  if (statusEnum === 'REJECTED') return styles.statusRejected;
  if (statusEnum === 'WAITING') return styles.statusWaiting;
  if (statusEnum === 'APPROVED' || statusEnum === 'ACCEPTED') return styles.statusApproved;
  if (statusEnum === 'COMPLETED' || statusEnum === 'DONE') return styles.statusCompleted;
  return styles.statusWaiting;
};

// 환불 상세 모달 (인라인 유지 - 별도 파일 없음)
function RefundDetailModal({ open, refund, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const safe = refund ?? {};

  const statusLabel = (status) => {
    switch (status) {
      case 'WAITING': return '대기';
      case 'APPROVED': case 'ACCEPTED': return '승인';
      case 'REJECTED': return '반려';
      case 'COMPLETED': case 'DONE': return '완료';
      default: return status ?? '-';
    }
  };

  return (
    <div className={styles.overlay} onClick={() => onClose?.()} role='presentation'>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role='dialog' aria-modal='true'>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>환불 상세</span>
          <button type='button' className={styles.closeBtn} onClick={() => onClose?.()} aria-label='닫기'>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>주문번호</span>
            <input className={styles.fieldInput} value={safe.transactionId ?? '-'} disabled readOnly />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>전화번호</span>
            <input className={styles.fieldInput} value={normalizePhone(safe.phoneNumber)} disabled readOnly />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>환불 사유</span>
            <input className={styles.fieldInput} value={safe.refundReason ?? '-'} disabled readOnly />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>환불 상태</span>
            <input className={styles.fieldInput} value={statusLabel(safe.refundStatus)} disabled readOnly />
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <span className={styles.fieldLabel}>설명</span>
            <textarea className={styles.fieldTextarea} value={safe.description ?? '-'} disabled readOnly />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button type='button' className={styles.cancelBtn} onClick={() => onClose?.()}>닫기</button>
          <button type='button' className={styles.submitBtn} onClick={() => onClose?.()}>확인</button>
        </div>
      </div>
    </div>
  );
}

export default function RefundManagePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchType, setSearchType] = useState('transactionId');
  const [searchValue, setSearchValue] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [refunds, setRefunds] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllRefundsAdmin(page, pageSize);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setRefunds(Array.isArray(payload?.content) ? payload.content : []);
      setTotalElements(typeof payload?.totalElements === 'number' ? payload.totalElements : 0);
      setTotalPages(typeof payload?.totalPages === 'number' ? payload.totalPages : 1);
    } catch (e) {
      setError(e);
      setRefunds([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const filteredData = useMemo(() => {
    const keyword = searchValue.trim();

    return refunds.filter((item) => {
      const statusEnum = getStatusEnum(item);

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'waiting' && statusEnum === 'WAITING') ||
        (activeFilter === 'approved' && (statusEnum === 'APPROVED' || statusEnum === 'ACCEPTED')) ||
        (activeFilter === 'rejected' && statusEnum === 'REJECTED') ||
        (activeFilter === 'completed' && (statusEnum === 'COMPLETED' || statusEnum === 'DONE'));

      const matchesSearch =
        !keyword ||
        (searchType === 'transactionId' && String(item?.transactionId ?? '').includes(keyword)) ||
        (searchType === 'phone' && String(item?.phoneNumber ?? '').includes(keyword));

      return matchesFilter && matchesSearch;
    });
  }, [refunds, searchValue, searchType, activeFilter]);

  const handleReset = () => {
    setActiveFilter('all');
    setSearchType('transactionId');
    setSearchValue('');
    setStartDate('2026-01-01');
    setEndDate('2026-02-28');
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <SearchPanel
        filterLabel='환불 상태'
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showDateRange
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        searchLabel='상세 검색'
        searchOptions={SEARCH_OPTIONS}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder='검색어를 입력해주세요'
        onSearch={fetchRefunds}
        onReset={handleReset}
      />

      <DataTable
        title='환불 목록'
        total={totalElements || filteredData.length}
        columns={COLUMNS}
        gridTemplateColumns={GRID}
        data={filteredData}
        renderRow={(item, idx) => {
          const statusEnum = getStatusEnum(item);
          return (
            <>
              <div>{(page - 1) * pageSize + idx + 1}</div>
              <div>
                <span className={getStatusClass(statusEnum, styles)}>{getStatusLabel(statusEnum)}</span>
              </div>
              <div>{item.transactionId ?? '-'}</div>
              <div>{normalizePhone(item.phoneNumber)}</div>
              <div>{item.refundReason ?? '-'}</div>
              <div>{item.description ?? '-'}</div>
              <div>
                <button
                  className={styles.detailBtn}
                  type='button'
                  onClick={() => {
                    setSelectedRefund(item);
                    setShowRefundModal(true);
                  }}
                >
                  상세보기
                </button>
              </div>
            </>
          );
        }}
        rowKey={(item, idx) => `${item.transactionId ?? 'refund'}-${idx}`}
        loading={loading}
        error={error}
        errorMessage='환불 내역 조회에 실패했습니다.'
        emptyMessage='검색 결과가 없습니다.'
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <RefundDetailModal
        open={showRefundModal}
        refund={selectedRefund}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedRefund(null);
        }}
      />
    </div>
  );
}
