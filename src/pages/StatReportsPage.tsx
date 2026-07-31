// 통계 리포트 — 좌측 네비 별도 메뉴(클라이언트 확정: 상세 분석 리포트와 분리).
// 주간/월간 촬영·버튼 리포트를 보고, DOCX(편집용)/PDF로 다운로드하는 페이지.
// 다운로드는 클라이언트 생성(확인용) — 정식 발행(서버 템플릿+AI 분석)은 P3에서 대체.
import { useState } from 'react';
import shared from '@commons/shared.module.css';
import s from '../features/reports/statreports/StatReports.module.css';
import { exportReportDoc, exportReportPdf } from '../features/reports/statreports/reportExport';
import { StatReportsTabPanel } from '../features/reports/statreports/StatReportsTabPanel';

/**
 * DOCX 내보내기 노출 여부. 현재 DOM→docx 변환 결과가 화면과 차이가 커서 숨긴다(클라이언트 요청).
 * 정식 발행(서버 템플릿)이 준비되면 다시 켜거나 이 경로를 대체한다. 코드는 그대로 둔다.
 */
const SHOW_DOCX_EXPORT = false;

/** 렌더가 화면에 반영될 때까지 기다린다 — 전체 리포트로 바꾼 직후 캡처하면 이전 DOM 이 찍힌다. */
function afterRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(resolve, 250)));
  });
}

export default function StatReportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  // 화면에서 지점·계열을 걸러 보고 있어도 문서는 항상 전체 리포트여야 한다(클라이언트 확정).
  // 내보내기 동안만 전체로 렌더하고 끝나면 원래 보던 상태로 돌아간다.
  const [exportMode, setExportMode] = useState(false);

  const handleDoc = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportMode(true);
    try {
      await afterRender();
      const ok = await exportReportDoc();
      if (!ok) alert('리포트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    } catch {
      alert('DOCX 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setExportMode(false);
      setIsExporting(false);
    }
  };

  const handlePdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportMode(true);
    try {
      await afterRender();
      const ok = await exportReportPdf();
      if (!ok) alert('리포트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    } catch {
      alert('PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setExportMode(false);
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>통계 리포트</h1>
          <p className={shared.pageSubtitle}>Weekly · Monthly Report</p>
        </div>
        <div className={s.pageActions}>
          {SHOW_DOCX_EXPORT ? (
            <button type='button' className={s.btnPrimary} onClick={handleDoc} disabled={isExporting}>
              <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                <polyline points='7 10 12 15 17 10' />
                <line x1='12' y1='15' x2='12' y2='3' />
              </svg>
              {isExporting ? '생성 중…' : 'DOCX 다운로드 (편집용)'}
            </button>
          ) : null}
          <button type='button' className={s.btnPrimary} onClick={handlePdf} disabled={isExporting}>
            {isExporting ? '생성 중…' : 'PDF 다운로드'}
          </button>
        </div>
      </div>
      <StatReportsTabPanel exportMode={exportMode} />

      {/* 생성 중에는 화면 전체를 덮어 클릭·스크롤을 막는다 — 캡처 도중 DOM 이 바뀌면 결과물이 깨진다. */}
      {isExporting ? (
        <div className={s.exportBlocker} role='alert' aria-busy='true'>
          <div className={s.exportBox}>
            <span className={s.exportSpinner} aria-hidden='true' />
            <b>PDF 생성 중…</b>
            <span className={s.exportHint}>페이지 수에 따라 수십 초가 걸릴 수 있습니다. 창을 닫지 마세요.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
