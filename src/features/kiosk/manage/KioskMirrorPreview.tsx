import { useState, type DragEvent } from 'react';
import { KioskAppIconGlyph } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { GRID_FIRST_LINE, GRID_LAST_LINE, SLOTS_PER_LINE, kioskTheme, tileBgFor } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
import styles from './KioskAppManagePage.module.css';

export type MoveRequest = { sourceId: number; targetLine: number; targetPosition: number };

type Props = {
  buttons: KioskButtonDto[];
  kioskId?: number;
  kioskName?: string;
  /** 그리드 타일을 드롭했을 때 (백엔드가 삽입+재배치) */
  onMove: (req: MoveRequest) => void;
  /** 타일 클릭 → 해당 버튼 선택(정보 표시) */
  onSelect?: (button: KioskButtonDto) => void;
  selectedId?: number | null;
  disabled?: boolean;
};

function spanOf(b: KioskButtonDto): number {
  return b.span === 2 ? 2 : 1;
}

const TODAY = '2026-06-30(Tue)';

/** 실기기 메인 화면 미러 — 1열 공지·날씨 / 2열 홈·검색·언어 / 3~6열 그리드 / 7열 카메라 / 8열 배너. */
export function KioskMirrorPreview({
  buttons,
  kioskId,
  kioskName,
  onMove,
  onSelect,
  selectedId,
  disabled,
}: Props) {
  const t = kioskTheme(kioskId, kioskName);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const fixedAt = (line: number, position: number) =>
    buttons.find((b) => b.placement === 'FIXED' && b.line === line && b.position === position) ??
    null;
  const weather = buttons.find((b) => b.placement === 'FIXED' && b.line === 1) ?? null;
  const home = fixedAt(2, 1);
  const lang = fixedAt(2, 3);
  const cam1 = fixedAt(7, 1);
  const cam2 = fixedAt(7, 2);
  const cam3 = fixedAt(7, 3);
  const mainButtons = buttons.filter((b) => (b.placement ?? 'MAIN') === 'MAIN' && b.line >= 1);

  const visual = (b: KioskButtonDto, size: number, seed: number) => {
    if (b.imageUrl) {
      return (
        <img src={b.imageUrl} alt='' className={styles.mTileImg} style={{ width: size, height: size }} />
      );
    }
    const iconKey = resolveKioskButtonIconKey(b.iconKey);
    return (
      <span
        className={styles.mTileIcon}
        style={{ width: size, height: size, background: tileBgFor(seed) }}
      >
        <KioskAppIconGlyph iconKey={iconKey} size={Math.round(size * 0.5)} />
      </span>
    );
  };

  const finishDrop = (targetLine: number, targetPos: number) => {
    const id = dragId;
    setDragId(null);
    setOverKey(null);
    if (id == null) return;
    const src = mainButtons.find((b) => b.id === id);
    if (!src) return;
    if (src.line === targetLine && src.position === targetPos) return;
    onMove({ sourceId: id, targetLine, targetPosition: targetPos });
  };

  const dropHandlers = (key: string, line: number, pos: number) =>
    disabled
      ? {}
      : {
          onDragOver: (e: DragEvent) => {
            if (dragId == null) return;
            e.preventDefault();
            setOverKey(key);
          },
          onDragLeave: () => setOverKey((k) => (k === key ? null : k)),
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            finishDrop(line, pos);
          },
        };

  const renderGridRow = (line: number) => {
    const rowButtons = mainButtons
      .filter((b) => b.line === line)
      .sort((a, b) => a.position - b.position);
    const cells: Array<{ pos: number; b: KioskButtonDto | null; span: number }> = [];
    let pos = 1;
    while (pos <= SLOTS_PER_LINE) {
      const b = rowButtons.find((x) => x.position === pos) ?? null;
      if (b) {
        cells.push({ pos, b, span: spanOf(b) });
        pos += spanOf(b);
      } else {
        cells.push({ pos, b: null, span: 1 });
        pos += 1;
      }
    }
    return (
      <div key={line} className={styles.mGridRow}>
        {cells.map(({ pos: p, b, span }) => {
          const key = `${line}:${p}`;
          const over = overKey === key && dragId != null;
          if (!b) {
            return (
              <div
                key={key}
                className={`${styles.mEmpty} ${over ? styles.mOver : ''}`}
                style={{ gridColumn: `${p} / span 1` }}
                {...dropHandlers(key, line, p)}
              />
            );
          }
          const selected = selectedId === b.id;
          return (
            <div
              key={key}
              className={`${styles.mTile} ${span === 2 ? styles.mTileWide : ''} ${
                selected ? styles.mTileSel : ''
              } ${dragId === b.id ? styles.mDragging : ''} ${over ? styles.mOver : ''}`}
              style={{ gridColumn: `${p} / span ${span}`, ...(selected ? { borderColor: t.accent } : {}) }}
              draggable={!disabled}
              title={`${b.buttonType} · ${line}열 ${p}${span === 2 ? `~${p + 1}` : ''}`}
              onClick={() => onSelect?.(b)}
              onDragStart={(e) => {
                setDragId(b.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(b.id));
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverKey(null);
              }}
              {...dropHandlers(key, line, p)}
            >
              {visual(b, 50, b.id)}
              <span className={styles.mTileLabel}>{b.buttonType}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const gridLines: number[] = [];
  for (let l = GRID_FIRST_LINE; l <= GRID_LAST_LINE; l += 1) gridLines.push(l);

  const fixedChip = (b: KioskButtonDto | null, fallback: string) => (
    <span
      className={styles.mFixedChip}
      title={b ? `${b.buttonType} (고정)` : fallback}
      onClick={() => b && onSelect?.(b)}
      style={b && selectedId === b.id ? { outline: `2px solid ${t.accent}` } : undefined}
    >
      {b ? visual(b, 45, b.id) : <span className={styles.mGhost} />}
      <span className={styles.mFixedLabel}>{b ? b.buttonType : fallback}</span>
    </span>
  );

  return (
    <div className={styles.mFrame} style={{ background: t.bg, borderColor: t.accent }}>
      <div className={styles.mHeader}>
        <span className={styles.mLoc} style={{ color: t.accent }}>
          <i className='ti' aria-hidden />📍 {t.location}
        </span>
        <span className={styles.mDate}>{TODAY}</span>
      </div>

      <div className={styles.mNoticeRow}>
        <div className={styles.mNotice}>
          <span className={styles.mNoticeTag}>공지</span>
          <span className={styles.mNoticeText}>안내 문구 영역 (장식)</span>
        </div>
        <div
          className={styles.mWeather}
          onClick={() => weather && onSelect?.(weather)}
          title={weather ? `${weather.buttonType} (고정)` : '날씨'}
          style={weather && selectedId === weather.id ? { outline: `2px solid ${t.accent}` } : undefined}
        >
          {weather ? visual(weather, 38, weather.id) : null}
          <span className={styles.mTemp}>18°</span>
        </div>
      </div>

      <div className={styles.mSearchRow}>
        <span
          className={styles.mCircle}
          style={{ background: t.accent }}
          onClick={() => home && onSelect?.(home)}
          title={home ? `${home.buttonType} (고정)` : '홈'}
        >
          {home && !home.imageUrl ? (
            <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(home.iconKey)} size={24} />
          ) : home?.imageUrl ? (
            <img src={home.imageUrl} alt='' className={styles.mCircleImg} />
          ) : (
            '홈'
          )}
        </span>
        <span className={styles.mSearch}>검색해보세요!</span>
        <span
          className={styles.mCircle}
          style={{ background: t.accent }}
          onClick={() => lang && onSelect?.(lang)}
          title={lang ? `${lang.buttonType} (고정)` : '언어선택'}
        >
          KR
        </span>
      </div>

      {gridLines.map(renderGridRow)}

      <div className={styles.mBottomBar}>
        {fixedChip(cam1, '스마트관광')}
        <span
          className={styles.mCamBig}
          style={{ background: t.accent }}
          onClick={() => cam2 && onSelect?.(cam2)}
          title={cam2 ? `${cam2.buttonType} (고정)` : '사진촬영'}
        >
          {cam2 && !cam2.imageUrl ? (
            <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(cam2.iconKey)} size={33} />
          ) : cam2?.imageUrl ? (
            <img src={cam2.imageUrl} alt='' className={styles.mCircleImg} />
          ) : null}
        </span>
        {fixedChip(cam3, '화장실')}
      </div>

      <div className={styles.mBanner}>가상 한복 착장을 경험해보세요 (배너 · 표시 전용)</div>
    </div>
  );
}
