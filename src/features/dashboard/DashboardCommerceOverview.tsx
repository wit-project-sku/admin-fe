import { useMemo, useState } from 'react';
import { DollarSign, Package, Search, ShoppingCart, Truck, Undo2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import { getPastDateYmd, getTodayYmd } from '../../utils/dateUtils';

/** Matches --accent / primary chart color */
const CHART_ACCENT = '#2563eb';

/** Demo data — replace with commerce API when available */
const MOCK_METRICS = {
  estimatedRevenue: 3_450_000,
  newOrders: 142,
  newOrdersTrend: 8.4,
  inDelivery: 58,
  refundRequests: 3,
  cumulativeTotal: 125_400_000,
};

const REVENUE_TREND = [
  { day: '월', value: 320 },
  { day: '화', value: 280 },
  { day: '수', value: 410 },
  { day: '목', value: 380 },
  { day: '금', value: 520 },
  { day: '토', value: 590 },
  { day: '일', value: 480 },
];

const ORDER_STATUS_PIE = [
  { name: '결제완료', value: 24, color: '#3b82f6' },
  { name: '배송준비', value: 18, color: '#eab308' },
  { name: '배송중', value: 22, color: '#a855f7' },
  { name: '배송완료', value: 32, color: '#22c55e' },
  { name: '취소/환불', value: 4, color: '#ef4444' },
];

type OrderRow = {
  id: string;
  timeLabel: string;
  customer: string;
  item: string;
  amount: number;
  status: string;
  badge: 'blue' | 'purple' | 'red' | 'green' | 'amber';
};

const MOCK_ORDERS: OrderRow[] = [
  {
    id: 'ORD-0410-001',
    timeLabel: '10분 전',
    customer: '김*헌',
    item: '한복 프리미엄 패키지 외 1건',
    amount: 89_000,
    status: '결제완료',
    badge: 'blue',
  },
  {
    id: 'ORD-0410-002',
    timeLabel: '1시간 전',
    customer: '이*준',
    item: '현대복 베이직 세트',
    amount: 45_000,
    status: '배송중',
    badge: 'purple',
  },
  {
    id: 'ORD-0410-003',
    timeLabel: '2시간 전',
    customer: '박*서',
    item: '코스튬 스페셜 에디션',
    amount: 120_000,
    status: '환불요청',
    badge: 'red',
  },
  {
    id: 'ORD-0410-004',
    timeLabel: '5시간 전',
    customer: '최*우',
    item: '교복 풀세트',
    amount: 65_000,
    status: '배송완료',
    badge: 'green',
  },
];

function badgeClass(b: OrderRow['badge']) {
  const map = {
    blue: s.badgeBlue,
    purple: s.badgePurple,
    red: s.badgeRed,
    green: s.badgeGreen,
    amber: s.badgeAmber,
  } as const;
  return `${s.badge} ${map[b]}`;
}

export function DashboardCommerceOverview() {
  const [rangeStart, setRangeStart] = useState(getPastDateYmd(40));
  const [rangeEnd, setRangeEnd] = useState(getTodayYmd());

  const gradientId = useMemo(() => `commerceRev-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <div className={s.root}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>쇼핑몰 커머스 현황</h1>
          <p className={shared.pageSubtitle}>Wit Global Shopping Commerce</p>
        </div>
      </div>

      <section className={s.metricsGrid} aria-label='핵심 지표'>
        <div className={s.metricCard}>
          <div className={s.metricTop}>
            <div className={s.metricIcon} style={{ background: 'linear-gradient(145deg, #3b82f6, #1d4ed8)' }}>
              <DollarSign size={18} strokeWidth={2} aria-hidden />
            </div>
          </div>
          <div className={s.metricLabel}>오늘 예상 매출</div>
          <div className={s.metricValue}>
            {MOCK_METRICS.estimatedRevenue.toLocaleString()}
            <span className={s.metricUnit}>원</span>
          </div>
        </div>

        <div className={s.metricCard}>
          <div className={s.metricTop}>
            <div className={s.metricIcon} style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
              <ShoppingCart size={18} strokeWidth={2} aria-hidden />
            </div>
            <span className={s.trendUp}>📈 {MOCK_METRICS.newOrdersTrend}%</span>
          </div>
          <div className={s.metricLabel}>신규 주문</div>
          <div className={s.metricValue}>
            {MOCK_METRICS.newOrders.toLocaleString()}
            <span className={s.metricUnit}>건</span>
          </div>
        </div>

        <div className={s.metricCard}>
          <div className={s.metricTop}>
            <div className={s.metricIcon} style={{ background: 'linear-gradient(145deg, #f97316, #ea580c)' }}>
              <Truck size={18} strokeWidth={2} aria-hidden />
            </div>
          </div>
          <div className={s.metricLabel}>배송 처리중</div>
          <div className={s.metricValue}>
            {MOCK_METRICS.inDelivery.toLocaleString()}
            <span className={s.metricUnit}>건</span>
          </div>
        </div>

        <div className={s.metricCard}>
          <div className={s.metricTop}>
            <div className={s.metricIcon} style={{ background: 'linear-gradient(145deg, #ef4444, #dc2626)' }}>
              <Undo2 size={18} strokeWidth={2} aria-hidden />
            </div>
          </div>
          <div className={s.metricLabel}>취소/환불 요청</div>
          <div className={s.metricValue}>
            {MOCK_METRICS.refundRequests.toLocaleString()}
            <span className={s.metricUnit}>건</span>
          </div>
        </div>
      </section>

      <section className={s.cumulativeBar} aria-label='기간별 누적 매출'>
        <div className={s.cumulativeLeft}>
          <p className={s.cumulativeTag}>Cumulative revenue</p>
          <h2 className={s.cumulativeTitle}>기간별 누적 매출</h2>
          <p className={s.cumulativeHint}>선택한 기간 동안의 총 결제 금액을 확인하세요</p>
        </div>
        <div className={s.cumulativeCenter}>
          <div className={s.dateDark}>
            <input type='date' value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} aria-label='시작일' />
            <span className={s.dateSep}>~</span>
            <input type='date' value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} aria-label='종료일' />
          </div>
          <button type='button' className={s.searchBtn}>
            <Search size={16} strokeWidth={2.5} aria-hidden />
            조회
          </button>
        </div>
        <div className={s.cumulativeRight}>
          <p className={s.totalLabel}>Total amount</p>
          <p className={s.totalAmount}>{MOCK_METRICS.cumulativeTotal.toLocaleString()} 원</p>
        </div>
      </section>

      <div className={s.chartsRow}>
        <div className={s.chartCard}>
          <div className={s.chartHead}>
            <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>Weekly Trend</span>
            <p className={s.chartSubtitle}>이번 주 쇼핑몰 매출 추이</p>
          </div>
          <div className={s.chartBody}>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={REVENUE_TREND} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={CHART_ACCENT} stopOpacity={0.35} />
                    <stop offset='95%' stopColor={CHART_ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke='#f1f5f9' />
                <XAxis dataKey='day' axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={(v) => `${v}만`}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}만`, '매출']}
                  contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
                />
                <Area
                  type='monotone'
                  dataKey='value'
                  stroke={CHART_ACCENT}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={s.chartCard}>
          <div className={s.pieHead}>
            <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>Order status</span>
          </div>
          <div className={s.chartBody}>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={ORDER_STATUS_PIE}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='48%'
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {ORDER_STATUS_PIE.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}건`, '']} />
                <Legend
                  verticalAlign='bottom'
                  iconType='circle'
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className={s.ordersCard} aria-label='최근 주문'>
        <div className={s.ordersHead}>
          <div className={s.ordersTitleRow}>
            <div className={s.ordersIcon} aria-hidden>
              <Package size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className={s.ordersSectionTitle}>최근 실시간 주문 내역</h2>
              <p className={s.ordersDesc}>오늘 들어온 주문 및 상태를 바로 확인하세요</p>
            </div>
          </div>
          <Link to='/admin/deliveries' className={s.viewAllBtn}>
            전체 주문 보기
          </Link>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.th}>Order id / time</th>
                <th className={s.th}>Customer</th>
                <th className={s.th}>Item</th>
                <th className={s.th}>Amount</th>
                <th className={s.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map((row) => (
                <tr key={row.id}>
                  <td className={s.td}>
                    <span className={s.orderId}>{row.id}</span>
                    <span className={s.orderTime}>{row.timeLabel}</span>
                  </td>
                  <td className={s.td}>{row.customer}</td>
                  <td className={s.td}>{row.item}</td>
                  <td className={`${s.td} ${s.amount}`}>{row.amount.toLocaleString()}원</td>
                  <td className={s.td}>
                    <span className={badgeClass(row.badge)}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.note}>
          커머스 탭 수치는 데모 데이터입니다. API 연동 시 이 영역을 실제 주문·매출 엔드포인트로 교체하세요.
        </p>
      </section>
    </div>
  );
}
