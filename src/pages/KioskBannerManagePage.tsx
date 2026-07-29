import shared from '@commons/shared.module.css';

import { KioskBannerPanel } from '@/features/kiosk/banner/KioskBannerPanel';

export default function KioskBannerManagePage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>배너 등록 관리</h1>
          <p className={shared.pageSubtitle}>키오스크 하단에 노출되는 프로모션 배너를 키오스크별로 등록·삭제합니다.</p>
        </div>
      </div>

      <div className={shared.card}>
        <KioskBannerPanel />
      </div>
    </div>
  );
}
