import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './DeliveryManagePage.module.css';
import SearchPanel from '@components/common/SearchPanel';
import DataTable from '@components/common/DataTable';
import DeliveryManageModal from '@modals/DeliveryManageModal';
import { fetchAllDeliveriesAdmin } from '@apis/deliveryApi';

const FILTERS = [
  { label: '전체', value: 'all' },
  { label: '직접 수령', value: 'pickedUp' },
  { label: '주문 완료', value: 'ordered' },
  { label: '배송 준비', value: 'ready' },
  { label: '배송 중', value: 'shipping' },
  { label: '배송 완료', value: 'complete' },
  { label: '배송 취소', value: 'cancel' },
];

const SEARCH_OPTIONS = [{ label: '주문번호', value: 'orderNo' }];

const COLUMNS = ['No', '상태', '주문번호', '배송지 주소', '결제 금액', '수령 전화번호', '세부사항'];
const GRID = '50px 110px 1fr 1.5fr 1fr 1fr 90px';

const filterToStatus = (filter) => {
  const map = { pickedUp: 'PICKED_UP', ordered: 'ORDERED', ready: 'READY', shipping: 'SHIPPING', complete: 'COMPLETE', cancel: 'CANCEL' };
  return map[filter];
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
  if (typeof item?.deliveryStatus === 'string') return item.deliveryStatus;
  if (typeof item?.status === 'string') return item.status;
  if (typeof item?.deliveryStatus === 'boolean') return item.deliveryStatus ? 'COMPLETE' : 'READY';
  return null;
};

const getStatusLabel = (statusEnum) => {
  const map = { PICKED_UP: '직접 수령', ORDERED: '주문 완료', READY: '배송 준비', SHIPPING: '배송 중', COMPLETE: '배송 완료', CANCEL: '배송 취소' };
  return map[statusEnum] ?? '-';
};

const getStatusClass = (statusEnum, styles) => {
  const map = { PICKED_UP: styles.statusPickedUp, ORDERED: styles.statusOrdered, READY: styles.statusReady, SHIPPING: styles.statusShipping, COMPLETE: styles.statusComplete, CANCEL: styles.statusCancel };
  return map[statusEnum] ?? styles.statusPickedUp;
};

export default function DeliveryManagePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchType] = useState('orderNo');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [deliveries, setDeliveries] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryModalMode, setDeliveryModalMode] = useState('view');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllDeliveriesAdmin(page, pageSize);
      const wrapper = res?.data ?? res;
      const payload = wrapper?.data ?? wrapper;

      setDeliveries(Array.isArray(payload?.content) ? payload.content : []);
      setTotalElements(typeof payload?.totalElements === 'number' ? payload.totalElements : 0);
      setTotalPages(typeof payload?.totalPages === 'number' ? payload.totalPages : 1);
    } catch (e) {
      setError(e);
      setDeliveries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

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

  const handleReset = () => {
    setActiveFilter('all');
    setSearch('');
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <SearchPanel
        filterLabel='배송 상태'
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchLabel='상세 검색'
        searchOptions={SEARCH_OPTIONS}
        searchType={searchType}
        searchValue={search}
        onSearchValueChange={setSearch}
        searchPlaceholder='주문번호를 입력해주세요'
        onSearch={fetchDeliveries}
        onReset={handleReset}
      />

      <DataTable
        title='배송 목록'
        total={totalElements || filteredData.length}
        columns={COLUMNS}
        gridTemplateColumns={GRID}
        data={filteredData}
        renderRow={(item, idx) => {
          const statusEnum = getStatusEnum(item);
          const orderNo = item?.orderNumber ?? item?.orderNo ?? item?.transactionId ?? '-';
          const baseAddr = item?.address ?? item?.deliveryAddress ?? '';
          const detailAddr = item?.detailAddress ?? '';
          const address = baseAddr || detailAddr ? `${baseAddr}${baseAddr && detailAddr ? ' ' : ''}${detailAddr}`.trim() : '-';
          const amount = item?.amount ?? item?.totalAmount ?? item?.price ?? '-';

          return (
            <>
              <div>{(page - 1) * pageSize + idx + 1}</div>
              <div>
                <span className={getStatusClass(statusEnum, styles)}>{getStatusLabel(statusEnum)}</span>
              </div>
              <div>{orderNo}</div>
              <div>{address}</div>
              <div>{typeof amount === 'string' && amount.includes('원') ? amount : formatWon(amount)}</div>
              <div>{normalizePhone(item?.phoneNumber ?? item?.phone)}</div>
              <div className={styles.actionIcons}>
                <button
                  type='button'
                  className={styles.actionBtn}
                  aria-label='조회'
                  onClick={() => {
                    const id = item?.deliveryId ?? item?.id;
                    if (!id) return;
                    setSelectedDeliveryId(id);
                    setDeliveryModalMode('view');
                    setShowDeliveryModal(true);
                  }}
                >
                  조회
                </button>
                <button
                  type='button'
                  className={styles.actionBtn}
                  aria-label='수정'
                  onClick={() => {
                    const id = item?.deliveryId ?? item?.id;
                    if (!id) return;
                    setSelectedDeliveryId(id);
                    setDeliveryModalMode('edit');
                    setShowDeliveryModal(true);
                  }}
                >
                  수정
                </button>
              </div>
            </>
          );
        }}
        rowKey={(item, idx) => item?.deliveryId ?? item?.id ?? idx}
        loading={loading}
        error={error}
        errorMessage='배송 조회에 실패했습니다.'
        emptyMessage='검색 결과가 없습니다.'
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

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
          onSuccess={fetchDeliveries}
        />
      )}
    </div>
  );
}
