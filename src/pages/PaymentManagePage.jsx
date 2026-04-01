import { useState, useEffect, useCallback, useMemo } from 'react';
import shared from '@commons/shared.module.css';
import { getPaymentsAdmin } from '@apis/paymentApi';

import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import EditBtn from '../components/common/EditBtn';
import DeleteBtn from '../components/common/DeleteBtn';
import RegisterBtn from '../components/common/RegisterBtn';
import DateRangePicker from '../components/common/DateRangePicker';
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
  const [startDate, setStartDate] = useState(getPastDate(30));
  const [endDate, setEndDate] = useState(getToday());

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
        <div
          className={shared.cardHead}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            flexWrap: 'nowrap', // 한 줄 유지
            overflowX: 'auto', // 좁아지면 툴바 자체 스크롤
          }}
        >
          {/* 1. 상태 필터 */}
          <FilterGroup filters={STATUS_FILTERS} current={filter} onFilterChange={setFilter} />

          {/* 세로 구분선 */}
          <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 8px' }} />

          {/* 2. 날짜 선택기 */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />

          {/* 3. 검색창 (우측 정렬) */}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder='주문번호 또는 상품명 검색...'
              minWidth='300px'
            />
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

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={payments.length}
          unit='건'
        />
      </div>

      {showModal && <PaymentManageModal open={showModal} payment={selected} onClose={() => setShowModal(false)} />}
    </div>
  );
}
