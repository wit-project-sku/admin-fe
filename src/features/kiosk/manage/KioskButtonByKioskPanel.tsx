import { Pencil } from 'lucide-react';
import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import SearchableSelect from '@components/common/SearchableSelect';
import { KioskAppIconVisual } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { KioskButtonLayoutPreview } from './KioskButtonLayoutPreview';
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
  kioskName: string;
  byKioskId: string;
  onByKioskId: (id: string) => void;
  kioskOptions: Array<{ value: string; label: string; sublabel?: string }>;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onEditButton?: (button: KioskButtonDto) => void;
};

function formatTotalDurationSec(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  return formatDurationSeconds(sec);
}

export function KioskButtonByKioskPanel({
  buttons,
  isLoading,
  kioskName,
  byKioskId,
  onByKioskId,
  kioskOptions,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onEditButton,
}: Props) {
  return (
    <div className={styles.byKioskPanel}>
      <div className={styles.byKioskSelectRow}>
        <div className={`${styles.field} ${styles.fieldCompact}`}>
          <span className={styles.fieldLabel}>WITH</span>
          <div className={styles.byKioskSelectWrap}>
            <SearchableSelect
              aria-label='WITH 선택'
              options={kioskOptions}
              value={byKioskId}
              onChange={onByKioskId}
              minWidth='100%'
            />
          </div>
        </div>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <span className={shared.cardTitle}>{kioskName} · 버튼</span>
        </div>
        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>위치</th>
                <th className={`${shared.th} ${shared.thCenter}`}>아이콘</th>
                <th className={shared.th}>버튼 타입</th>
                <th className={shared.th}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>총 클릭</th>
                <th className={`${shared.th} ${shared.thRight}`}>사용 시간</th>
                {onEditButton ? (
                  <th className={`${shared.th} ${shared.thCenter}`}>관리</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={onEditButton ? 7 : 6} className={shared.tableStateCell}>
                    불러오는 중…
                  </td>
                </tr>
              ) : buttons.length === 0 ? (
                <tr>
                  <td colSpan={onEditButton ? 7 : 6} className={shared.tableStateCell}>
                    이 WITH에 등록된 버튼이 없습니다.
                  </td>
                </tr>
              ) : (
                buttons.map((b) => {
                  const resolvedIcon = resolveKioskButtonIconKey(b.iconKey);
                  const statusActive = isKioskButtonStatusActive(b.status);
                  return (
                  <tr key={`${b.id}-${b.position}`} className={shared.tr}>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={styles.posBadge}>{b.position}</span>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter}`}>
                      <span className={styles.kioskTableIconCell}>
                        <KioskAppIconVisual iconKey={resolvedIcon} tileSize={40} />
                      </span>
                    </td>
                    <td className={shared.td}>
                      <div className={shared.tdBold}>{b.buttonType}</div>
                    </td>
                    <td className={shared.td}>
                      <span
                        className={`${styles.statusPill} ${statusActive ? styles.statusPillActive : styles.statusPillInactive}`}
                        title={b.status}
                      >
                        <span className={styles.statusPillDot} aria-hidden />
                        {formatKioskButtonStatusLabel(b.status)}
                      </span>
                    </td>
                    <td className={`${shared.td} ${shared.tdRight}`}>{b.totalClicks.toLocaleString()}</td>
                    <td className={`${shared.td} ${shared.tdRight}`}>{formatTotalDurationSec(b.totalDuration)}</td>
                    {onEditButton ? (
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <button
                          type='button'
                          className={styles.kioskTableEditBtn}
                          onClick={() => onEditButton(b)}
                          aria-label={`${b.buttonType} 수정`}
                        >
                          <Pencil size={14} strokeWidth={2} aria-hidden />
                          <span>수정</span>
                        </button>
                      </td>
                    ) : null}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && totalElements > 0 ? (
        <div style={{ marginTop: 12 }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalElements}
            onPageChange={onPageChange}
            unit='건'
          />
        </div>
      ) : null}

      {!isLoading && buttons.length > 0 ? (
        <div className={styles.previewSection} style={{ marginTop: 16 }}>
          <div className={styles.previewLabel}>레이아웃 미리보기 (위치 1→22, 좌측 상단부터)</div>
          <KioskButtonLayoutPreview buttons={buttons} />
        </div>
      ) : null}
    </div>
  );
}
