import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import { fetchAllDeliveriesAdmin } from '@apis/deliveryApi';
import DeliveryManageModal from '@modals/DeliveryManageModal';

const STATUS_FILTERS = [
  { key: 'all',        label: '전체' },
  { key: 'ORDERED',    label: '주문완료' },
  { key: 'READY',      label: '배송준비' },
  { key: 'DELIVERING', label: '배송중' },    // 변경
  { key: 'COMPLETED',  label: '배송완료' },  // 변경
  { key: 'PICKED_UP',  label: '직접수령' },
  { key: 'CANCELED',   label: '취소' },      // 변경
];

const STATUS_MAP = {
  DELIVERING: { label: '배송중',   cls: 'badgeBlue' },   // SHIPPING → DELIVERING
  COMPLETED:  { label: '배송완료', cls: 'badgeGreen' },  // COMPLETE → COMPLETED
  CANCELED:   { label: '취소',     cls: 'badgeRed' },    // CANCEL → CANCELED
  PICKED_UP:  { label: '직접수령', cls: 'badgeGray' },
  ORDERED:    { label: '주문완료', cls: 'badgeAmber' },
  READY:      { label: '배송준비', cls: 'badgeBlue' },
};

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : String(v);
};

export default function DeliveryManagePage() {
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const pageSize = 5;

  const [deliveries, setDeliveries] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  const [selected, setSelected]   = useState(null);
  const [modalMode, setMode]       = useState('view');
  const [showModal, setShowModal] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllDeliveriesAdmin(page, pageSize);
      const payload = res?.data?.data ?? res?.data ?? res;
      setDeliveries(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch { setDeliveries([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [filter]);

  const displayed = useMemo(() => {
    let list = deliveries;
    const st = (d) => d.deliveryStatus ?? d.status ?? null;
    if (filter !== 'all') list = list.filter((d) => st(d) === filter);
    const kw = search.trim().toLowerCase();
    if (kw) list = list.filter((d) =>
      (d.receiverName ?? '').toLowerCase().includes(kw) ||
      normalizePhone(d.phoneNumber).includes(kw)
    );
    return list;
  }, [deliveries, filter, search]);

  const si = (d) => {
    const s = d.deliveryStatus ?? d.status ?? null;
    return STATUS_MAP[s] ?? { label: s ?? '-', cls: 'badgeGray' };
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>배송 관리</h1>
          <p className={shared.pageSubtitle}>Delivery Management</p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead} style={{ gap: 8 }}>
          <div className={shared.filterGroup} style={{ flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${shared.filterBtn} ${filter === f.key ? shared.filterBtnActive : ''}`}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>
          <div className={shared.searchBox} style={{ minWidth: 160 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="수령인 / 전화번호..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <table className={shared.table}>
          <thead className={shared.thead}>
            <tr>
              <th className={shared.th}>주문번호</th>
              <th className={shared.th}>수령인</th>
              <th className={shared.th}>주소</th>
              <th className={`${shared.th} ${shared.thRight}`}>결제금액</th>
              <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
              <th className={`${shared.th} ${shared.thRight}`}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:'36px', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>불러오는 중...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'36px', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>배송 내역이 없습니다.</td></tr>
            ) : displayed.map((d) => {
              const info = si(d);              
              return (
                <tr key={d.deliveryId} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMono}`}>{`DEL-${String(d.deliveryId).padStart(3,'0')}`}</td>
                  <td className={shared.td}>
                    <div className={shared.tdBold}>{d.receiverName ?? '-'}</div>
                    <div className={shared.tdSub}>{normalizePhone(d.phoneNumber)}</div>
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted}`} style={{ maxWidth: 200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {d.address ?? '-'}
                  </td>
                  <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>
                     {d.totalAmount ? `${Number(d.totalAmount).toLocaleString()}원` : '-'}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>
                  </td>
                  <td className={shared.td}>
                    <div className={shared.actionGroup}>
                      <button className={shared.btnOutline} onClick={() => { setSelected(d); setMode('view'); setShowModal(true); }}>상세</button>
                      <button className={`${shared.btnPrimary}`} style={{ padding:'5px 11px', fontSize:10 }}
                        onClick={() => { setSelected(d); setMode('edit'); setShowModal(true); }}>수정</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={shared.pagination}>
          <span className={shared.pageInfo}>총 {deliveries.length}건</span>
          <div className={shared.pageButtons}>
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button key={n} className={`${shared.pageBtn} ${page === n ? shared.pageBtnActive : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
          </div>
        </div>
      </div>

      {showModal && (
        <DeliveryManageModal
          open={showModal}
          mode={modalMode}
          deliveryId={selected?.deliveryId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetch(); }}
        />
      )}
    </div>
  );
}
