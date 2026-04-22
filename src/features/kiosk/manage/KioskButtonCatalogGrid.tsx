import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import { KioskAppIconVisual } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { formatDurationSeconds } from '../kioskFormatters';
import {
  formatKioskButtonStatusLabel,
  isKioskButtonStatusActive,
  resolveKioskButtonIconKey,
} from './kioskButtonDisplay';
import styles from './KioskAppManagePage.module.css';

type Props = {
  buttons: KioskButtonDto[];
  isLoading: boolean;
  deletingButtonId?: number | null;
  togglingButtonId?: number | null;
  showKioskColumn: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onCardAction: (action: 'edit' | 'toggle' | 'delete', button: KioskButtonDto) => void;
};

function formatTotalDurationSec(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  return formatDurationSeconds(sec);
}

export function KioskButtonCatalogGrid({
  buttons,
  isLoading,
  deletingButtonId,
  togglingButtonId,
  showKioskColumn,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onCardAction,
}: Props) {
  if (isLoading) {
    return (
      <section className={styles.catalogWithPager} aria-label='전체 버튼 목록'>
        <p className={styles.emptyState}>불러오는 중…</p>
      </section>
    );
  }

  if (!buttons.length) {
    return (
      <section className={styles.catalogWithPager} aria-label='전체 버튼 목록'>
        <p className={styles.emptyState}>등록된 버튼이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={styles.catalogWithPager} aria-label='전체 버튼 목록'>
      <div className={styles.grid}>
        {buttons.map((b) => {
          const active = isKioskButtonStatusActive(b.status);
          const resolvedIcon = resolveKioskButtonIconKey(b.iconKey);
          const deleting = deletingButtonId === b.id;
          const toggling = togglingButtonId === b.id;
          const busy = deleting || toggling;
          const kioskLine = showKioskColumn
            ? (b.kioskName ?? (b.kioskId != null ? `WITH #${b.kioskId}` : '—'))
            : null;
          return (
            <article key={`${b.kioskId ?? 'all'}-${b.id}-${b.position}`} className={styles.card}>
              <div className={styles.cardTop}>
                <KioskAppIconVisual iconKey={resolvedIcon} />
                <div className={styles.meta}>
                  <div className={styles.title}>{b.buttonType}</div>
                  <div className={styles.cat}>
                    {kioskLine ? `${kioskLine} · ` : ''}위치 {b.position} · {formatKioskButtonStatusLabel(b.status)}
                  </div>
                </div>
                <span className={`${shared.badge} ${active ? shared.badgeGreen : shared.badgeGray}`}>
                  {formatKioskButtonStatusLabel(b.status)}
                </span>
              </div>
              <div className={styles.statsRow}>
                <span className={styles.stat}>
                  총 클릭 <strong>{b.totalClicks.toLocaleString()}</strong>
                </span>
                <span className={styles.stat}>
                  사용 시간 <strong>{formatTotalDurationSec(b.totalDuration)}</strong>
                </span>
              </div>
              <div className={styles.actions}>
                <button type='button' className={shared.btnOutline} onClick={() => onCardAction('edit', b)} disabled={busy}>
                  수정
                </button>
                <button type='button' className={shared.btnOutline} onClick={() => onCardAction('toggle', b)} disabled={busy}>
                  {toggling ? '처리 중…' : active ? '비활성화' : '활성화'}
                </button>
                {/* <button type='button' className={shared.btnOutline} onClick={() => onCardAction('delete', b)} disabled={busy}>
                  {deleting ? '삭제 중…' : '삭제'}
                </button> */}
              </div>
            </article>
          );
        })}
      </div>

      {totalElements > 0 ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalElements}
          onPageChange={onPageChange}
          unit='건'
        />
      ) : null}
    </section>
  );
}
