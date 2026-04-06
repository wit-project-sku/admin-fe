import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './PaymentManagePage.module.css';
import SearchPanel from '@components/common/SearchPanel';
import DataTable from '@components/common/DataTable';
import PaymentManageModal from '@modals/PaymentManageModal';
import { getPaymentsAdmin } from '@apis/paymentApi';

const FILTERS = [
  { label: '전체', value: 'all' },
  { label: '결제 완료', value: 'complete' },
  { label: '결제 취소', value: 'cancel' },
];

const SEARCH_OPTIONS = [
  { label: '카드번호', value: 'card' },
  { label: '전화번호', value: 'phone' },
];

const COLUMNS = ['No', '결제 상태', '거래 시각', '카드 번호', '청구 금액', '수령 전화번호', '세부사항'];
const GRID = '50px 110px 1.2fr 1.2fr 1fr 1.1fr 90px';

const formatApprovedAt = (approvedDate, approvedTime) => {
  if (!approvedDate || approvedDate.length !== 8) return '-';
  const y = approvedDate.slice(0, 4);
  const m = approvedDate.slice(4, 6);
  const d = approvedDate.slice(6, 8);
  if (!approvedTime || approvedTime.length < 4) return `${y}.${m}.${d}`;
  const hh = approvedTime.slice(0, 2);
  const mm = approvedTime.slice(2, 4);
  const ss = approvedTime.length >= 6 ? approvedTime.slice(4, 6) : '00';
  return `${y}.${m}.${d} ${hh}:${mm}:${ss}`;
};

const formatWon = (value) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${num.toLocaleString()}원`;
};

const normalizePhone = (value) => {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return String(value);
};

const getStatusEnum = (item) => (typeof item?.paymentStatus === 'string' ? item.paymentStatus : null);

const getStatusLabel = (statusEnum) => {
  switch (statusEnum) {
    case 'CANCELED':
      return '결제 취소';
    case 'APPROVED':
      return '결제 완료';
    default:
      return statusEnum ? String(statusEnum) : '결제 완료';
  }
};

export default function PaymentManagePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchType, setSearchType] = useState('card');
  const [searchValue, setSearchValue] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [payments, setPayments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentsAdmin(page, pageSize);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setPayments(Array.isArray(payload?.content) ? payload.content : []);
      setTotalElements(typeof payload?.totalElements === 'number' ? payload.totalElements : 0);
      setTotalPages(typeof payload?.totalPages === 'number' ? payload.totalPages : 1);
    } catch (e) {
      setError(e);
      setPayments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredData = useMemo(() => {
    const keyword = searchValue.trim();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return payments.filter((item) => {
      const statusEnum = getStatusEnum(item);
      const isCanceled = statusEnum === 'CANCELED' || statusEnum === 'CANCELLED';

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'complete' && !isCanceled) ||
        (activeFilter === 'cancel' && isCanceled);

      const matchesSearch =
        !keyword ||
        (searchType === 'card' && String(item?.cardNumber ?? '').includes(keyword)) ||
        (searchType === 'phone' && String(item?.phoneNumber ?? '').includes(keyword));

      let inRange = true;
      if ((start || end) && item?.approvedDate?.length === 8) {
        const y = item.approvedDate.slice(0, 4);
        const m = item.approvedDate.slice(4, 6);
        const d = item.approvedDate.slice(6, 8);
        const approvedAt = new Date(`${y}-${m}-${d}`);
        if (start && approvedAt < start) inRange = false;
        if (end && approvedAt > end) inRange = false;
      }

      return matchesFilter && matchesSearch && inRange;
    });
  }, [payments, searchValue, searchType, activeFilter, startDate, endDate]);

  const handleReset = () => {
    setActiveFilter('all');
    setSearchType('card');
    setSearchValue('');
    setStartDate('2026-01-01');
    setEndDate('2026-02-28');
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <SearchPanel
        filterLabel='결제 상태'
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
        onSearch={fetchPayments}
        onReset={handleReset}
      />

      <DataTable
        title='결제 목록'
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
                <span className={statusEnum === 'CANCELED' ? styles.statusCancel : styles.statusComplete}>
                  {getStatusLabel(statusEnum)}
                </span>
              </div>
              <div>{formatApprovedAt(item.approvedDate, item.approvedTime)}</div>
              <div>{item.cardNumber ?? '-'}</div>
              <div>{formatWon(item.totalAmount)}</div>
              <div>{normalizePhone(item.phoneNumber) || '-'}</div>
              <div>
                <button
                  className={styles.detailBtn}
                  type='button'
                  onClick={() => {
                    setSelectedPayment(item);
                    setShowPaymentModal(true);
                  }}
                >
                  상세보기
                </button>
              </div>
            </>
          );
        }}
        rowKey={(item, idx) => item.paymentId ?? idx}
        loading={loading}
        error={error}
        errorMessage='결제 내역 조회에 실패했습니다.'
        emptyMessage='검색 결과가 없습니다.'
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {showPaymentModal && (
        <PaymentManageModal
          open={showPaymentModal}
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}
