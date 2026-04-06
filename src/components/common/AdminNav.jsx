import React, { useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import styles from './AdminNav.module.css';
import logo from '@assets/images/logo.png';
import homeIcon from '@assets/images/home.png';
import userIcon from '@assets/images/user.png';
import withIcon from '@assets/images/with.png';
import diamondIcon from '@assets/images/diamond.png';
import fileIcon from '@assets/images/file.png';
import giftIcon from '@assets/images/gift.png';
import cardIcon from '@assets/images/card.png';
import messageIcon from '@assets/images/message.png';
import barchartIcon from '@assets/images/barchart.png';
import dotIcon from '@assets/images/dot.png';

const WITH_MARKET_PATHS = ['/admin/products', '/admin/payments', '/admin/deliveries', '/admin/refunds'];

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSubMenuVisible = WITH_MARKET_PATHS.some((path) => location.pathname.startsWith(path));

  const handlePreparing = useCallback((e) => {
    e.preventDefault();
    alert('준비중입니다');
  }, []);

  const handleWithMarketClick = useCallback(
    (e) => {
      e.preventDefault();
      if (!isSubMenuVisible) {
        navigate('/admin/products');
      }
    },
    [isSubMenuVisible, navigate],
  );

  return (
    <nav className={styles.nav}>
      {/* 로고 */}
      <div className={styles.logoSection}>
        <img src={logo} alt='WIT' className={styles.logo} />
        <span className={styles.logoText}>
          WIT <span style={{ color: '#8C9EE7' }}>GLOBAL</span>
        </span>
      </div>

      <ul className={styles.menuList}>
        <li>
          <NavLink
            to='/admin/home'
            className={({ isActive }) => (isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem)}
          >
            <span className={styles.iconWrap}>
              <img src={homeIcon} alt='' />
            </span>
            <span>홈</span>
          </NavLink>
        </li>
        <li>
          <a href='#' className={styles.menuItem} onClick={handlePreparing}>
            <span className={styles.iconWrap}>
              <img src={userIcon} alt='' />
            </span>
            <span>회원관리</span>
          </a>
        </li>
        <li>
          <a href='#' className={styles.menuItem} onClick={handlePreparing}>
            <span className={styles.iconWrap}>
              <img src={withIcon} alt='' />
            </span>
            <span>WITH관리</span>
          </a>
        </li>
        <li>
          <a href='#' className={styles.menuItem} onClick={handlePreparing}>
            <span className={styles.iconWrap}>
              <img src={diamondIcon} alt='' />
            </span>
            <span>미션관리</span>
          </a>
        </li>

        {/* 위드마켓 섹션 */}
        <li>
          <a
            href='#'
            className={`${styles.menuItem} ${isSubMenuVisible ? styles.parentOpen : ''}`}
            onClick={handleWithMarketClick}
          >
            <span className={styles.iconWrap}>
              <img src={giftIcon} alt='' />
            </span>
            <span>위드마켓</span>
          </a>

          {isSubMenuVisible && (
            <ul className={styles.subMenuList}>
              <li>
                <NavLink
                  to='/admin/products'
                  className={({ isActive }) => (isActive ? `${styles.subItem} ${styles.subActive}` : styles.subItem)}
                >
                  <span className={styles.iconWrap}>
                    <img src={fileIcon} alt='' />
                  </span>
                  <span>1)상품관리</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/admin/payments'
                  className={({ isActive }) => (isActive ? `${styles.subItem} ${styles.subActive}` : styles.subItem)}
                >
                  <span className={styles.iconWrap}>
                    <img src={cardIcon} alt='' />
                  </span>
                  <span>2)결제관리</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/admin/deliveries'
                  className={({ isActive }) => (isActive ? `${styles.subItem} ${styles.subActive}` : styles.subItem)}
                >
                  <span className={styles.iconWrap}>
                    <img src={messageIcon} alt='' />
                  </span>
                  <span>3)배송관리</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/admin/refunds'
                  className={({ isActive }) => (isActive ? `${styles.subItem} ${styles.subActive}` : styles.subItem)}
                >
                  <span className={styles.iconWrap}>
                    <img src={dotIcon} alt='' />
                  </span>
                  <span>4)환불관리</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        <li>
          <a href='#' className={styles.menuItem} onClick={handlePreparing}>
            <span className={styles.iconWrap}>
              <img src={barchartIcon} alt='' />
            </span>
            <span>통계관리</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
