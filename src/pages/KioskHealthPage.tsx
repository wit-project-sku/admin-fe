import shared from '@commons/shared.module.css';

import { KioskHealthBoard } from '@/features/kiosk/health/KioskHealthBoard';

/** 키오스크 실행 모니터링 — 앱이 켜져 있는지·운영시간·점검 모드. */
export default function KioskHealthPage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>키오스크 실행 모니터링</h1>
          <p className={shared.pageSubtitle}>
            키오스크 앱이 켜져 있는지 확인하고, 운영시간과 점검 모드를 정합니다. 꺼지면 텔레그램으로 알립니다.
          </p>
        </div>
      </div>
      <KioskHealthBoard />
    </div>
  );
}
