import { useState } from 'react';
import shared from '@commons/shared.module.css';

import { BannerListPanel } from '@/features/kiosk/banner/BannerListPanel';
import { KioskBannerPanel } from '@/features/kiosk/banner/KioskBannerPanel';
import s from '@/features/kiosk/banner/BannerManage.module.css';

type Tab = 'banners' | 'kiosks';

const TABS: { id: Tab; label: string }[] = [
  { id: 'banners', label: '배너 목록' },
  { id: 'kiosks', label: '키오스크별 노출' },
];

/**
 * 배너 관리 — 같은 데이터를 두 관점으로 본다.
 *  · 배너 목록      : 소재를 만들고 어디에 띄울지 정한다(등록·대상·기간·이미지·삭제)
 *  · 키오스크별 노출 : 이 키오스크에 뭐가 뜨는지 보고 순서를 바꾼다
 * 메뉴를 나누면 "어디서 뭘 하지?"를 매번 판단해야 해서 한 페이지 탭으로 묶었다.
 */
export default function BannerManagePage() {
  const [tab, setTab] = useState<Tab>('banners');

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>배너 관리</h1>
          <p className={shared.pageSubtitle}>
            {tab === 'banners'
              ? '배너를 등록하고 어느 키오스크에 노출할지 지정합니다.'
              : '키오스크마다 지금 노출 중인 배너를 확인하고 순서를 조정합니다.'}
          </p>
        </div>
      </div>

      <div className={s.tabGroup}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`${s.tabBtn} ${tab === id ? s.tabBtnActive : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={shared.card}>
        {tab === 'banners' ? <BannerListPanel /> : <KioskBannerPanel />}
      </div>
    </div>
  );
}
