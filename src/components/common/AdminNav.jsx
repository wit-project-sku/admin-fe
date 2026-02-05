import React, { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './AdminNav.module.css';
import productIcon from '@assets/images/adminProductIcon.png';
import paymentIcon from '@assets/images/adminPaymentIcon.png';
import deliveryIcon from '@assets/images/adminDeliveryIcon.png';

export default function AdminNav() {
  const handlePreparing = useCallback((e) => {
    e.preventDefault();
    alert('준비중입니다');
  }, []);

  const menu = [
    { label: '상품 관리', path: '/admin/products', icon: productIcon },
    { label: '결제 관리', path: '/admin/payments', icon: paymentIcon },
    { label: '배송 관리', path: '/admin/deliveries', icon: deliveryIcon },
    { label: '환불 관리', path: '/admin/refunds', icon: deliveryIcon },
    { label: '카테고리 관리', path: '/admin/categories', icon: deliveryIcon, preparing: true },
    { label: '키오스크 관리', path: '/admin/kiosks', icon: deliveryIcon, preparing: true },
    { label: '통계 관리', path: '/admin/chart', icon: deliveryIcon, preparing: true },
  ];

  return (
    <nav className={styles.nav}>
      {menu.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={item.preparing ? handlePreparing : undefined}
          className={({ isActive }) => (isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem)}
        >
          <img src={item.icon} alt='' />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
