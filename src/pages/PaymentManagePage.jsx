import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import { getPaymentsAdmin } from '@apis/paymentApi';
import PaymentManageModal from '@modals/PaymentManageModal';

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'APPROVED', label: '결제완료' },
  { key: 'CANCELED', label: '결제취소' },
];

const STATUS_MAP = {
  APPROVED: { label: '결제완료', cls: 'badgeGreen' },
  CANCELED: { label: '결제취소', cls: 'badgeRed' },
};

// 헬퍼: 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getToday = () => new Date().toISOString().split('T')[0];
// 헬퍼: N일 전 날짜를 YYYY-MM-DD 형식으로 반환
const getPastDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const normalizePhone = (v) => {
  if (!v) return '-';
  const d = String(v).replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  return String(v);
};

const fmtDate = (date, time) => {
  if (!date || date.length !== 8) return '-';
  const y = date.slice(0, 4),
    m = date.slice(4, 6),
    d = date.slice(6, 8);
  if (!time || time.length < 4) return `${y}.${m}.${d}`;
  return `${y}.${m}.${d} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6) || '00'}`;
};

export default function PaymentManagePage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // 1. 초기 날짜 설정: 최근 1주일 (기획적 성능 고려)
  const [startDate, setStart] = useState(getPastDate(30));
  const [endDate, setEnd] = useState(getToday());

  const pageSize = 7;
  const [payments, setPayments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 2. fetch 함수: 날짜와 필터 변경 시 서버에 요청할 수 있도록 의존성 준비
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // 추후 API 수정 시 아래 주석처럼 파라미터 전달 가능
      // const res = await getPaymentsAdmin({ page, pageSize, startDate, endDate, filter, search });
      const res = await getPaymentsAdmin(page, pageSize);
      const payload = res?.data?.data ?? res?.data ?? res;
      setPayments(Array.isArray(payload?.content) ? payload.content : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, filter]); // 필터 조건들을 의존성에 추가

  useEffect(() => {
    fetch();
  }, [fetch]);

  // 검색어나 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [filter, search, startDate, endDate]);

  // 3. 클라이언트 사이드 필터링 (현재는 가져온 데이터 내에서 검색)
  const displayed = useMemo(() => {
    let list = payments;

    // A. 날짜 필터링
    if (startDate && endDate) {
      const s = startDate.replace(/-/g, '');
      const e = endDate.replace(/-/g, '');
      list = list.filter((p) => p.approvedDate >= s && p.approvedDate <= e);
    }

    // B. 유형 필터링
    if (filter !== 'all') list = list.filter((p) => p.paymentStatus === filter);

    // C. 키워드 필터링 (전화번호/카드번호)
    const kw = search.trim().replace(/-/g, '');
    if (kw) {
      list = list.filter((p) => {
        const phone = String(p.phoneNumber || '').replace(/\D/g, '');
        const card = String(p.cardNumber || '').replace(/\D/g, '');
        return phone.includes(kw) || card.includes(kw);
      });
    }
    return list;
  }, [payments, filter, search, startDate, endDate]);

  const si = (s) => STATUS_MAP[s] ?? { label: s ?? '-', cls: 'badgeGray' };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>결제 관리</h1>
          <p className={shared.pageSubtitle}>Payment Management</p>
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
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className={shared.dateFilter}>
            <div className={shared.dateInput}>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='2'>
                <rect x='3' y='4' width='18' height='18' rx='2' />
                <line x1='16' y1='2' x2='16' y2='6' />
                <line x1='8' y1='2' x2='8' y2='6' />
                <line x1='3' y1='10' x2='21' y2='10' />
              </svg>
              <input type='date' value={startDate} onChange={(e) => setStart(e.target.value)} />
            </div>
            <span className={shared.dateSep}>~</span>
            <div className={shared.dateInput}>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='2'>
                <rect x='3' y='4' width='18' height='18' rx='2' />
                <line x1='16' y1='2' x2='16' y2='6' />
                <line x1='8' y1='2' x2='8' y2='6' />
                <line x1='3' y1='10' x2='21' y2='10' />
              </svg>
              <input type='date' value={endDate} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className={shared.searchBox} style={{ minWidth: 220 }}>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='2'>
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
              <input
                placeholder='전화번호 또는 카드번호 검색...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <table className={shared.table}>
          <thead className={shared.thead}>
            <tr>
              <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
              <th className={`${shared.th} ${shared.thCenter}`}>주문번호</th>
              <th className={`${shared.th} ${shared.thCenter}`}>전화번호</th>
              <th className={`${shared.th} ${shared.thCenter}`}>승인일시</th>
              <th className={`${shared.th} ${shared.thCenter}`}>카드번호</th>
              <th className={`${shared.th} ${shared.thRight}`}>결제금액</th>
              <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
              <th className={`${shared.th} ${shared.thCenter}`}>상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}
                >
                  불러오는 중...
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}
                >
                  해당 조건의 결제 내역이 없습니다.
                </td>
              </tr>
            ) : (
              displayed.map((p) => {
                const info = si(p.paymentStatus);
                return (
                  <tr key={p.id} className={shared.tr}>
                    {/* 데이터 고유 ID 값. 추후 수정 */}
                    <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>1</td>
                    <td className={`${shared.td} ${shared.tdMono} ${shared.tdCenter}`}>{p.transactionId ?? '-'}</td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>{normalizePhone(p.phoneNumber)}</td>
                    <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                      {fmtDate(p.approvedDate, p.approvedTime)}
                    </td>
                    <td
                      className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}
                      style={{ fontFamily: 'monospace', fontSize: 10 }}
                    >
                      {p.cardNumber ? `${p.cardNumber.slice(0, 4)}-****-****-${p.cardNumber.slice(-4)}` : '-'}
                    </td>
                    <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>
                      {Number(p.totalAmount).toLocaleString()}원
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>
                    </td>
                    <td className={shared.td}>
                      <div className={shared.actionGroup} style={{ justifyContent: 'center' }}>
                        <button
                          className={shared.btnOutline}
                          onClick={() => {
                            setSelected(p);
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

        <div className={shared.pagination} style={{ position: 'relative' }}>
          <span className={shared.pageInfo} style={{ position: 'absolute', left: '22px' }}>
            총 {displayed.length}건
          </span>
          <div className={shared.pageButtons} style={{ margin: '0 auto' }}>
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`${shared.pageBtn} ${page === n ? shared.pageBtnActive : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button className={shared.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              ›
            </button>
          </div>
        </div>
      </div>

      {showModal && <PaymentManageModal open={showModal} payment={selected} onClose={() => setShowModal(false)} />}
    </div>
  );
}
