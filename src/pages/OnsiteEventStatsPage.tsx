// 행사 촬영 통계 — 드롭다운으로 행사를 골라 리포트 한 장을 보고, 같은 모습 그대로 PDF 로 내려받는다.
// 종이(OnsiteEventReportPaper)만 PDF 에 들어가고, 제목·버튼·드롭다운은 종이 밖이라 빠진다.
import { useState } from 'react';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import rs from '../features/reports/statreports/StatReports.module.css';
import { exportReportPdf } from '../features/reports/statreports/reportExport';
import { OnsiteEventReportPaper } from '../features/onsite-events/OnsiteEventReportPaper';
import { ONSITE_EVENT_MESSAGES } from '../features/onsite-events/onsiteEventConfig';
import { buildReportFileName } from '../features/onsite-events/onsiteEventFormat';
import { useOnsiteEventStatsPage } from '../features/onsite-events/useOnsiteEventStatsPage';
import s from '../features/onsite-events/OnsiteEvents.module.css';

export default function OnsiteEventStatsPage() {
  const page = useOnsiteEventStatsPage();
  const [isExporting, setIsExporting] = useState(false);

  const { stats } = page;
  const canExport = !!stats && !page.notStarted && !page.statsPending && !isExporting;

  const handlePdf = async () => {
    if (!stats || !canExport) return;
    setIsExporting(true);
    try {
      const ok = await exportReportPdf({
        fileName: buildReportFileName(stats.event.name, stats.event.startDate, stats.event.endDate),
        pageNumbers: true,
      });
      if (!ok) alert('리포트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    } catch {
      alert('PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  let sheetBody;
  if (page.optionsPending) {
    sheetBody = <div className={s.sheetMessage}>불러오는 중...</div>;
  } else if (page.optionsError) {
    sheetBody = <div className={`${s.sheetMessage} ${s.sheetMessageError}`}>{ONSITE_EVENT_MESSAGES.statsLoadError}</div>;
  } else if (!page.hasEvents) {
    sheetBody = <div className={s.sheetMessage}>{ONSITE_EVENT_MESSAGES.noEvents}</div>;
  } else if (page.notStarted) {
    sheetBody = <div className={s.sheetMessage}>{ONSITE_EVENT_MESSAGES.notStarted}</div>;
  } else if (page.statsPending) {
    sheetBody = <div className={s.sheetMessage}>불러오는 중...</div>;
  } else if (page.statsError || !stats) {
    sheetBody = <div className={`${s.sheetMessage} ${s.sheetMessageError}`}>{ONSITE_EVENT_MESSAGES.statsLoadError}</div>;
  } else {
    sheetBody = <OnsiteEventReportPaper stats={stats} />;
  }

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>행사 촬영 통계</h1>
          <p className={shared.pageSubtitle}>Event Photo Report</p>
        </div>
        <button type='button' className={s.btnDark} onClick={handlePdf} disabled={!canExport}>
          <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
            <polyline points='7 10 12 15 17 10' />
            <line x1='12' y1='15' x2='12' y2='3' />
          </svg>
          {isExporting ? '생성 중…' : 'PDF 다운로드'}
        </button>
      </div>

      {page.hasEvents ? (
        <div className={s.filterCard}>
          <div className={s.filterField}>
            <span className={s.filterLabel}>행사</span>
            <SearchableSelect
              aria-label='행사 선택'
              placeholder='행사를 고르세요'
              emptyLabel='일치하는 행사가 없습니다.'
              options={page.selectOptions}
              value={page.selected ? String(page.selected.id) : ''}
              onChange={page.selectEvent}
              minWidth='100%'
              stackedSublabel
            />
          </div>
        </div>
      ) : null}

      <div className={s.sheet}>{sheetBody}</div>

      {/* 생성 중에는 화면 전체를 덮어 클릭·스크롤을 막는다 — 캡처 도중 DOM 이 바뀌면 결과물이 깨진다(통계 리포트와 같은 오버레이). */}
      {isExporting ? (
        <div className={rs.exportBlocker} role='alert' aria-busy='true'>
          <div className={rs.exportBox}>
            <span className={rs.exportSpinner} aria-hidden='true' />
            <b>PDF 생성 중…</b>
            <span className={rs.exportHint}>페이지 수에 따라 수십 초가 걸릴 수 있습니다. 창을 닫지 마세요.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
