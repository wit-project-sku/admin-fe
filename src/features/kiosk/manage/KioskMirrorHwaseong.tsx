import { useRef, useState, type DragEvent } from 'react';
import { KioskAppIconGlyph } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { GRID_FIRST_LINE, GRID_LAST_LINE, SLOTS_PER_LINE, tileBgFor } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
import type { MoveRequest } from './KioskMirrorPreview';
import styles from './KioskMirrorHwaseong.module.css';

type Props = {
  buttons: KioskButtonDto[];
  onMove: (req: MoveRequest) => void;
  onSelect?: (button: KioskButtonDto) => void;
  selectedId?: number | null;
  disabled?: boolean;
};

/** 2160×3840 보드를 이 너비로 축소해 패널에 맞춘다(비율 그대로). */
const TARGET_WIDTH = 560;
const SCALE = TARGET_WIDTH / 2160;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}(${DAY_NAMES[d.getDay()]})`;
}

const NOTICE =
  "화성휴게소의 마스코트 'HUE'가 박술녀 한복을 입고 나와요. 여러분도 한복을 입어보세요~ (표시 전용)";

function spanOf(b: KioskButtonDto): number {
  return b.span === 2 ? 2 : 1;
}

/**
 * 화성휴게소 실기기 메인 화면 미러 — kiosk-electron HwaseongHome 의 마크업/CSS 를
 * 그대로 이식하고, 타일 슬롯만 관리자 API 버튼 데이터로 채운다.
 * 헤더/공지/날씨/검색바/하단내비/배너는 표시 전용, 3~6열 그리드만 드래그·클릭 편집.
 */
export function KioskMirrorHwaseong({ buttons, onMove, onSelect, selectedId, disabled }: Props) {
  const today = formatDate(new Date());
  const dragIdRef = useRef<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const fixedAt = (line: number, position: number) =>
    buttons.find((b) => b.placement === 'FIXED' && b.line === line && b.position === position) ??
    null;
  const home = fixedAt(2, 1);
  const lang = fixedAt(2, 3);
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

  const tileInner = (b: KioskButtonDto) =>
    b.imageUrl ? (
      <img src={b.imageUrl} alt='' draggable={false} className={styles.tileCardImg} />
    ) : (
      <span className={styles.tileGlyphCard} style={{ background: tileBgFor(b.id) }}>
        <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(b.iconKey)} size={110} />
      </span>
    );

  // 한 줄(line)을 앱과 동일한 flex justify-between 로 렌더 — 와이드(span=2)=830px, 정사각/빈칸=300px.
  const renderRow = (line: number) => {
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
      <div key={line} className={styles.menuRow}>
        {cells.map(({ pos: p, b, span }) => {
          const key = `${line}:${p}`;
          const over = overKey === key && dragId != null;
          if (!b) {
            return (
              <div
                key={key}
                className={`${styles.emptyCard} ${over ? styles.over : ''}`}
                {...dropHandlers(key, line, p)}
              />
            );
          }
          const wide = span === 2;
          const selected = selectedId === b.id;
          return (
            <div
              key={key}
              className={`${wide ? styles.tileWrapWide : styles.tileWrap} ${
                selected ? styles.tileSel : ''
              } ${dragId === b.id ? styles.dragging : ''} ${over ? styles.over : ''}`}
              draggable={!disabled}
              title={`${b.buttonType} · ${line}열 ${p}${wide ? `~${p + 1}` : ''}`}
              onClick={() => onSelect?.(b)}
              onDragStart={(e) => {
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
              <div className={wide ? styles.tileCardWide : styles.tileCard}>{tileInner(b)}</div>
              <span className={styles.tileLabel}>{b.buttonType}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const gridLines: number[] = [];
  for (let l = GRID_FIRST_LINE; l <= GRID_LAST_LINE; l += 1) gridLines.push(l);

  const camImg = cam2?.imageUrl;

  return (
    <div
      className={styles.scaleWrap}
      style={{ width: TARGET_WIDTH, height: Math.round(3840 * SCALE) }}
    >
      <div className={styles.board} style={{ transform: `scale(${SCALE})` }}>
        <div className={styles.bgBase} />

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTopRow}>
            <div className={styles.headerLeft}>
              <svg
                className={styles.locationIcon}
                xmlns='http://www.w3.org/2000/svg'
                width='71'
                height='90'
                viewBox='0 0 71 90'
                fill='none'
              >
                <path
                  d='M35.5 82C35.5 82 67 53.4783 67 32.087C67 14.3658 52.897 0 35.5 0C18.103 0 4 14.3658 4 32.087C4 53.4783 35.5 82 35.5 82Z'
                  fill='#005AB4'
                />
                <path
                  d='M45.5638 30.7507C45.5638 36.4116 41.0586 41.0007 35.5013 41.0007C29.9439 41.0007 25.4388 36.4116 25.4388 30.7507C25.4388 25.0897 29.9439 20.5007 35.5013 20.5007C41.0586 20.5007 45.5638 25.0897 45.5638 30.7507Z'
                  fill='white'
                />
              </svg>
              <span className={styles.siteName}>HWASEONG SA</span>
            </div>
            <span className={styles.headerDate}>{today}</span>
          </div>

          <div className={styles.headerBottomRow}>
            <div className={styles.noticeCard}>
              <div className={styles.noticeInner}>
                <div className={styles.noticeLabel}>
                  공<br />지
                </div>
                <div className={styles.noticeDivider} />
                <p className={styles.noticeText}>{NOTICE}</p>
              </div>
            </div>

            <div
              className={styles.weatherCard}
              onClick={() => {
                const w = fixedAt(1, 1);
                if (w) onSelect?.(w);
              }}
            >
              <span className={styles.weatherEmoji}>☁️</span>
              <span className={styles.weatherTemp}>18˚</span>
            </div>
          </div>
        </div>

        {/* ── Content (search + grid) ── */}
        <div className={styles.content}>
          <div className={styles.searchBar}>
            <span className={styles.homeCircle} onClick={() => home && onSelect?.(home)}>
              {home?.imageUrl ? (
                <img src={home.imageUrl} alt='' className={styles.homeCircleImg} />
              ) : (
                <svg width='90' height='90' viewBox='0 0 24 24' fill='currentColor' className={styles.homeGlyph}>
                  <path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
                </svg>
              )}
            </span>

            <div className={styles.searchField}>
              <span className={styles.searchPlaceholder}>화성휴게소에 대해 검색해보세요!</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='80'
                height='77'
                viewBox='0 0 80 77'
                fill='none'
                className={styles.searchIcon}
              >
                <path
                  d='M60.8219 58.9L75.5 72.5M70.7667 36.2333C70.7667 53.7592 55.9324 67.9667 37.6333 67.9667C19.3343 67.9667 4.5 53.7592 4.5 36.2333C4.5 18.7075 19.3343 4.5 37.6333 4.5C55.9324 4.5 70.7667 18.7075 70.7667 36.2333Z'
                  stroke='#005AB4'
                  strokeWidth='9'
                  strokeLinecap='round'
                />
              </svg>
            </div>

            <span className={styles.langBtn} onClick={() => lang && onSelect?.(lang)}>
              <span className={styles.langBtnText}>KR</span>
            </span>
          </div>

          <div className={styles.menuGrid}>{gridLines.map(renderRow)}</div>
        </div>

        {/* ── 하단 내비 (표시 전용, 카메라만 고정 버튼 선택) ── */}
        <div className={styles.bottomNav}>
          <div className={styles.bottomNavItem} onClick={() => cam1 && onSelect?.(cam1)}>
            <div className={styles.bottomNavCircle}>🧭</div>
            <span className={styles.bottomNavLabel}>{cam1?.buttonType ?? '스마트 관광'}</span>
          </div>
          <div className={styles.bottomNavItem} onClick={() => cam2 && onSelect?.(cam2)}>
            <div className={`${styles.bottomNavCircle} ${styles.bottomNavCircleBig}`}>
              {camImg ? <img src={camImg} alt='' /> : '📷'}
            </div>
            <span className={styles.bottomNavLabel}>{cam2?.buttonType ?? 'AR 한복체험'}</span>
          </div>
          <div className={styles.bottomNavItem} onClick={() => cam3 && onSelect?.(cam3)}>
            <div
              className={`${styles.bottomNavCircle} ${cam3?.imageUrl ? styles.bottomNavCircleImg : ''}`}
            >
              {cam3?.imageUrl ? <img src={cam3.imageUrl} alt='' /> : '🚻'}
            </div>
            <span className={styles.bottomNavLabel}>{cam3?.buttonType ?? '화장실'}</span>
          </div>
        </div>

        {/* ── 배너 (표시 전용) ── */}
        <div className={styles.bottomBanner}>배너 · 표시 전용</div>
      </div>
    </div>
  );
}
