// 통계 리포트 — 좌측 네비 별도 메뉴(클라이언트 확정: 상세 분석 리포트와 분리).
// 주간/월간 촬영·버튼 리포트를 보고, (P3 연동 후) DOCX/PDF로 다운로드하는 페이지.
import shared from '@commons/shared.module.css';
import { StatReportsTabPanel } from '../features/reports/statreports/StatReportsTabPanel';

export default function StatReportsPage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>통계 리포트</h1>
          <p className={shared.pageSubtitle}>Weekly · Monthly Report</p>
        </div>
      </div>
      <StatReportsTabPanel />
    </div>
  );
}
