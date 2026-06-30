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

type SortMode = 'popular' | 'number';

type OutfitRankingCardsProps = {
  panelStatus: OutfitReportPanelStatus;
  errorMessage?: string;
  rows: Record<string, unknown>[];
  sortMode: SortMode;
  onSortModeChange: (m: SortMode) => void;
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

const SKELETON_COUNT = 6;

export default function OutfitRankingCards({
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
}: OutfitRankingCardsProps) {
  const sorted = useMemo(() => {
    const list = [...rows];
    if (sortMode === 'popular') {
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

  const subtitle =
    panelStatus === 'error'
      ? '의상 목록을 불러올 수 없습니다'
      : panelStatus === 'idle'
        ? '기간·지점을 선택한 뒤 조회해 주세요'
        : `${kioskLabel} (${rangeLabel}) 가장 인기 있는 의상 순위`;

  return (
    <div className={shared.card} style={{ marginTop: 14 }}>
      <div className={s.outfitPanelHead}>
        <div>
          <h2 className={s.outfitPanelTitle}>🏆 의상별 누적 촬영 랭킹</h2>
          <p className={s.outfitPanelSubtitle}>{subtitle}</p>
        </div>
        <div className={s.outfitPanelActions}>
          <div className={s.segment} role="group" aria-label="정렬">
            <button
              type="button"
              className={`${s.segmentBtn} ${sortMode === 'popular' ? s.segmentBtnActive : ''}`}
              onClick={() => onSortModeChange('popular')}
            >
              인기순
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
            랭킹 EXCEL
          </button>
        </div>
      </div>

      {panelStatus === 'idle' ? (
        <div className={s.panelStateWrap}>
          <p className={s.panelStateTitle}>조회 전</p>
          <p className={s.panelStateHint}>시작·종료일을 선택하고 조회를 누르면 랭킹이 표시됩니다.</p>
        </div>
      ) : null}

      {panelStatus === 'loading' ? (
        <div className={s.rankingSkeletonGrid} aria-hidden>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className={s.rankingSkeletonCard}>
              <div className={s.rankingSkeletonImg} />
              <div className={s.rankingSkeletonLines}>
                <div className={s.rankingSkeletonLine} style={{ maxWidth: '32%' }} />
                <div className={s.rankingSkeletonLine} />
                <div className={`${s.rankingSkeletonLine} ${s.rankingSkeletonLineShort}`} />
              </div>
              <div className={s.rankingSkeletonFooter} />
            </div>
          ))}
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

      {panelStatus === 'data' ? (
        <div className={s.rankingGrid}>
          {sorted.map((o, index) => {
            const rank = rankOffset + index + 1;
            const shots = getOutfitTotalShots(o);
            const name = String(o.name ?? '-');
            const code = getOutfitDisplayCode(o);
            const img = getOutfitPreviewUrl(o);
            return (
              <div key={String(o.id ?? index)} className={s.rankingCard}>
                <div className={s.rankingCardImageWrap}>
                  <span className={rank <= 3 ? s.rankBadgeGold : s.rankBadgeDark}>{rank}</span>
                  {img ? (
                    <img src={img} alt="" className={s.rankingCardImg} />
                  ) : (
                    <div className={s.rankingCardPlaceholder} />
                  )}
                </div>
                <div className={s.rankingCardMeta}>
                  <span className={s.rankingCardCode}>{code}</span>
                  <div className={s.rankingCardName}>{name}</div>
                </div>
                <div className={s.rankingCardFooter}>
                  <span className={s.rankingCardFooterLabel}>TOTAL SHOTS</span>
                  <span className={s.rankingCardFooterVal}>{shots.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
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
