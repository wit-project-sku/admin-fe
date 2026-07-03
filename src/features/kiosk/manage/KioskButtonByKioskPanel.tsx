import { useState } from 'react';
import { Pencil } from 'lucide-react';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import { KioskAppIconVisual } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { useUpdateKioskButton } from '@/hooks/kiosk-api/useUpdateKioskButton';
import { KioskMirrorPreview, type DragSwapRequest } from './KioskMirrorPreview';
import { placementLabel, positionLabel } from './constants';
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
  kioskId?: number;
  byKioskId: string;
  onByKioskId: (id: string) => void;
  kioskOptions: Array<{ value: string; label: string; sublabel?: string }>;
  onEditButton?: (button: KioskButtonDto) => void;
  /** 미리보기 타일/표 행 클릭 → 자막 시트의 해당 버튼 행으로 포커스 */
  onFocusButton?: (button: KioskButtonDto) => void;
  onNotice?: (message: string) => void;
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
  onEditButton,
  onFocusButton,
  onNotice,
}: Props) {
  const { updateKioskButtonAsync } = useUpdateKioskButton();
  const [pendingSwap, setPendingSwap] = useState<DragSwapRequest | null>(null);
  const [swapping, setSwapping] = useState(false);

  // 화면에 보이는 버튼(그리드+고정, line>=1)과 미표시(OFF_MAIN 또는 파킹) 분리
  const visibleButtons = buttons
    .filter((b) => b.line >= 1)
    .sort((a, b) => a.line - b.line || a.position - b.position);
  const hiddenButtons = buttons.filter((b) => b.line < 1).sort((a, b) => a.id - b.id);

  const requestSwap = (req: DragSwapRequest) => {
    const srcSpan = req.source.span === 2 ? 2 : 1;
    const dstSpan = req.target ? (req.target.span === 2 ? 2 : 1) : null;
    if (req.target && dstSpan !== srcSpan) {
      onNotice?.('폭(칸 수)이 다른 버튼끼리는 교체할 수 없습니다. 빈 칸으로 이동해 주세요.');
      return;
    }
    if (srcSpan === 2 && req.targetPosition + 1 > 4) {
      onNotice?.('2칸 버튼은 4번 칸에서 시작할 수 없습니다.');
      return;
    }
    setPendingSwap(req);
  };

  const confirmSwap = async () => {
    if (!pendingSwap) return;
    const { source, targetLine, targetPosition, target } = pendingSwap;
    try {
      setSwapping(true);
      await updateKioskButtonAsync({
        buttonId: source.id,
        payload: {
          buttonType: source.buttonType,
          buttonName: source.buttonName ?? '',
          line: targetLine,
          position: targetPosition,
          iconKey: resolveKioskButtonIconKey(source.iconKey),
          status: source.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        },
      });
      onNotice?.(target ? '두 버튼의 위치를 교체했습니다.' : '버튼 위치를 이동했습니다.');
      setPendingSwap(null);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '위치 변경에 실패했습니다.');
    } finally {
      setSwapping(false);
    }
  };

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

      <div className={styles.previewSection}>
        <div className={styles.previewLabel}>
          {kioskName} — 실기기 메인 화면 미러 · 3~6열만 드래그 배치(한 줄 4칸) · 1·2·7열 고정 · 8열
          배너(표시 전용) · 타일 클릭 시 아래 시트로 이동
        </div>
        {!isLoading ? (
          <KioskMirrorPreview
            buttons={buttons}
            onDragSwap={requestSwap}
            onSelectButton={onFocusButton}
            disabled={swapping}
          />
        ) : (
          <p className={styles.emptyState}>불러오는 중…</p>
        )}
      </div>

      <div className={shared.card} style={{ marginTop: 16 }}>
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
                <th className={shared.th}>배치</th>
                <th className={shared.th}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>총 클릭</th>
                <th className={`${shared.th} ${shared.thRight}`}>사용 시간</th>
                {onEditButton ? <th className={`${shared.th} ${shared.thCenter}`}>관리</th> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={onEditButton ? 8 : 7} className={shared.tableStateCell}>
                    불러오는 중…
                  </td>
                </tr>
              ) : visibleButtons.length === 0 ? (
                <tr>
                  <td colSpan={onEditButton ? 8 : 7} className={shared.tableStateCell}>
                    이 WITH에 표시되는 버튼이 없습니다.
                  </td>
                </tr>
              ) : (
                visibleButtons.map((b) => {
                  const resolvedIcon = resolveKioskButtonIconKey(b.iconKey);
                  const statusActive = isKioskButtonStatusActive(b.status);
                  return (
                    <tr key={b.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={styles.posBadge}>
                          {positionLabel(b.line, b.position, b.span)}
                        </span>
                        {b.span === 2 ? <span className={styles.sheetSpanBadge}>2칸</span> : null}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={styles.kioskTableIconCell}>
                          {b.imageUrl ? (
                            <img
                              src={b.imageUrl}
                              alt=''
                              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
                            />
                          ) : (
                            <KioskAppIconVisual iconKey={resolvedIcon} tileSize={40} />
                          )}
                        </span>
                      </td>
                      <td className={shared.td}>
                        <div className={shared.tdBold}>{b.buttonType}</div>
                      </td>
                      <td className={shared.td}>{placementLabel(b.placement)}</td>
                      <td className={shared.td}>
                        <span
                          className={`${styles.statusPill} ${statusActive ? styles.statusPillActive : styles.statusPillInactive}`}
                          title={b.status}
                        >
                          <span className={styles.statusPillDot} aria-hidden />
                          {formatKioskButtonStatusLabel(b.status)}
                        </span>
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        {b.totalClicks.toLocaleString()}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        {formatTotalDurationSec(b.totalDuration)}
                      </td>
                      {onEditButton ? (
                        <td className={`${shared.td} ${shared.tdCenter}`}>
                          <button
                            type='button'
                            className={styles.kioskTableEditBtn}
                            onClick={() => onEditButton(b)}
                            aria-label={`${b.buttonType} 상세`}
                          >
                            <Pencil size={14} strokeWidth={2} aria-hidden />
                            <span>상세</span>
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

      {!isLoading && hiddenButtons.length > 0 ? (
        <div className={styles.previewSection} style={{ marginTop: 16 }}>
          <div className={styles.previewLabel}>미표시 버튼 (메인 화면에 노출되지 않음)</div>
          <div className={styles.subtitleList}>
            {hiddenButtons.map((b) => (
              <div key={b.id} className={styles.subtitleRow}>
                <span className={shared.tdBold}>{b.buttonType}</span>
                <span className={styles.formHint} style={{ margin: 0 }}>
                  {placementLabel(b.placement)}
                </span>
                {onEditButton ? (
                  <button
                    type='button'
                    className={styles.kioskTableEditBtn}
                    onClick={() => onEditButton(b)}
                    aria-label={`${b.buttonType} 상세`}
                  >
                    <Pencil size={14} strokeWidth={2} aria-hidden />
                    <span>상세</span>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pendingSwap ? (
        <div
          className={styles.overlay}
          role='presentation'
          onClick={() => !swapping && setPendingSwap(null)}
        >
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='swap-confirm-title'
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <span id='swap-confirm-title' className={styles.modalTitle}>
                위치 변경
              </span>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.formHint}>
                <strong>{pendingSwap.source.buttonType}</strong>
                {' → '}
                {positionLabel(pendingSwap.targetLine, pendingSwap.targetPosition, pendingSwap.source.span)}
                {pendingSwap.target ? (
                  <>
                    {' ('}
                    <strong>{pendingSwap.target.buttonType}</strong>
                    {' 과 자리 교체)'}
                  </>
                ) : (
                  ' (빈 칸으로 이동)'
                )}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type='button'
                className={shared.btnOutline}
                onClick={() => setPendingSwap(null)}
                disabled={swapping}
              >
                취소
              </button>
              <button type='button' className={shared.btnPrimary} onClick={() => void confirmSwap()} disabled={swapping}>
                {swapping ? '변경 중…' : '변경'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
