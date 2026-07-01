import { useState, type DragEvent } from 'react';
import { getKioskIconOption } from '../kioskAppIconData';
import { KioskAppIconGlyph } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { LINE_CAPACITY_OPTIONS, resolveLineCapacity } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
import styles from './KioskAppManagePage.module.css';

/** 드래그로 한 슬롯을 다른 슬롯에 놓았을 때의 요청. target 이 있으면 SWAP, 없으면 이동. */
export type DragSwapRequest = {
  source: KioskButtonDto;
  targetLine: number;
  targetPosition: number;
  target: KioskButtonDto | null;
};

type Props = {
  buttons: KioskButtonDto[];
  /** 줄별 용량이 지정되지 않은 줄의 기본 폭 */
  buttonsPerLine: number;
  /** 줄별 최대 버튼 수(각 1~4). 없는 줄은 buttonsPerLine 사용 */
  lineCapacities: number[];
  onDragSwap: (req: DragSwapRequest) => void;
  /** 특정 줄의 용량을 바꿀 때 (line, 새 용량) */
  onLineCapacityChange: (line: number, capacity: number) => void;
  disabled?: boolean;
};

export function KioskButtonLayoutPreview({
  buttons,
  buttonsPerLine,
  lineCapacities,
  onDragSwap,
  onLineCapacityChange,
  disabled,
}: Props) {
  const byKey = new Map(buttons.map((b) => [`${b.line}:${b.position}`, b]));
  const maxLine = buttons.reduce((m, b) => Math.max(m, b.line ?? 0), 0);
  const lineCount = Math.max(maxLine + 1, lineCapacities.length, 1);
  const capFor = (line: number) => resolveLineCapacity(lineCapacities, line, buttonsPerLine);

  const [dragId, setDragId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const finishDrop = (targetLine: number, targetPos: number, targetButton: KioskButtonDto | null) => {
    const source = buttons.find((b) => b.id === dragId) ?? null;
    setDragId(null);
    setOverKey(null);
    if (!source) return;
    if (source.line === targetLine && source.position === targetPos) return;
    onDragSwap({ source, targetLine, targetPosition: targetPos, target: targetButton });
  };

  const renderCell = (line: number, pos: number) => {
    const key = `${line}:${pos}`;
    const b = byKey.get(key) ?? null;
    const isOver = overKey === key && dragId != null;
    const label = `${line}·${pos}`;
    const dropHandlers = disabled
      ? {}
      : {
          onDragOver: (e: DragEvent) => {
            if (dragId == null || dragId === b?.id) return;
            e.preventDefault();
            setOverKey(key);
          },
          onDragLeave: () => setOverKey((k) => (k === key ? null : k)),
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            finishDrop(line, pos, b);
          },
        };

    if (!b) {
      return (
        <div key={key} className={`${styles.slot} ${styles.slotBox} ${isOver ? styles.slotDropOver : ''}`} {...dropHandlers}>
          <span className={styles.slotPos}>{label}</span>
          빈칸
        </div>
      );
    }

    const iconKey = resolveKioskButtonIconKey(b.iconKey);
    const opt = getKioskIconOption(iconKey);
    return (
      <div
        key={key}
        className={`${styles.slot} ${styles.slotBox} ${styles.slotFilled} ${!disabled ? styles.slotDraggable : ''} ${dragId === b.id ? styles.slotDragging : ''} ${isOver ? styles.slotDropOver : ''}`}
        title={`${b.buttonType} · 줄 ${line} 위치 ${pos}${disabled ? '' : ' · 드래그하여 이동'}`}
        draggable={!disabled}
        onDragStart={(e) => {
          setDragId(b.id);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(b.id));
        }}
        onDragEnd={() => {
          setDragId(null);
          setOverKey(null);
        }}
        {...dropHandlers}
      >
        <span className={styles.slotPos}>{label}</span>
        <span className={styles.slotIconInner} style={{ background: opt?.color ?? '#64748b' }}>
          <KioskAppIconGlyph iconKey={iconKey} size={22} />
        </span>
      </div>
    );
  };

  return (
    <div className={styles.previewRows}>
      {Array.from({ length: lineCount }).map((_, line) => {
        const cap = capFor(line);
        return (
          <div key={line} className={styles.previewRow}>
            {Array.from({ length: cap }).map((__, pos) => renderCell(line, pos))}
            <label className={styles.lineCapControl} title={`${line}번 줄 최대 버튼 수`}>
              <span className={styles.lineCapLabel}>{line}줄</span>
              <select
                className={styles.lineCapSelect}
                value={cap}
                disabled={disabled}
                onChange={(e) => onLineCapacityChange(line, Number(e.target.value))}
                aria-label={`${line}번 줄 최대 버튼 수`}
              >
                {LINE_CAPACITY_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}개
                  </option>
                ))}
              </select>
            </label>
          </div>
        );
      })}
    </div>
  );
}
