// 통계 리포트 — 좌측 네비 별도 메뉴(클라이언트 확정: 상세 분석 리포트와 분리).
// 주간/월간 촬영·버튼 리포트를 보고, DOCX(편집용)/PDF로 다운로드하는 페이지.
// 다운로드는 클라이언트 생성(확인용) — 정식 발행(서버 템플릿+AI 분석)은 P3에서 대체.
import { useState } from 'react';
import shared from '@commons/shared.module.css';
import s from '../features/reports/statreports/StatReports.module.css';
import { exportReportDoc, exportReportPdf } from '../features/reports/statreports/reportExport';
import { StatReportsTabPanel } from '../features/reports/statreports/StatReportsTabPanel';

export default function StatReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleDoc = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const ok = await exportReportDoc();
      if (!ok) alert('리포트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    } catch {
      alert('DOCX 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdf = () => {
    if (!exportReportPdf()) alert('리포트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>통계 리포트</h1>
          <p className={shared.pageSubtitle}>Weekly · Monthly Report</p>
        </div>
        <div className={s.pageActions}>
          <button type='button' className={s.btnPrimary} onClick={handleDoc} disabled={isExporting}>
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7 10 12 15 17 10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
            {isExporting ? '생성 중…' : 'DOCX 다운로드 (편집용)'}
          </button>
          <button type='button' className={s.btnGhost} onClick={handlePdf}>
            PDF 다운로드
          </button>
        </div>
      </div>
      <StatReportsTabPanel />
    </div>
  );
}
