import { useEffect, useMemo } from 'react';
import { useGetKiosks } from '../../hooks/useGetKiosks';
import { useGetOutfitById } from '../../hooks/inventory-api/useGetOutfitById';
import { extractKioskIdsFromDetail, unwrapDetailBody } from '../../utils/modalFormMapping';
import { pickOperationEndFromDetail, pickOperationStartFromDetail } from '../../utils/outfitScheduleUtils';
import { buildKioskNameById } from '../../utils/kioskHelpers';
import {
  getOutfitDisplayCode,
  getOutfitPreviewUrl,
  getOutfitRankingKioskBreakdown,
  getOutfitTotalShots,
  type OutfitRankingKioskBreakdownEntry,
} from '../../utils/outfitReportUtils';
import { unwrapList } from '../../utils/unwrapApi';
import s from '@pages/DashboardPage.module.css';

type DashboardPopularOutfitDetailModalProps = {
  open: boolean;
  onClose: () => void;
  rank: number;
  row: Record<string, unknown> | null;
};

function formatScheduleDate(raw: string): string {
  const t = raw.trim();
  if (!t) return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10).replace(/-/g, '.');
  if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}.${t.slice(4, 6)}.${t.slice(6, 8)}`;
  return t;
}

function statusLabel(status: string): string {
  const u = status.toUpperCase();
  if (u === 'ACTIVE') return '활성';
  if (u === 'INACTIVE') return '비활성';
  return status || '-';
}

export function DashboardPopularOutfitDetailModal({ open, onClose, rank, row }: DashboardPopularOutfitDetailModalProps) {
  const outfitId = row?.id != null ? row.id : null;

  const { data: kiosksRaw } = useGetKiosks({ enabled: open });
  const kiosks = unwrapList(kiosksRaw) as { id: string | number; name: string }[];
  const kioskNameById = useMemo(() => buildKioskNameById(kiosks), [kiosks]);

  const { data: detailRaw, isLoading: detailLoading } = useGetOutfitById(open ? outfitId : null);
  const detail = useMemo(() => (open && detailRaw ? unwrapDetailBody(detailRaw) : null), [open, detailRaw]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const breakdown = useMemo(() => {
    if (!row) return [] as OutfitRankingKioskBreakdownEntry[];
    return [...getOutfitRankingKioskBreakdown(row)].sort((a, b) => b.count - a.count);
  }, [row]);

  const breakdownWithNames = useMemo(() => {
    return breakdown.map((e) => {
      const resolved =
        e.kioskId !== undefined ? kioskNameById[String(e.kioskId)] : undefined;
      const displayName = resolved && resolved !== e.kioskName ? resolved : e.kioskName;
      return { ...e, displayName };
    });
  }, [breakdown, kioskNameById]);

  const assignedKioskIds = useMemo(() => {
    if (detail) return extractKioskIdsFromDetail(detail);
    const fromRow = row?.kioskIds;
    if (Array.isArray(fromRow)) {
      return fromRow.filter((x): x is string | number => typeof x === 'number' || typeof x === 'string');
    }
    return [];
  }, [detail, row]);

  const maxBreakdownCount = useMemo(
    () => breakdownWithNames.reduce((m, e) => Math.max(m, e.count), 0) || 1,
    [breakdownWithNames],
  );

  if (!open || !row) return null;

  const img = getOutfitPreviewUrl(row);
  const name = String(row.name ?? '-');
  const code = getOutfitDisplayCode(row);
  const category = String(row.categoryName ?? '-');
  const totalShots = getOutfitTotalShots(row);
  const description = typeof row.description === 'string' ? row.description : '';

  const opStart = detail ? formatScheduleDate(pickOperationStartFromDetail(detail)) : '-';
  const opEnd = detail ? formatScheduleDate(pickOperationEndFromDetail(detail)) : '-';
  const detailStatus = detail && typeof detail.status === 'string' ? statusLabel(detail.status) : null;
  const detailCode =
    detail && typeof (detail.outfitCode ?? detail.code) === 'string'
      ? String(detail.outfitCode ?? detail.code)
      : null;

  return (
    <div className={s.popularDetailOverlay} onClick={onClose} role="presentation">
      <div
        className={s.popularDetailModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popular-detail-title"
      >
        <div className={s.popularDetailHeader}>
          <h2 id="popular-detail-title" className={s.popularDetailHeaderTitle}>
            의상 상세 · 촬영 현황
          </h2>
          <button type="button" className={s.popularDetailClose} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className={s.popularDetailBody}>
          <div className={s.popularDetailHero}>
            <div className={s.popularDetailImageCol}>
              <div className={s.popularDetailImageWrap}>
                <span
                  className={
                    rank <= 3
                      ? `${s.popularRankBadge} ${s.popularRankBadgeGold} ${s.popularDetailRankBadge}`
                      : `${s.popularRankBadge} ${s.popularRankBadgeNavy} ${s.popularDetailRankBadge}`
                  }
                >
                  {rank}
                </span>
                {img ? (
                  <img src={img} alt="" className={s.popularDetailImg} />
                ) : (
                  <div className={s.popularDetailImgPlaceholder} />
                )}
              </div>
            </div>
            <div className={s.popularDetailHeroMeta}>
              <p className={s.popularDetailName}>{name}</p>
              <div className={s.popularDetailPills}>
                <span className={s.popularDetailPill}>{code}</span>
                <span className={s.popularDetailPillMuted}>{category}</span>
              </div>
              {description ? <p className={s.popularDetailDesc}>{description}</p> : null}
            </div>
          </div>

          <div className={s.popularDetailStatCard}>
            <span className={s.popularDetailStatLabel}>누적 촬영</span>
            <span className={s.popularDetailStatValue}>{totalShots.toLocaleString()}건</span>
          </div>

          {breakdownWithNames.length > 0 ? (
            <section className={s.popularDetailSection}>
              <h3 className={s.popularDetailSectionTitle}>지점별 촬영</h3>
              <p className={s.popularDetailSectionHint}>키오스크(지점)별 누적 촬영 횟수입니다.</p>
              <ul className={s.popularDetailBarList}>
                {breakdownWithNames.map((e, i) => (
                  <li key={`${e.kioskId ?? e.displayName}-${i}`} className={s.popularDetailBarRow}>
                    <div className={s.popularDetailBarTop}>
                      <span className={s.popularDetailBarName}>{e.displayName}</span>
                      <span className={s.popularDetailBarCount}>{e.count.toLocaleString()}건</span>
                    </div>
                    <div className={s.popularDetailBarTrack}>
                      <div
                        className={s.popularDetailBarFill}
                        style={{ width: `${Math.round((e.count / maxBreakdownCount) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className={s.popularDetailSection}>
              <h3 className={s.popularDetailSectionTitle}>운영 지점</h3>
              <p className={s.popularDetailSectionHint}>
                랭킹 API에 지점별 집계(`byKiosk` 등)가 포함되면 위에 막대 그래프로 표시됩니다.
              </p>
              {assignedKioskIds.length > 0 ? (
                <div className={s.popularDetailChipRow}>
                  {assignedKioskIds.map((id) => (
                    <span key={String(id)} className={s.popularDetailChip}>
                      {kioskNameById[String(id)] ?? `지점 #${id}`}
                    </span>
                  ))}
                </div>
              ) : detailLoading ? (
                <p className={s.popularDetailMuted}>지점 정보를 불러오는 중…</p>
              ) : (
                <p className={s.popularDetailMuted}>등록된 운영 지점 정보가 없습니다.</p>
              )}
            </section>
          )}

          <section className={s.popularDetailSection}>
            <h3 className={s.popularDetailSectionTitle}>의상 정보</h3>
            {detailLoading ? (
              <div className={s.popularDetailInfoSkeleton}>
                <div className={s.popularDetailSkeletonLine} />
                <div className={s.popularDetailSkeletonLine} />
                <div className={s.popularDetailSkeletonLineShort} />
              </div>
            ) : detail && Object.keys(detail).length > 0 ? (
              <dl className={s.popularDetailDl}>
                {detailCode ? (
                  <>
                    <dt>의상 코드</dt>
                    <dd>{detailCode}</dd>
                  </>
                ) : null}
                {detailStatus ? (
                  <>
                    <dt>상태</dt>
                    <dd>{detailStatus}</dd>
                  </>
                ) : null}
                <dt>운영 기간</dt>
                <dd>
                  {opStart} ~ {opEnd}
                </dd>
              </dl>
            ) : (
              <p className={s.popularDetailMuted}>상세 API 응답이 없습니다. 카드에 표시된 요약만 확인할 수 있습니다.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
