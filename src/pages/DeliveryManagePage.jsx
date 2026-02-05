import React, { useEffect, useMemo, useState } from 'react';
import styles from './DeliveryManagePage.module.css';
import searchIcon from '@assets/images/search.png';
import clipboardIcon from '@assets/images/clipboard.png';
import updateIcon from '@assets/images/update.png';

import DeliveryManageModal from '@modals/DeliveryManageModal';

import { fetchAllDeliveriesAdmin } from '@apis/deliveryApi';

export default function DeliveryManagePage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryModalMode, setDeliveryModalMode] = useState('view'); // 'view' | 'edit'
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);

  const pageSize = 5;
  const [deliveries, setDeliveries] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filterToStatus = (filter) => {
    if (filter === 'pickedUp') return 'PICKED_UP';
    if (filter === 'ordered') return 'ORDERED';
    if (filter === 'ready') return 'READY';
    if (filter === 'shipping') return 'SHIPPING';
    if (filter === 'complete') return 'COMPLETE';
    if (filter === 'cancel') return 'CANCEL';
    return undefined; // all
  };

  const formatWon = (value) => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return `${num.toLocaleString()}원`;
  };

  const normalizePhone = (value) => {
    if (!value) return '-';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    return String(value);
  };

  const getStatusEnum = (item) => {
    // 백엔드가 deliveryStatus: "ORDERED" 형태로 내려오는 케이스
    if (typeof item?.deliveryStatus === 'string') return item.deliveryStatus;
    // 혹시 status 필드로 내려오는 케이스도 방어
    if (typeof item?.status === 'string') return item.status;
    // boolean 형태였던 구버전 대응
    if (typeof item?.deliveryStatus === 'boolean') return item.deliveryStatus ? 'COMPLETE' : 'READY';
    return null;
  };

  const getStatusLabel = (statusEnum) => {
    switch (statusEnum) {
      case 'PICKED_UP':
        return '직접 수령';
      case 'ORDERED':
        return '주문 완료';
      case 'READY':
        return '배송 준비';
      case 'SHIPPING':
        return '배송 중';
      case 'COMPLETE':
        return '배송 완료';
      case 'CANCEL':
        return '배송 취소';
      default:
        return '-';
    }
  };

  const getStatusClass = (statusEnum) => {
    switch (statusEnum) {
      case 'PICKED_UP':
        return styles.statusPickedUp;
      case 'ORDERED':
        return styles.statusOrdered;
      case 'READY':
        return styles.statusReady;
      case 'SHIPPING':
        return styles.statusShipping;
      case 'COMPLETE':
        return styles.statusComplete;
      case 'CANCEL':
        return styles.statusCancel;
      default:
        return styles.statusPickedUp;
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllDeliveriesAdmin(page, pageSize);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setDeliveries(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(typeof payload?.totalPages === 'number' ? payload.totalPages : 1);
    } catch (e) {
      setError(e);
      setDeliveries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredData = useMemo(() => {
    const keyword = search.trim();
    const targetStatus = filterToStatus(activeFilter);

    return deliveries.filter((item) => {
      const statusEnum = getStatusEnum(item);
      const matchesFilter = !targetStatus || statusEnum === targetStatus;

      const matchesSearch =
        !keyword ||
        String(item?.orderNumber ?? item?.orderNo ?? item?.transactionId ?? '').includes(keyword) ||
        String(item?.address ?? item?.deliveryAddress ?? '').includes(keyword) ||
        String(item?.phoneNumber ?? item?.phone ?? '').includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [deliveries, search, activeFilter]);

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
          <span className={styles.title}>배송 관리</span>
        </div>
      </div>

      <div className={styles.topBar}>
        <div className={styles.searchBoxWide}>
          <input
            type='text'
            className={styles.searchInputWide}
            placeholder='주문번호를 입력해주세요'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              className={activeFilter === 'pickedUp' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('pickedUp')}
              type='button'
            >
              직접 수령
            </button>
            <button
              className={activeFilter === 'ordered' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('ordered')}
              type='button'
            >
              주문 완료
            </button>
            <button
              className={activeFilter === 'ready' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('ready')}
              type='button'
            >
              배송 준비
            </button>
            <button
              className={activeFilter === 'shipping' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('shipping')}
              type='button'
            >
              배송 중
            </button>
            <button
              className={activeFilter === 'complete' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('complete')}
              type='button'
            >
              배송 완료
            </button>
            <button
              className={activeFilter === 'cancel' ? styles.filterButtonActive : styles.filterButton}
              onClick={() => setActiveFilter('cancel')}
              type='button'
            >
              배송 취소
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div>순번</div>
          <div>상태</div>
          <div>주문번호</div>
          <div>배송지 주소</div>
          <div>결제 금액</div>
          <div>수령 전화번호</div>
          <div>세부사항</div>
        </div>

        {loading && <div className={styles.noData}>불러오는 중...</div>}
        {error && <div className={styles.noData}>배송 조회에 실패했습니다.</div>}
        {!loading && !error && filteredData.length === 0 && <div className={styles.noData}>검색 결과가 없습니다</div>}

        {!loading && !error && (
          <>
            {filteredData.map((item, idx) => {
              const statusEnum = getStatusEnum(item);
              const statusLabel = getStatusLabel(statusEnum);
              const orderNo = item?.orderNumber ?? item?.orderNo ?? item?.transactionId ?? '-';
              const baseAddress = item?.address ?? item?.deliveryAddress ?? '';
              const detailAddress = item?.detailAddress ?? '';
              const address =
                baseAddress || detailAddress
                  ? `${baseAddress}${baseAddress && detailAddress ? ' ' : ''}${detailAddress}`.trim()
                  : '-';
              const amount = item?.amount ?? item?.totalAmount ?? item?.price ?? '-';
              const phone = item?.phoneNumber ?? item?.phone ?? '-';

              return (
                <div className={styles.tableRow} key={item?.deliveryId ?? item?.id ?? idx}>
                  <div>{(page - 1) * pageSize + idx + 1}</div>
                  <div className={styles.statusCell}>
                    <span className={getStatusClass(statusEnum)}>{statusLabel}</span>
                  </div>
                  <div>{orderNo}</div>
                  <div>{address}</div>
                  <div>{typeof amount === 'string' && amount.includes('원') ? amount : formatWon(amount)}</div>
                  <div>{normalizePhone(phone)}</div>
                  <div className={styles.actionIcons}>
                    <button
                      type='button'
                      className={styles.iconButton}
                      aria-label='조회'
                      onClick={() => {
                        const id = item?.deliveryId ?? item?.id;
                        if (!id) return;
                        setSelectedDeliveryId(id);
                        setDeliveryModalMode('view');
                        setShowDeliveryModal(true);
                      }}
                    >
                      <img src={clipboardIcon} alt='조회' />
                    </button>
                    <button
                      type='button'
                      className={styles.iconButton}
                      aria-label='수정'
                      onClick={() => {
                        const id = item?.deliveryId ?? item?.id;
                        if (!id) return;
                        setSelectedDeliveryId(id);
                        setDeliveryModalMode('edit');
                        setShowDeliveryModal(true);
                      }}
                    >
                      <img src={updateIcon} alt='수정' />
                    </button>
                  </div>
                </div>
              );
            })}
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
      {showDeliveryModal && (
        <DeliveryManageModal
          open={showDeliveryModal}
          mode={deliveryModalMode}
          deliveryId={selectedDeliveryId}
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedDeliveryId(null);
            setDeliveryModalMode('view');
          }}
          onSuccess={() => {
            fetchDeliveries();
          }}
        />
      )}
    </div>
  );
}
