import React, { useEffect, useMemo, useState } from 'react';
import PaymentManageModal from '@modals/PaymentManageModal';
import styles from './PaymentManagePage.module.css';
import searchIcon from '@assets/images/search.png';

import { getPaymentsAdmin } from '@apis/paymentApi';

export default function PaymentManagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const [payments, setPayments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [, setEditingDate] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  const getPaymentStatusEnum = (item) => {
    if (typeof item?.paymentStatus === 'string') return item.paymentStatus;
    return null;
  };

  const getPaymentStatusLabel = (statusEnum) => {
    switch (statusEnum) {
      case 'CANCELED':
        return '결제 취소';
      case 'APPROVED':
        return '결제 완료';
      default:
        return statusEnum ? String(statusEnum) : '결제 완료';
    }
  };

  const getPaymentStatusClass = (statusEnum) => {
    if (statusEnum === 'CANCELED') return styles.statusCancel;
    return styles.statusComplete;
  };

  const fetchPayments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentsAdmin(page, pageSize);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setPayments(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(typeof payload?.totalPages === 'number' ? payload.totalPages : 1);
    } catch (e) {
      setError(e);
      setPayments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim();

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return payments.filter((item) => {
      // 결제 상태 필터(현재는 승인 결제만 내려오므로 complete만 의미 있음)
      const statusEnum = getPaymentStatusEnum(item);
      const isCanceled = statusEnum === 'CANCELED' || statusEnum === 'CANCELLED';
      const isComplete = !isCanceled; // 승인/완료/그 외는 일단 완료로 취급

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'complete' && isComplete) ||
        (activeFilter === 'cancel' && isCanceled);

      // 검색
      const matchesSearch =
        !keyword ||
        String(item?.cardNumber ?? '').includes(keyword) ||
        String(item?.phoneNumber ?? '').includes(keyword) ||
        String(item?.approvalNumber ?? '').includes(keyword) ||
        String(item?.totalAmount ?? '').includes(keyword);

      let inRange = true;
      if (start || end) {
        if (item?.approvedDate && item.approvedDate.length === 8) {
          const y = item.approvedDate.slice(0, 4);
          const m = item.approvedDate.slice(4, 6);
          const d = item.approvedDate.slice(6, 8);
          const approvedAt = new Date(`${y}-${m}-${d}`);
          if (start && approvedAt < start) inRange = false;
          if (end && approvedAt > end) inRange = false;
        }
      }

      return matchesFilter && matchesSearch && inRange;
    });
  }, [payments, searchTerm, activeFilter, startDate, endDate]);

  const pages = useMemo(() => {
    const maxButtons = 5;
    const tp = Math.max(1, totalPages);
    const current = Math.min(Math.max(1, page), tp);

    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = Math.min(tp, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const arr = [];
    for (let p = start; p <= end; p += 1) arr.push(p);
    return arr;
  }, [page, totalPages]);

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <div className={styles.titleWithButton}>
          <span className={styles.title}>결제 관리</span>
        </div>
      </div>

      <div className={styles.topBar}>
        <div className={styles.dateRange}>
          <input
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onFocus={() => setEditingDate(true)}
            onBlur={() => setEditingDate(false)}
          />
          <span className={styles.dateDash}>~</span>
          <input
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onFocus={() => setEditingDate(true)}
            onBlur={() => setEditingDate(false)}
          />
        </div>
        <div className={styles.searchBoxWide}>
          <input
            type='text'
            className={styles.searchInputWide}
            placeholder='전화번호/카드번호를 입력해주세요'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.searchIcon} aria-hidden='true'>
            <img src={searchIcon} alt='검색' />
          </div>

          <div className={styles.filterButtons}>
            <button
              className={activeFilter === 'all' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('all')}
              type='button'
            >
              전체
            </button>
            <button
              className={activeFilter === 'complete' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('complete')}
              type='button'
            >
              결제 완료
            </button>
            <button
              className={activeFilter === 'cancel' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('cancel')}
              type='button'
            >
              결제 취소
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div>순번</div>
          <div>결제 상태</div>
          <div>거래 시각</div>
          <div>카드 번호</div>
          <div>청구 금액</div>
          <div>수령 전화번호</div>
          <div>세부사항</div>
        </div>

        {loading && <div className={styles.noData}>불러오는 중...</div>}
        {error && <div className={styles.noData}>결제 내역 조회에 실패했습니다.</div>}
        {!loading && !error && filteredData.length === 0 && <div className={styles.noData}>검색 결과가 없습니다.</div>}

        {!loading && !error && (
          <>
            {filteredData.map((item, idx) => (
              <div className={styles.tableRow} key={item.paymentId ?? idx}>
                <div>{(page - 1) * pageSize + idx + 1}</div>
                <div>
                  <span className={getPaymentStatusClass(getPaymentStatusEnum(item))}>
                    {getPaymentStatusLabel(getPaymentStatusEnum(item))}
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
              </div>
            ))}
          </>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          type='button'
          aria-label='이전 페이지'
          onClick={() => setPage((p) => (p > 1 ? p - 1 : p))}
        >
          &lt;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={p === page ? styles.pageButtonActive : styles.pageButton}
            type='button'
            onClick={() => setPage(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          className={styles.pageButton}
          type='button'
          aria-label='다음 페이지'
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
        >
          &gt;
        </button>
      </div>
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
