import { useRef, useState, type CSSProperties, type DragEvent, type ReactElement } from 'react';
import { KioskAppIconGlyph } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { GRID_FIRST_LINE, GRID_LAST_LINE, SLOTS_PER_LINE, tileBgFor } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
import type { MoveRequest } from './KioskMirrorPreview';
import { setScaledDragImage } from './scaledDragImage';
import styles from './KioskMirrorGridApp.module.css';

/** 스킨 = kiosk-electron 의 키오스크별 차이(테마색·공지배경·브랜드·타일처리). */
export type GridAppSkin = {
  brand: string;
  accent: string;
  noticeBg: string;
  /** 인사동='art'(이미지 그대로) · 오색='box'(색상 박스 + 투명 아이콘) */
  tileMode: 'art' | 'box';
  notice: string;
  searchPlaceholder: string;
};

export const INSADONG_SKIN: GridAppSkin = {
  brand: 'INSADONG',
  accent: '#fe6c50',
  noticeBg: 'rgba(108, 90, 70, 0.1)',
  tileMode: 'art',
  notice: '인사동 안내 문구가 이 영역에 표시됩니다. (표시 전용)',
  searchPlaceholder: '인사동에 대해 검색해보세요!',
};

export const OSAN_SKIN: GridAppSkin = {
  brand: 'OSAEK MARKET',
  accent: '#1a4d7e',
  noticeBg: 'rgba(26, 77, 126, 0.08)',
  tileMode: 'box',
  notice: '오색시장 안내 문구가 이 영역에 표시됩니다. (표시 전용)',
  searchPlaceholder: '오색시장에 대해 검색해보세요!',
};

type Props = {
  buttons: KioskButtonDto[];
  skin: GridAppSkin;
  onMove: (req: MoveRequest) => void;
  onSelect?: (button: KioskButtonDto) => void;
  selectedId?: number | null;
  disabled?: boolean;
};

const TARGET_WIDTH = 560;
const SCALE = TARGET_WIDTH / 2160;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}(${DAY_NAMES[d.getDay()]})`;
}

function spanOf(b: KioskButtonDto): number {
  return b.span === 2 ? 2 : 1;
}

/**
 * 인사동·오색 실기기 메인 화면 미러 — kiosk-electron InsadongHome/OsanHome 의
 * 마크업/CSS 를 그대로 이식(4열 그리드·AI 와이드·헤더/공지/검색/하단).
 * 타일 슬롯만 관리자 API 버튼 데이터로 채우고, 3~6열만 드래그·선택 편집.
 */
export function KioskMirrorGridApp({ buttons, skin, onMove, onSelect, selectedId, disabled }: Props) {
  const today = formatDate(new Date());
  const dragIdRef = useRef<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const fixedAt = (line: number, position: number) =>
    buttons.find((b) => b.placement === 'FIXED' && b.line === line && b.position === position) ??
    null;
  const home = fixedAt(2, 1);
  const langBtn = fixedAt(2, 3);
  const cam1 = fixedAt(7, 1);
  const cam2 = fixedAt(7, 2);
  const cam3 = fixedAt(7, 3);
  const mainButtons = buttons.filter((b) => (b.placement ?? 'MAIN') === 'MAIN' && b.line >= 1);

  const finishDrop = (targetLine: number, targetPos: number) => {
    const id = dragIdRef.current;
    dragIdRef.current = null;
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
            if (dragIdRef.current == null) return;
            e.preventDefault();
            if (overKey !== key) setOverKey(key);
          },
          onDragLeave: () => setOverKey((k) => (k === key ? null : k)),
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            finishDrop(line, pos);
          },
        };

  const tileInner = (b: KioskButtonDto) => {
    if (skin.tileMode === 'box') {
      return (
        <span className={styles.tileBox} style={{ background: tileBgFor(b.id) }}>
          {b.imageUrl ? (
            <img src={b.imageUrl} alt='' draggable={false} />
          ) : (
            <span className={styles.tileGlyph}>
              <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(b.iconKey)} size={80} />
            </span>
          )}
        </span>
      );
    }
    return (
      <span className={styles.tileArt}>
        {b.imageUrl ? (
          <img src={b.imageUrl} alt='' draggable={false} />
        ) : (
          <span className={styles.tileGlyph} style={{ background: tileBgFor(b.id), width: '80%', height: '80%', borderRadius: '18%' }}>
            <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(b.iconKey)} size={80} />
          </span>
        )}
      </span>
    );
  };

  // 한 슬롯을 CSS 그리드 위 (line,position) 좌표에 배치. line 3→row1.
  const renderCell = (line: number, p: number, b: KioskButtonDto | null, span: number) => {
    const key = `${line}:${p}`;
    const over = overKey === key && dragId != null;
    const gridStyle: CSSProperties = {
      gridColumn: `${p} / span ${span}`,
      gridRow: `${line - GRID_FIRST_LINE + 1}`,
    };
    if (!b) {
      return (
        <div
          key={key}
          className={`${styles.emptyCell} ${over ? styles.over : ''}`}
          style={gridStyle}
          {...dropHandlers(key, line, p)}
        />
      );
    }
    const selected = selectedId === b.id;
    return (
      <div
        key={key}
        className={`${styles.tile} ${span === 2 ? styles.tileWide : ''} ${
          selected ? styles.selected : ''
        } ${dragId === b.id ? styles.dragging : ''} ${over ? styles.over : ''}`}
        style={gridStyle}
        draggable={!disabled}
        title={`${b.buttonType} · ${line}열 ${p}${span === 2 ? `~${p + 1}` : ''}`}
        onClick={() => onSelect?.(b)}
        onDragStart={(e) => {
          setScaledDragImage(e, e.currentTarget);
          dragIdRef.current = b.id;
          setDragId(b.id);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(b.id));
        }}
        onDragEnd={() => {
          dragIdRef.current = null;
          setDragId(null);
          setOverKey(null);
        }}
        {...dropHandlers(key, line, p)}
      >
        {tileInner(b)}
        <span className={styles.tileLabel}>{b.buttonType}</span>
      </div>
    );
  };

  const cells: ReactElement[] = [];
  for (let line = GRID_FIRST_LINE; line <= GRID_LAST_LINE; line += 1) {
    const rowButtons = mainButtons
      .filter((b) => b.line === line)
      .sort((a, b) => a.position - b.position);
    let pos = 1;
    while (pos <= SLOTS_PER_LINE) {
      const b = rowButtons.find((x) => x.position === pos) ?? null;
      const span = b ? spanOf(b) : 1;
      cells.push(renderCell(line, pos, b, span));
      pos += span;
    }
  }

  const boardStyle = {
    transform: `scale(${SCALE})`,
    ['--accent' as string]: skin.accent,
    ['--notice-bg' as string]: skin.noticeBg,
  } as CSSProperties;

  return (
    <div className={styles.scaleWrap} style={{ width: TARGET_WIDTH, height: Math.round(3840 * SCALE) }}>
      <div className={styles.board} style={boardStyle}>
        {/* ── Top block ── */}
        <div className={styles.topBlock}>
          <div className={styles.header}>
            <div className={styles.brand}>
              <svg className={styles.pin} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4'>
                <path d='M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z' />
                <circle cx='12' cy='10' r='3' />
              </svg>
              <span>{skin.brand}</span>
            </div>
            <span className={styles.date}>{today}</span>
          </div>

          <div className={styles.infoRow}>
            <div className={styles.notice}>
              <span className={styles.noticeBadge}>
                <span>공</span>
                <span>지</span>
              </span>
              <span className={styles.noticeDivider} />
              <p className={styles.noticeText}>{skin.notice}</p>
            </div>
            <div
              className={styles.weather}
              onClick={() => {
                const w = fixedAt(1, 1);
                if (w) onSelect?.(w);
              }}
            >
              <span className={styles.weatherEmoji}>☁️</span>
              <span className={styles.temp}>18°</span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className={styles.content}>
          <div className={styles.searchRow}>
            <span className={styles.homeBtn} onClick={() => home && onSelect?.(home)}>
              {home?.imageUrl ? (
                <img src={home.imageUrl} alt='' />
              ) : (
                <svg className={styles.homeGlyph} viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
                </svg>
              )}
            </span>
            <div className={styles.searchInput}>
              <span className={styles.inputPlaceholder}>{skin.searchPlaceholder}</span>
              <svg className={styles.searchIcon} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round'>
                <circle cx='11' cy='11' r='7' />
                <path d='m20 20-3.5-3.5' />
              </svg>
            </div>
            <span className={styles.krBtn} onClick={() => langBtn && onSelect?.(langBtn)}>
              KR
            </span>
          </div>

          <div className={styles.grid}>{cells}</div>
        </div>

        {/* ── Bottom row (표시 전용, 카메라만 고정 버튼) ── */}
        <div className={styles.bottomRow}>
          <div className={styles.kdramaItem} onClick={() => cam1 && onSelect?.(cam1)}>
            <div className={styles.kdramaBox}>K-DRAMA</div>
            <span className={styles.navLabel}>{cam1?.buttonType ?? 'K-DRAMA'}</span>
          </div>
          <div className={styles.cameraBtn} onClick={() => cam2 && onSelect?.(cam2)}>
            <div className={styles.cameraCircle}>
              {cam2?.imageUrl ? <img src={cam2.imageUrl} alt='' /> : '📷'}
            </div>
          </div>
          <div className={styles.restroomItem} onClick={() => cam3 && onSelect?.(cam3)}>
            {cam3?.imageUrl ? (
              <div className={styles.navCircle}>
                <img src={cam3.imageUrl} alt='' />
              </div>
            ) : (
              <div className={styles.navPlaceholder}>🚻</div>
            )}
            <span className={styles.navLabel}>{cam3?.buttonType ?? '화장실'}</span>
          </div>
        </div>

        {/* ── Banner (표시 전용) ── */}
        <div className={styles.banner}>배너 · 표시 전용</div>
      </div>
    </div>
  );
}
