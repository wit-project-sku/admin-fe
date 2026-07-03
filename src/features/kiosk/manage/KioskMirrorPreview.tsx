import { useState, type DragEvent } from 'react';
import { getKioskIconOption } from '../kioskAppIconData';
import { KioskAppIconGlyph } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { GRID_FIRST_LINE, GRID_LAST_LINE, SLOTS_PER_LINE } from './constants';
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
  /** 선택된 키오스크의 버튼 전체 (MAIN/FIXED/OFF_MAIN 포함) */
  buttons: KioskButtonDto[];
  onDragSwap: (req: DragSwapRequest) => void;
  disabled?: boolean;
  /** 타일 클릭 시 (시트 행 포커스 등) */
  onSelectButton?: (b: KioskButtonDto) => void;
};

function spanOf(b: KioskButtonDto): number {
  return b.span === 2 ? 2 : 1;
}

/** 실기기 메인 화면 미러 — 1열 공지/날씨 · 2열 홈/검색/언어 · 3~6열 그리드 · 7열 카메라 · 8열 배너. */
export function KioskMirrorPreview({ buttons, onDragSwap, disabled, onSelectButton }: Props) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const fixedAt = (line: number, position: number) =>
    buttons.find((b) => b.placement === 'FIXED' && b.line === line && b.position === position) ??
    null;
  const mainButtons = buttons.filter((b) => (b.placement ?? 'MAIN') === 'MAIN' && b.line >= 1);

  const finishDrop = (targetLine: number, targetPos: number, target: KioskButtonDto | null) => {
    const source = mainButtons.find((b) => b.id === dragId) ?? null;
    setDragId(null);
    setOverKey(null);
    if (!source) return;
    if (source.line === targetLine && source.position === targetPos) return;
    onDragSwap({ source, targetLine, targetPosition: targetPos, target });
  };

  const tileVisual = (b: KioskButtonDto, size: number) => {
    if (b.imageUrl) {
      return <img src={b.imageUrl} alt='' className={styles.mirrorTileImg} style={{ width: size, height: size }} />;
    }
    const iconKey = resolveKioskButtonIconKey(b.iconKey);
    const opt = getKioskIconOption(iconKey);
    return (
      <span
        className={styles.mirrorTileIcon}
        style={{ width: size, height: size, background: opt?.color ?? '#64748b' }}
      >
        <KioskAppIconGlyph iconKey={iconKey} size={Math.round(size * 0.55)} />
      </span>
    );
  };

  const fixedTile = (b: KioskButtonDto | null, fallbackLabel: string, size = 34) => (
    <span
      className={styles.mirrorFixedTile}
      title={b ? `${b.buttonType} · ${b.line}열 ${b.position} (고정)` : fallbackLabel}
      onClick={() => b && onSelectButton?.(b)}
      role={b ? 'button' : undefined}
    >
      {b ? tileVisual(b, size) : <span className={styles.mirrorGhost} style={{ width: size, height: size }} />}
      <span className={styles.mirrorTileLabel}>{b ? b.buttonType : fallbackLabel}</span>
    </span>
  );

  const renderGridLine = (line: number) => {
    const lineButtons = mainButtons
      .filter((b) => b.line === line)
      .sort((a, b) => a.position - b.position);
    const cells: Array<{ pos: number; b: KioskButtonDto | null; span: number }> = [];
    let pos = 1;
    while (pos <= SLOTS_PER_LINE) {
      const b = lineButtons.find((x) => x.position === pos) ?? null;
      if (b) {
        cells.push({ pos, b, span: spanOf(b) });
        pos += spanOf(b);
      } else {
        cells.push({ pos, b: null, span: 1 });
        pos += 1;
      }
    }
    return (
      <div key={line} className={styles.mirrorGridRow}>
        {cells.map(({ pos: p, b, span }) => {
          const key = `${line}:${p}`;
          const isOver = overKey === key && dragId != null;
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
                  finishDrop(line, p, b);
                },
              };
          if (!b) {
            return (
              <div
                key={key}
                className={`${styles.mirrorEmpty} ${isOver ? styles.mirrorDropOver : ''}`}
                style={{ gridColumn: `${p} / span 1` }}
                {...dropHandlers}
              >
                <span className={styles.mirrorSlotPos}>{`${line}·${p}`}</span>
              </div>
            );
          }
          return (
            <div
              key={key}
              className={`${styles.mirrorTile} ${span === 2 ? styles.mirrorTileWide : ''} ${
                dragId === b.id ? styles.mirrorDragging : ''
              } ${isOver ? styles.mirrorDropOver : ''} ${!disabled ? styles.mirrorDraggable : ''}`}
              style={{ gridColumn: `${p} / span ${span}` }}
              title={`${b.buttonType} · ${line}열 ${p}${span === 2 ? `~${p + 1}` : ''}${disabled ? '' : ' · 드래그하여 이동'}`}
              draggable={!disabled}
              onClick={() => onSelectButton?.(b)}
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
              {tileVisual(b, 34)}
              <span className={styles.mirrorTileLabel}>{b.buttonType}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const weather = buttons.find((b) => b.placement === 'FIXED' && b.line === 1) ?? null;
  const home = fixedAt(2, 1);
  const search = fixedAt(2, 2);
  const lang = fixedAt(2, 3);
  const cam1 = fixedAt(7, 1);
  const cam2 = fixedAt(7, 2);
  const cam3 = fixedAt(7, 3);

  const gridLines: number[] = [];
  for (let l = GRID_FIRST_LINE; l <= GRID_LAST_LINE; l += 1) gridLines.push(l);

  return (
    <div className={styles.mirrorWrap}>
      <div className={styles.mirrorFrame}>
        <div className={styles.mirrorRowTag}>1열 · 고정</div>
        <div className={styles.mirrorRow1}>
          <div className={styles.mirrorNotice}>
            <span className={styles.mirrorNoticeBadge}>공지</span> 안내 문구 영역 (장식)
          </div>
          <div
            className={styles.mirrorWeather}
            title={weather ? `${weather.buttonType} (고정)` : '날씨'}
            onClick={() => weather && onSelectButton?.(weather)}
          >
            {weather ? tileVisual(weather, 28) : null}
            <span>{weather?.buttonType ?? '날씨'}</span>
          </div>
        </div>

        <div className={styles.mirrorRowTag}>2열 · 고정</div>
        <div className={styles.mirrorRow2}>
          <span
            className={styles.mirrorCircle}
            title={home ? `${home.buttonType} (고정)` : '홈'}
            onClick={() => home && onSelectButton?.(home)}
          >
            {home ? tileVisual(home, 30) : '홈'}
          </span>
          <span
            className={styles.mirrorSearch}
            title={search ? `${search.buttonType} (고정)` : '검색'}
            onClick={() => search && onSelectButton?.(search)}
          >
            검색창 (장식)
          </span>
          <span
            className={styles.mirrorCircle}
            title={lang ? `${lang.buttonType} (고정)` : '언어선택'}
            onClick={() => lang && onSelectButton?.(lang)}
          >
            {lang ? tileVisual(lang, 30) : 'KR'}
          </span>
        </div>

        <div className={styles.mirrorRowTag}>3~6열 · 드래그 배치 (한 줄 4칸)</div>
        {gridLines.map(renderGridLine)}

        <div className={styles.mirrorRowTag}>7열 · 고정</div>
        <div className={styles.mirrorRow7}>
          {fixedTile(cam1, '—')}
          <span
            className={styles.mirrorCameraBig}
            title={cam2 ? `${cam2.buttonType} (고정)` : '사진촬영'}
            onClick={() => cam2 && onSelectButton?.(cam2)}
          >
            {cam2 ? tileVisual(cam2, 40) : null}
          </span>
          {fixedTile(cam3, '—')}
        </div>

        <div className={styles.mirrorRowTag}>8열 · 배너</div>
        <div className={styles.mirrorBanner}>배너 영역 — 표시 전용 (관리 대상 아님)</div>
      </div>
    </div>
  );
}
