// 통계 리포트 — 좌측 네비 별도 메뉴(클라이언트 확정: 상세 분석 리포트와 분리).
// 주간/월간 촬영·버튼 리포트를 보고, DOCX(편집용)/PDF로 다운로드하는 페이지.
// 다운로드는 자동 발행(P3) 서버 연동 후 실제 파일이 내려온다.
import shared from '@commons/shared.module.css';
import s from '../features/reports/statreports/StatReports.module.css';
import { StatReportsTabPanel } from '../features/reports/statreports/StatReportsTabPanel';

const DOWNLOAD_NOTICE = 'DOCX/PDF 다운로드는 리포트 자동 발행(P3) 서버 연동 후 제공됩니다.';

export default function StatReportsPage() {
  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>통계 리포트</h1>
          <p className={shared.pageSubtitle}>Weekly · Monthly Report</p>
        </div>
        <div className={s.pageActions}>
          <button type='button' className={s.btnPrimary} onClick={() => alert(DOWNLOAD_NOTICE)}>
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7 10 12 15 17 10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
            DOCX 다운로드 (편집용)
          </button>
          <button type='button' className={s.btnGhost} onClick={() => alert(DOWNLOAD_NOTICE)}>
            PDF 다운로드
          </button>
        </div>
      </div>
      <StatReportsTabPanel />
    </div>
  );
}
