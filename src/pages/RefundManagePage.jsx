import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './PaymentManagePage.module.css';
import searchIcon from '@assets/images/search.png';

import { getAllRefundsAdmin } from '@apis/refundApi';

function RefundManageModal({ open = false, refund = null, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const safe = refund ?? {};

  const normalizePhone = (value) => {
    if (!value) return '-';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return String(value);
  };

  const statusLabel = (status) => {
    switch (status) {
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
        return status ?? '-';
    }
  };

  return (
    <div className={styles.overlay} onClick={() => onClose?.()} role='presentation'>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role='dialog' aria-modal='true'>
        <div className={styles.header}>
          <div className={styles.headerTitle}>환불 상세</div>
          <button type='button' className={styles.closeBtn} onClick={() => onClose?.()} aria-label='닫기'>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <div className={styles.label}>주문번호</div>
            <input className={styles.input} value={safe.transactionId ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>전화번호</div>
            <input className={styles.input} value={normalizePhone(safe.phoneNumber)} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>환불 사유</div>
            <input className={styles.input} value={safe.refundReason ?? '-'} disabled readOnly />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>환불 상태</div>
            <input className={styles.input} value={statusLabel(safe.refundStatus)} disabled readOnly />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <div className={styles.label}>설명</div>
            <textarea className={styles.textarea} value={safe.description ?? '-'} disabled readOnly />
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <div className={styles.label}>첨부 이미지</div>
            <textarea
              className={`${styles.textarea} ${styles.textareaTall}`}
              value={
                Array.isArray(safe.images) && safe.images.length > 0
                  ? safe.images
                      .map((img) => img?.imageUrl ?? '')
                      .filter(Boolean)
                      .join('\n')
                  : '-'
              }
              disabled
              readOnly
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type='button' className={styles.cancelBtn} onClick={() => onClose?.()}>
            닫기
          </button>
          <button type='button' className={styles.submitBtn} onClick={() => onClose?.()}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RefundManagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | waiting | approved | rejected | completed
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const [refunds, setRefunds] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 결제 페이지와 구조 통일을 위해 날짜 UI는 유지합니다.
  // RefundResponse에 날짜 필드가 현재 없어서, 날짜 필터는 일단 적용하지 않습니다.
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-28');
  const [, setEditingDate] = useState(false);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const normalizePhone = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return String(value);
  };

  const getRefundStatusEnum = (item) => {
    if (typeof item?.refundStatus === 'string') return item.refundStatus;
    return null;
  };

  const getRefundStatusLabel = (statusEnum) => {
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

  // 결제 페이지와 동일하게 status pill class를 재사용합니다.
  // CSS는 나중에 조정하실 수 있으니, 일단 COMPLETE/CANCEL 스타일을 재활용합니다.
  const getRefundStatusClass = (statusEnum) => {
    if (statusEnum === 'REJECTED') return styles.statusCancel;
    if (statusEnum === 'WAITING') return styles.statusComplete;
    if (statusEnum === 'APPROVED' || statusEnum === 'ACCEPTED') return styles.statusComplete;
    if (statusEnum === 'COMPLETED' || statusEnum === 'DONE') return styles.statusComplete;
    return styles.statusComplete;
  };

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllRefundsAdmin(page, pageSize);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setRefunds(Array.isArray(payload?.content) ? payload.content : []);
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

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim();

    return refunds.filter((item) => {
      const statusEnum = getRefundStatusEnum(item);

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'waiting' && statusEnum === 'WAITING') ||
        (activeFilter === 'approved' && (statusEnum === 'APPROVED' || statusEnum === 'ACCEPTED')) ||
        (activeFilter === 'rejected' && statusEnum === 'REJECTED') ||
        (activeFilter === 'completed' && (statusEnum === 'COMPLETED' || statusEnum === 'DONE'));

      const matchesSearch =
        !keyword ||
        String(item?.transactionId ?? '').includes(keyword) ||
        String(item?.phoneNumber ?? '').includes(keyword) ||
        String(item?.refundReason ?? '').includes(keyword) ||
        String(item?.description ?? '').includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [refunds, searchTerm, activeFilter]);

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
          <span className={styles.title}>환불 관리</span>
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
            placeholder='주문번호/전화번호를 입력해주세요'
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
              className={activeFilter === 'waiting' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('waiting')}
              type='button'
            >
              대기
            </button>
            <button
              className={activeFilter === 'approved' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('approved')}
              type='button'
            >
              승인
            </button>
            <button
              className={activeFilter === 'rejected' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('rejected')}
              type='button'
            >
              반려
            </button>
            <button
              className={activeFilter === 'completed' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('completed')}
              type='button'
            >
              완료
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div>순번</div>
          <div>환불 상태</div>
          <div>주문번호</div>
          <div>전화번호</div>
          <div>환불 사유</div>
          <div>설명</div>
          <div>세부사항</div>
        </div>

        {loading && <div className={styles.noData}>불러오는 중...</div>}
        {error && <div className={styles.noData}>환불 내역 조회에 실패했습니다.</div>}
        {!loading && !error && filteredData.length === 0 && <div className={styles.noData}>검색 결과가 없습니다.</div>}

        {!loading && !error && (
          <>
            {filteredData.map((item, idx) => (
              <div className={styles.tableRow} key={`${item.transactionId ?? 'refund'}-${idx}`}>
                <div>{(page - 1) * pageSize + idx + 1}</div>
                <div>
                  <span className={getRefundStatusClass(getRefundStatusEnum(item))}>
                    {getRefundStatusLabel(getRefundStatusEnum(item))}
                  </span>
                </div>
                <div>{item.transactionId ?? '-'}</div>
                <div>{normalizePhone(item.phoneNumber) || '-'}</div>
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

      {showRefundModal && (
        <RefundManageModal
          open={showRefundModal}
          refund={selectedRefund}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedRefund(null);
          }}
        />
      )}
    </div>
  );
}
