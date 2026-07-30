import shared from '@commons/shared.module.css';

import { BannerListPanel } from '@/features/kiosk/banner/BannerListPanel';

export default function BannerManagePage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>배너 등록 관리</h1>
          <p className={shared.pageSubtitle}>
            배너를 등록하고 어느 키오스크에 노출할지 지정합니다. 노출 순서는 키오스크별 노출 화면에서 바꿉니다.
          </p>
        </div>
      </div>
      <div className={shared.card}>
        <BannerListPanel />
      </div>
    </div>
  );
}
