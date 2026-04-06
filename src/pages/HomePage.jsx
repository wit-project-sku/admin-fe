import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import giftIcon from '@assets/images/gift.png';
import cardIcon from '@assets/images/card.png';
import messageIcon from '@assets/images/message.png';
import dotIcon from '@assets/images/dot.png';
import userIcon from '@assets/images/user.png';
import barchartIcon from '@assets/images/barchart.png';
import calendarIcon from '@assets/images/calendar.png';

const STAT_CARDS = [
  {
    label: '총 상품 수',
    value: '1,248',
    sub: '판매중 983개',
    icon: giftIcon,
    color: '#8c9ee7',
    bg: '#eef0fb',
    path: '/admin/products',
  },
  {
    label: '오늘 결제',
    value: '₩2,340,000',
    sub: '38건',
    icon: cardIcon,
    color: '#34d399',
    bg: '#e6faf4',
    path: '/admin/payments',
  },
  {
    label: '배송 진행 중',
    value: '124건',
    sub: '지연 7건',
    icon: messageIcon,
    color: '#f59e0b',
    bg: '#fef9ec',
    path: '/admin/deliveries',
  },
  {
    label: '환불 요청',
    value: '12건',
    sub: '처리 대기 5건',
    icon: dotIcon,
    color: '#f87171',
    bg: '#fef2f2',
    path: '/admin/refunds',
  },
];

const RECENT_ORDERS = [
  { id: '#20240227-001', product: '위드백 프리미엄 세트', amount: '89,000원', status: 'PAID', date: '2026-02-27' },
  { id: '#20240227-002', product: '제주 한라봉 3kg', amount: '32,000원', status: 'SHIPPING', date: '2026-02-27' },
  { id: '#20240226-031', product: '유기농 쌀 10kg', amount: '48,500원', status: 'PAID', date: '2026-02-26' },
  { id: '#20240226-030', product: '냉동 삼겹살 2kg', amount: '27,000원', status: 'REFUND', date: '2026-02-26' },
  { id: '#20240226-029', product: '국내산 꿀 500g', amount: '18,900원', status: 'SHIPPING', date: '2026-02-26' },
];

const STATUS_MAP = {
  PAID: { label: '결제완료', cls: 'badgePaid' },
  SHIPPING: { label: '배송중', cls: 'badgeShipping' },
  REFUND: { label: '환불요청', cls: 'badgeRefund' },
};

const QUICK_STATS = [
  { label: '신규 회원', value: '23명', icon: userIcon },
  { label: '이번 달 매출', value: '₩48,200,000', icon: barchartIcon },
  { label: '평균 주문금액', value: '₩61,700', icon: cardIcon },
];

export default function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const username = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.sub || payload?.username || null;
    } catch {
      return null;
    }
  }, [token]);

  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${today.getFullYear()}년 ${pad(today.getMonth() + 1)}월 ${pad(today.getDate())}일`;
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayStr = weekdays[today.getDay()];

  return (
    <div className={styles.container}>
      {/* 상단 배너 */}
      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <p className={styles.bannerDate}>
            <img src={calendarIcon} alt='' className={styles.bannerDateIcon} />
            {dateStr} {dayStr}
          </p>
          <h1 className={styles.bannerTitle}>
            안녕하세요{username ? `, ${username}` : ''}님 👋
          </h1>
          <p className={styles.bannerSub}>오늘도 위드마켓 관리자 페이지에 오신 것을 환영합니다.</p>
        </div>
        <div className={styles.bannerDeco}>
          <div className={styles.decoCircle1} />
          <div className={styles.decoCircle2} />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((card) => (
          <button
            key={card.label}
            type='button'
            className={styles.statCard}
            onClick={() => navigate(card.path)}
          >
            <div className={styles.statIconWrap} style={{ background: card.bg }}>
              <img src={card.icon} alt='' className={styles.statIcon} style={{ filter: `none` }} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue} style={{ color: card.color }}>{card.value}</span>
              <span className={styles.statSub}>{card.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 2열 */}
      <div className={styles.bottomGrid}>
        {/* 최근 주문 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>최근 주문 내역</span>
            <button type='button' className={styles.moreBtn} onClick={() => navigate('/admin/payments')}>
              더보기
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>상품명</th>
                <th>금액</th>
                <th>상태</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order) => {
                const st = STATUS_MAP[order.status];
                return (
                  <tr key={order.id}>
                    <td className={styles.orderId}>{order.id}</td>
                    <td>{order.product}</td>
                    <td>{order.amount}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[st.cls]}`}>{st.label}</span>
                    </td>
                    <td className={styles.dateCell}>{order.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 빠른 현황 */}
        <div className={styles.sideColumn}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>오늘의 현황</span>
            </div>
            <div className={styles.quickList}>
              {QUICK_STATS.map((q) => (
                <div key={q.label} className={styles.quickItem}>
                  <div className={styles.quickIconWrap}>
                    <img src={q.icon} alt='' className={styles.quickIcon} />
                  </div>
                  <div className={styles.quickInfo}>
                    <span className={styles.quickLabel}>{q.label}</span>
                    <span className={styles.quickValue}>{q.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section} style={{ flex: 1 }}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>상품 상태 분포</span>
            </div>
            <div className={styles.donutWrap}>
              <div className={styles.donut} />
              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#8c9ee7' }} />
                  <span>판매중</span>
                  <strong>983</strong>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#f87171' }} />
                  <span>품절</span>
                  <strong>189</strong>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#d1d5db' }} />
                  <span>숨김</span>
                  <strong>76</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
