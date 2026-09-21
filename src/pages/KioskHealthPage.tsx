import shared from '@commons/shared.module.css';

import { KioskHealthBoard } from '@/features/kiosk/health/KioskHealthBoard';

/** 키오스크 현황 — 온라인 여부·운영시간·점검 모드. */
export default function KioskHealthPage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>키오스크 현황</h1>
          <p className={shared.pageSubtitle}>키오스크별 온라인 여부를 보고, 운영시간과 점검 모드를 정합니다.</p>
        </div>
      </div>
      <KioskHealthBoard />
    </div>
  );
}
