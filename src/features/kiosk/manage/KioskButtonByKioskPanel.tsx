import { useState } from 'react';
import { Pencil } from 'lucide-react';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import { KioskAppIconVisual } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { useUpdateKioskButton } from '@/hooks/kiosk-api/useUpdateKioskButton';
import { useUpdateKioskLineCapacities } from '@/hooks/kiosk-api/useUpdateKioskLineCapacities';
import { KioskButtonLayoutPreview, type DragSwapRequest } from './KioskButtonLayoutPreview';
import { placementLabel, resolveLineCapacity } from './constants';
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
  buttonsPerLine: number;
  lineCapacities: number[];
  onEditButton?: (button: KioskButtonDto) => void;
  onEditSubtitle?: (button: KioskButtonDto) => void;
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
  kioskId,
  byKioskId,
  onByKioskId,
  kioskOptions,
  buttonsPerLine,
  lineCapacities,
  onEditButton,
  onEditSubtitle,
  onNotice,
}: Props) {
  const { updateKioskButtonAsync } = useUpdateKioskButton();
  const { updateLineCapacitiesAsync, isPending: capsPending } = useUpdateKioskLineCapacities();
  const [pendingSwap, setPendingSwap] = useState<DragSwapRequest | null>(null);
  const [swapping, setSwapping] = useState(false);

  // 그리드(MAIN)와 예외(FIXED/OFF_MAIN) 버튼 분리
  const mainButtons = buttons.filter((b) => (b.placement ?? 'MAIN') === 'MAIN');
  const excludedButtons = buttons
    .filter((b) => (b.placement ?? 'MAIN') !== 'MAIN')
    .sort((a, b) => a.id - b.id);

  const onLineCapacityChange = async (line: number, capacity: number) => {
    if (!kioskId) return;
    const maxLine = mainButtons.reduce((m, b) => Math.max(m, b.line ?? 0), 0);
    const lineCount = Math.max(maxLine + 1, lineCapacities.length, line + 1);
    const caps = Array.from({ length: lineCount }, (_, l) =>
      resolveLineCapacity(lineCapacities, l, buttonsPerLine),
    );
    caps[line] = capacity;
    try {
      await updateLineCapacitiesAsync({ kioskId, capacities: caps });
      onNotice?.(`${line}번 줄 버튼 수를 ${capacity}개로 변경했습니다.`);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '줄별 버튼 수를 변경하지 못했습니다.');
    }
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

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <span className={shared.cardTitle}>{kioskName} · 버튼</span>
        </div>
        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`}>위치(줄·칸)</th>
                <th className={`${shared.th} ${shared.thCenter}`}>아이콘</th>
                <th className={shared.th}>버튼 타입</th>
                <th className={shared.th}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`}>총 클릭</th>
                <th className={`${shared.th} ${shared.thRight}`}>사용 시간</th>
                {onEditButton ? <th className={`${shared.th} ${shared.thCenter}`}>관리</th> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={onEditButton ? 7 : 6} className={shared.tableStateCell}>
                    불러오는 중…
                  </td>
                </tr>
              ) : mainButtons.length === 0 ? (
                <tr>
                  <td colSpan={onEditButton ? 7 : 6} className={shared.tableStateCell}>
                    이 WITH에 그리드 버튼이 없습니다.
                  </td>
                </tr>
              ) : (
                mainButtons.map((b) => {
                  const resolvedIcon = resolveKioskButtonIconKey(b.iconKey);
                  const statusActive = isKioskButtonStatusActive(b.status);
                  return (
                    <tr key={`${b.id}-${b.line}-${b.position}`} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={styles.posBadge}>
                          {b.line}·{b.position}
                        </span>
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
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type='button'
                              className={styles.kioskTableEditBtn}
                              onClick={() => onEditButton(b)}
                              aria-label={`${b.buttonType} 상세`}
                            >
                              <Pencil size={14} strokeWidth={2} aria-hidden />
                              <span>상세</span>
                            </button>
                            {onEditSubtitle ? (
                              <button
                                type='button'
                                className={styles.kioskTableEditBtn}
                                onClick={() => onEditSubtitle(b)}
                                aria-label={`${b.buttonType} 자막/영상`}
                              >
                                <span>자막/영상</span>
                              </button>
                            ) : null}
                          </div>
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

      {!isLoading && mainButtons.length > 0 ? (
        <div className={styles.previewSection} style={{ marginTop: 16 }}>
          <div className={styles.previewLabel}>
            레이아웃 미리보기 — 숫자는 줄·칸(0부터). 아이콘을 드래그해 위치를 교체하고, 줄마다 버튼 수(3/4)를 지정하세요.
          </div>
          <KioskButtonLayoutPreview
            buttons={mainButtons}
            buttonsPerLine={buttonsPerLine}
            lineCapacities={lineCapacities}
            onDragSwap={setPendingSwap}
            onLineCapacityChange={onLineCapacityChange}
            disabled={swapping || capsPending}
          />
        </div>
      ) : null}

      {!isLoading && excludedButtons.length > 0 ? (
        <div className={styles.previewSection} style={{ marginTop: 16 }}>
          <div className={styles.previewLabel}>예외 버튼 (위치 관리 안 함)</div>
          <div className={styles.subtitleList}>
            {excludedButtons.map((b) => (
              <div key={b.id} className={styles.subtitleRow}>
                <div className={styles.subtitleRowMain}>
                  <div className={styles.subtitleVideoName}>
                    {b.buttonType}{' '}
                    <span className={`${shared.badge} ${shared.badgeGray}`}>{placementLabel(b.placement)}</span>
                  </div>
                  <div className={styles.subtitleText}>
                    {b.placement === 'FIXED' ? '메인 화면에 표시되지만 위치 고정' : '메인 화면에 미표시'}
                  </div>
                </div>
                <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
                  {/* 고정(FIXED) 버튼은 메인에 표시되므로 자막/영상 적용 가능. 미표시(OFF_MAIN)는 제외. */}
                  {onEditSubtitle && b.placement === 'FIXED' ? (
                    <button
                      type='button'
                      className={styles.kioskTableEditBtn}
                      onClick={() => onEditSubtitle(b)}
                      aria-label={`${b.buttonType} 자막/영상`}
                    >
                      <span>자막/영상</span>
                    </button>
                  ) : null}
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
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pendingSwap ? (
        <div className={styles.overlay} role='presentation' onClick={() => !swapping && setPendingSwap(null)}>
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='kiosk-button-swap-title'
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <span id='kiosk-button-swap-title' className={styles.modalTitle}>
                버튼 위치 변경
              </span>
              <button
                type='button'
                className={shared.btnOutline}
                onClick={() => setPendingSwap(null)}
                aria-label='닫기'
                disabled={swapping}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {pendingSwap.target ? (
                <p className={styles.formHint} style={{ marginTop: 0 }}>
                  <strong>{pendingSwap.source.buttonType}</strong>(줄 {pendingSwap.source.line}·{pendingSwap.source.position})
                  와 <strong>{pendingSwap.target.buttonType}</strong>(줄 {pendingSwap.targetLine}·{pendingSwap.targetPosition})
                  의 위치를 서로 교체합니다.
                </p>
              ) : (
                <p className={styles.formHint} style={{ marginTop: 0 }}>
                  <strong>{pendingSwap.source.buttonType}</strong>(줄 {pendingSwap.source.line}·{pendingSwap.source.position})
                  를 줄 {pendingSwap.targetLine}·{pendingSwap.targetPosition} 로 이동합니다.
                </p>
              )}
              <p className={styles.formHint}>진행하시겠습니까?</p>
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
              <button type='button' className={shared.btnPrimary} onClick={confirmSwap} disabled={swapping}>
                {swapping ? '변경 중…' : '변경'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
