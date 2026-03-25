import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import { getAllRefundsAdmin } from '@apis/refundApi';
import RefundManageModal from '@modals/RefundManageModal';

const STATUS_FILTERS = [
  { key: 'all',      label: '전체' },
  { key: 'WAITING',  label: '대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
  { key: 'COMPLETED',label: '완료' },
];

const STATUS_MAP = {
  WAITING:   { label: '대기', cls: 'badgeAmber' },
  APPROVED:  { label: '승인', cls: 'badgeGreen' },
  ACCEPTED:  { label: '승인', cls: 'badgeGreen' },
  REJECTED:  { label: '반려', cls: 'badgeRed' },
  COMPLETED: { label: '완료', cls: 'badgeBlue' },
  DONE:      { label: '완료', cls: 'badgeBlue' },
};

const REASON_MAP = {
  ETC: '기타',
  DEFECT: '상품불량',
  CHANGE_OF_MIND: '단순변심',
  WRONG_ORDER: '오주문',
};

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : String(v);
};

export default function RefundManagePage() {
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);
  const pageSize = 7;

  const [refunds, setRefunds]       = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  const [selected, setSelected]   = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllRefundsAdmin(page, pageSize);
      const payload = res?.data?.data ?? res?.data ?? res;
      setRefunds(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch { setRefunds([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [filter]);

  const displayed = useMemo(() => {
    if (filter === 'all') return refunds;
    return refunds.filter((r) => {
      const s = r.refundStatus ?? '';
      if (filter === 'APPROVED') return s === 'APPROVED' || s === 'ACCEPTED';
      if (filter === 'COMPLETED') return s === 'COMPLETED' || s === 'DONE';
      return s === filter;
    });
  }, [refunds, filter]);

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
        <div className={shared.cardHead}>
          <div className={shared.filterGroup}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${shared.filterBtn} ${filter === f.key ? shared.filterBtnActive : ''}`}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>
        </div>

        <table className={shared.table}>
          <thead className={shared.thead}>
            <tr>
              <th className={shared.th}>주문번호</th>
              <th className={shared.th}>전화번호</th>
              <th className={shared.th}>환불사유</th>
              <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
              <th className={`${shared.th} ${shared.thRight}`}>상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:'36px', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>불러오는 중...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:'36px', textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>환불 내역이 없습니다.</td></tr>
            ) : displayed.map((r) => {
              const info = si(r);
              return (
                <tr key={r.id} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMono}`}>{r.transactionId ?? '-'}</td>
                  <td className={shared.td}>{normalizePhone(r.phoneNumber)}</td>
                  <td className={`${shared.td} ${shared.tdMuted}`}>{REASON_MAP[r.refundReason] ?? r.refundReason ?? '-'}</td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>
                  </td>
                  <td className={shared.td}>
                    <div className={shared.actionGroup}>
                      <button className={shared.btnOutline} onClick={() => { setSelected(r); setShowModal(true); }}>상세보기</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={shared.pagination}>
          <span className={shared.pageInfo}>총 {refunds.length}건</span>
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
        <RefundManageModal open={showModal} refund={selected} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
