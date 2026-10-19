import shared from '@commons/shared.module.css';

import { KioskHealthBoard } from '@/features/kiosk/health/KioskHealthBoard';
import { KioskUpdateButton } from '@/features/kiosk/manage/KioskUpdateButton';

/** 키오스크 실행 모니터링 — 앱이 켜져 있는지·운영시간·점검 모드 + 앱 즉시 업데이트. */
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
        <div className={shared.actionGroup}>
          {/* 키오스크 데스크톱 앱 즉시 업데이트(주간 점검 창과 별개의 수동 트리거).
              2026-10-19 '아이콘 등록 관리' 화면에서 옮겨 옴 — 그 메뉴를 숨기면서 버튼까지 가려졌다. */}
          <KioskUpdateButton />
        </div>
      </div>
      <KioskHealthBoard />
    </div>
  );
}
