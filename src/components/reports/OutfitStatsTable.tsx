import { useMemo } from 'react';
import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import s from '../../pages/ReportsPage.module.css';
import {
  getOutfitDisplayCode,
  getOutfitPreviewUrl,
  getOutfitTotalShots,
  type OutfitReportPanelStatus,
} from '../../utils/outfitReportUtils';

type TableSortMode = 'shots' | 'number';

type OutfitStatsTableProps = {
  panelStatus: OutfitReportPanelStatus;
  errorMessage?: string;
  rows: Record<string, unknown>[];
  sortMode: TableSortMode;
  onSortModeChange: (m: TableSortMode) => void;
  onExportExcel: () => void;
  exportEnabled: boolean;
  rangeLabel: string;
  kioskLabel: string;
  pageNum: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  rankOffset: number;
};

const SKELETON_ROWS = 6;

export default function OutfitStatsTable({
  panelStatus,
  errorMessage,
  rows,
  sortMode,
  onSortModeChange,
  onExportExcel,
  exportEnabled,
  rangeLabel,
  kioskLabel,
  pageNum,
  totalPages,
  totalElements,
  onPageChange,
  rankOffset,
}: OutfitStatsTableProps) {
  const sorted = useMemo(() => {
    const list = [...rows];
    if (sortMode === 'shots') {
      list.sort((a, b) => {
        const diff = getOutfitTotalShots(b) - getOutfitTotalShots(a);
        if (diff !== 0) return diff;
        return Number(a.id) - Number(b.id);
      });
    } else {
      list.sort((a, b) => Number(a.id) - Number(b.id));
    }
    return list;
  }, [rows, sortMode]);

  const showRankColumn = sortMode === 'shots';

  const subtitle =
    panelStatus === 'error'
      ? '의상 목록을 불러올 수 없습니다'
      : panelStatus === 'idle'
        ? '기간·지점을 선택한 뒤 조회해 주세요'
        : `${kioskLabel} (${rangeLabel})`;

  const showTableBody = panelStatus === 'data' || panelStatus === 'loading';

  return (
    <div className={shared.card} style={{ marginTop: 14 }}>
      <div className={s.outfitPanelHead}>
        <div>
          <h2 className={s.outfitPanelTitle}>👕 전체 의상 촬영 통계</h2>
          <p className={s.outfitPanelSubtitle}>{subtitle}</p>
        </div>
        <div className={s.outfitPanelActions}>
          <div className={s.segment} role="group" aria-label="정렬">
            <button
              type="button"
              className={`${s.segmentBtn} ${sortMode === 'shots' ? s.segmentBtnActive : ''}`}
              onClick={() => onSortModeChange('shots')}
            >
              촬영수순
            </button>
            <button
              type="button"
              className={`${s.segmentBtn} ${sortMode === 'number' ? s.segmentBtnActive : ''}`}
              onClick={() => onSortModeChange('number')}
            >
              번호순
            </button>
          </div>
          <button
            type="button"
            className={shared.btnGreen}
            onClick={onExportExcel}
            disabled={!exportEnabled}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            EXCEL
          </button>
        </div>
      </div>

      {panelStatus === 'idle' ? (
        <div className={s.panelStateWrap}>
          <p className={s.panelStateTitle}>조회 전</p>
          <p className={s.panelStateHint}>시작·종료일을 선택하고 조회를 누르면 통계 표가 표시됩니다.</p>
        </div>
      ) : null}

      {panelStatus === 'error' ? (
        <div className={s.panelStateWrap}>
          <p className={s.panelStateTitle}>오류</p>
          <p className={s.panelStateError}>{errorMessage ?? '의상 데이터를 불러오지 못했습니다.'}</p>
          <p className={s.panelStateHint}>잠시 후 다시 시도하거나 페이지를 새로고침해 주세요.</p>
        </div>
      ) : null}

      {panelStatus === 'empty' ? (
        <div className={s.panelStateWrap}>
          <p className={s.panelStateTitle}>데이터 없음</p>
          <p className={s.panelStateHint}>
            선택한 기간·지점 조건에 맞는 의상이 없습니다. 필터를 바꾼 뒤 다시 조회해 주세요.
          </p>
        </div>
      ) : null}

      {showTableBody ? (
        <div className={shared.tableResponsive}>
          <table className={shared.table} style={{ minWidth: 720 }}>
            <thead>
              <tr className={s.darkHead}>
                <th className={s.darkTh}>NO</th>
                {showRankColumn ? <th className={s.darkTh}>순위</th> : null}
                <th className={s.darkTh}>PREVIEW</th>
                <th className={s.darkTh}>NAME / CODE</th>
                <th className={s.darkTh}>CATEGORY</th>
                <th className={`${s.darkTh} ${s.darkThRight}`}>TOTAL SHOTS</th>
              </tr>
            </thead>
            <tbody>
              {panelStatus === 'loading'
                ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                    <tr key={i} className={`${shared.tr} ${shared.skeletonRow}`} style={{ background: i % 2 === 1 ? '#fafbff' : 'white' }}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={shared.skeletonLine} style={{ maxWidth: 36 }} />
                      </td>
                      {showRankColumn ? (
                        <td className={`${shared.td} ${shared.tdCenter}`}>
                          <span className={shared.skeletonLine} style={{ maxWidth: 28 }} />
                        </td>
                      ) : null}
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={shared.skeletonLine} style={{ maxWidth: 44, height: 44, borderRadius: 6 }} />
                      </td>
                      <td className={shared.td}>
                        <span className={shared.skeletonLine} />
                      </td>
                      <td className={shared.td}>
                        <span className={shared.skeletonLine} style={{ maxWidth: 80 }} />
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        <span className={shared.skeletonLine} style={{ maxWidth: 56, marginLeft: 'auto', display: 'block' }} />
                      </td>
                    </tr>
                  ))
                : sorted.map((o, i) => {
                    const id = o.id;
                    const no = `#${String(id).padStart(3, '0')}`;
                    const rank = rankOffset + i + 1;
                    const shots = getOutfitTotalShots(o);
                    const name = String(o.name ?? '-');
                    const code = getOutfitDisplayCode(o);
                    const cat = String(o.categoryName ?? '-');
                    const img = getOutfitPreviewUrl(o);
                    return (
                      <tr key={String(id)} className={shared.tr} style={{ background: i % 2 === 1 ? '#fafbff' : 'white' }}>
                        <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMono}`}>{no}</td>
                        {showRankColumn ? (
                          <td className={`${shared.td} ${shared.tdCenter}`}>
                            <span className={rank <= 3 ? s.rankPillGold : s.rankPillDark}>{rank}</span>
                          </td>
                        ) : null}
                        <td className={`${shared.td} ${shared.tdCenter}`}>
                          {img ? (
                            <img src={img} alt="" className={s.tableThumb} />
                          ) : (
                            <span className={shared.tdMuted}>—</span>
                          )}
                        </td>
                        <td className={shared.td}>
                          <div className={s.nameCodeCell}>
                            <span className={s.nameCodeName}>{name}</span>
                            <span className={s.nameCodeId}>{code}</span>
                          </div>
                        </td>
                        <td className={`${shared.td} ${shared.tdMuted}`}>{cat}</td>
                        <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>{shots.toLocaleString()}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      ) : null}

      {panelStatus === 'data' && totalElements > 0 ? (
        <div style={{ marginTop: 20 }}>
          <Pagination
            currentPage={pageNum}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalCount={totalElements}
          />
        </div>
      ) : null}
    </div>
  );
}
