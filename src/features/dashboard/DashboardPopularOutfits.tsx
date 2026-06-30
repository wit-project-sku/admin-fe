import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import shared from '@commons/shared.module.css';
import s from '@pages/DashboardPage.module.css';
import { useGetOutfitRankingStats } from '../../hooks/inventory-api/useGetOutfitRankingStats';
import {
  getOutfitDisplayCode,
  getOutfitPreviewUrl,
  getOutfitTotalShots,
  parseOutfitRankingStatsResponse,
} from '../../utils/outfitReportUtils';
import { DashboardPopularOutfitDetailModal } from './DashboardPopularOutfitDetailModal';

const RANKING_PARAMS = { sort: 'POPULAR' as const, pageNum: 1, pageSize: 10 };

export function DashboardPopularOutfits() {
  const { data, isLoading, error } = useGetOutfitRankingStats(RANKING_PARAMS);

  const rows = useMemo(() => parseOutfitRankingStatsResponse(data).rows, [data]);

  const [selected, setSelected] = useState<{ row: Record<string, unknown>; rank: number } | null>(null);

  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <div className={`${shared.card} ${s.popularSection}`}>
      <div className={s.popularHead}>
        <div>
          <h2 className={s.popularTitle}>실시간 인기 의상 TOP 10</h2>
          <p className={s.popularSubtitle}>누적 촬영 수 기준으로 가장 많이 선택된 의상입니다.</p>
        </div>
        <Link to="/admin/reports?tab=ranking" className={s.popularViewAll}>
          전체 랭킹 보기
        </Link>
      </div>

      {isLoading ? (
        <div className={s.popularGrid} aria-busy>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={s.popularCard}>
              <div className={`${s.popularImageWrap} ${s.popularSkeletonImg}`} />
              <div className={s.popularSkeletonLine} style={{ maxWidth: '88%' }} />
              <div className={s.popularCardFooter}>
                <span className={`${s.popularSkeletonLine} ${s.popularSkeletonShort}`} />
                <span className={`${s.popularSkeletonLine} ${s.popularSkeletonShort}`} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className={s.popularError}>인기 의상 데이터를 불러오지 못했습니다.</p>
      ) : rows.length === 0 ? (
        <p className={s.popularEmpty}>표시할 의상 랭킹이 없습니다.</p>
      ) : (
        <div className={s.popularGrid}>
          {rows.slice(0, 10).map((o, index) => {
            const rank = index + 1;
            const img = getOutfitPreviewUrl(o);
            const name = String(o.name ?? '-');
            const code = getOutfitDisplayCode(o);
            const shots = getOutfitTotalShots(o);
            return (
              <button
                key={String(o.id ?? index)}
                type="button"
                className={`${s.popularCard} ${s.popularCardBtn} ${s.popularCardInteractive}`}
                aria-label={`${name}, ${rank}위, 누적 촬영 ${shots.toLocaleString()}건, 상세 보기`}
                onClick={() => setSelected({ row: o, rank })}
              >
                <div className={s.popularImageWrap}>
                  <span
                    className={
                      rank <= 3
                        ? `${s.popularRankBadge} ${s.popularRankBadgeGold}`
                        : `${s.popularRankBadge} ${s.popularRankBadgeNavy}`
                    }
                  >
                    {rank}
                  </span>
                  {img ? (
                    <img src={img} alt="" className={s.popularImg} />
                  ) : (
                    <div className={s.popularImgPlaceholder} />
                  )}
                </div>
                <div className={s.popularCardTitle}>{name}</div>
                <div className={s.popularCardFooter}>
                  <span className={s.popularCode}>{code}</span>
                  <span className={s.popularCount}>{shots.toLocaleString()}건</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <DashboardPopularOutfitDetailModal
        open={selected != null}
        onClose={closeModal}
        rank={selected?.rank ?? 1}
        row={selected?.row ?? null}
      />
    </div>
  );
}
