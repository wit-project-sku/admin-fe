import shared from '@commons/shared.module.css';

import { KioskBannerPanel } from '@/features/kiosk/banner/KioskBannerPanel';

export default function KioskBannerManagePage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>키오스크별 배너 노출</h1>
          <p className={shared.pageSubtitle}>
            키오스크마다 지금 노출 중인 배너를 확인하고 순서를 조정합니다.
          </p>
        </div>
      </div>
      <div className={shared.card}>
        <KioskBannerPanel />
      </div>
    </div>
  );
}
