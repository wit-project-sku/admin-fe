import shared from '@commons/shared.module.css';
import type { ReportTab } from './reportTypes';

type ReportPageHeaderProps = {
  activeTab: ReportTab;
  onExcelDownload?: () => void;
  excelDisabled?: boolean;
};

export function ReportPageHeader({ activeTab, onExcelDownload, excelDisabled }: ReportPageHeaderProps) {
  const showExcelShortcut = activeTab === 'monthly' || activeTab === 'daily';

  return (
    <div className={shared.pageHeader}>
      <div>
        <h1 className={shared.pageTitle}>지점 성과 리포트</h1>
        <p className={shared.pageSubtitle}>Analytics Report</p>
      </div>
      {showExcelShortcut ? (
        <button
          type="button"
          className={shared.btnGreen}
          onClick={onExcelDownload}
          disabled={!onExcelDownload || Boolean(excelDisabled)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          EXCEL 다운로드
        </button>
      ) : null}
    </div>
  );
}
