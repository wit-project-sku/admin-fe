// 통계 리포트 전용 — 인사동 리뉴얼 홈(키오스크 1·2·3) 미러.
//
// 키오스크 앱(kiosk-electron InsadongHomeRenewal)은 서버의 line/position 을 쓰지 않고 고정 화면을 그린다.
// 그래서 DB 좌표로 타일을 까는 KioskMirrorGridApp 은 리뉴얼 이전 배치가 되어 버린다.
// 여기서는 앱과 같은 고정 배치(Figma `인사동 리뉴얼` 7516:63421 / 7574:68827)를 그대로 옮기고,
// 각 칸을 DB `button_type`(V173 이후 이름)으로 찾아 클릭 수 배지만 얹는다. 읽기 전용.
//
// - 버튼 id 는 하드코딩하지 않는다(기부는 stage·prod id 가 다르다). buttonType + 키오스크 id(10번 칸)만 쓴다.
// - 칸에 맞는 버튼이 없으면 회색 칸 + 이름 + 0회로 그린다(레이아웃은 고정이므로 비워 두지 않는다).
// - 화면에 없는 버튼(혼자찍기·같이찍기·OFF_MAIN)은 미러에 그리지 않는다 — 옆 표에는 그대로 남는다.
import type { CSSProperties, ReactNode } from 'react';
import { KioskAppIconGlyph } from '@/features/kiosk/kioskAppIcons';
import { tileBgFor } from '@/features/kiosk/manage/constants';
import { resolveKioskButtonIconKey } from '@/features/kiosk/manage/kioskButtonDisplay';
import {
  ButtonStatBadge,
  type ButtonStat,
  type ButtonStatMap,
} from '@/features/kiosk/manage/kioskButtonStatOverlay';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import styles from './InsadongRenewalStatsMirror.module.css';

/** 리뉴얼 홈을 그리는 키오스크(북인사광장·인사동쉼터·남인사광장). */
export const INSADONG_RENEWAL_KIOSK_IDS: ReadonlySet<number> = new Set([1, 2, 3]);
/** 카드 단말기가 있어 10번 칸이 '기부'인 키오스크(남인사광장). 나머지는 '인사동 지도'. */
const DONATION_SLOT_KIOSK_IDS: ReadonlySet<number> = new Set([3]);

/** 칸 하나 = DB button_type(조인 키) + 화면 표기(앱/Figma 한국어). */
type Slot = { type: string; label: string; sub?: string };

const QUICK: readonly (Slot & { variant: 'ai' | 'insarang' | 'events' })[] = [
  { type: "'인사' 뭐하지(AI검색)", label: "'인사' 뭐하지", sub: 'AI 검색하기', variant: 'ai' },
  { type: '인사랑(준비중)', label: '인사랑', sub: '굿즈 만들기', variant: 'insarang' },
  { type: '인사동 이벤트', label: '인사동 이벤트', sub: '인사동 행사', variant: 'events' },
];

/** 4×3 그리드, 앱(GRID_TILES)과 같은 읽기 순서. 10번 칸(index 9)은 키오스크별로 채운다. */
const GRID_HEAD: readonly Slot[] = [
  { type: "'인사' 뭐먹지", label: "'인사' 뭐먹지", sub: '맛집 추천' },
  { type: "'인사' 뭐사지", label: "'인사' 뭐사지", sub: '쇼핑 추천' },
  { type: '숙박안내', label: '숙박안내', sub: '인사 숙소 모음' },
  { type: '고궁안내', label: '고궁안내', sub: '한국의 전통 궁' },
  { type: '여기는 인사동', label: '여기는 인사동', sub: '관광지 추천' },
  // Figma 는 '제주' 소개 — 앱이 고쳐 그리는 '인사' 소개를 따른다.
  { type: "안녕 '인사'", label: "안녕 '인사'", sub: "'인사' 소개" },
  { type: "도와줘 '인사'", label: "도와줘 '인사'", sub: '편의시설 안내' },
  // Figma 는 교복 기부 — 앱이 그리는 전시 안내를 따른다.
  { type: '인사동 미술관', label: '인사동 미술관', sub: '전시 안내' },
  { type: '환율', label: '환율', sub: '환율 계산기' },
];
const GRID_TAIL: readonly Slot[] = [
  { type: '교통안내', label: '교통안내', sub: '대중교통' },
  { type: 'TAX-FREE', label: 'TAX-FREE', sub: '면세혜택' },
];
const SLOT10_MAP: Slot = { type: '인사동 지도', label: '인사동 지도', sub: '탐나는전' };
const SLOT10_DONATION: Slot = { type: '기부', label: '기부', sub: '교복 기부' };

const FIXED = {
  weather: '날씨',
  home: '홈',
  search: '검색',
  language: '언어선택',
  promotion: 'Promotion(준비중)',
  camera: '사진촬영',
  restroom: '화장실',
} as const;

const TARGET_WIDTH = 560;
const SCALE = TARGET_WIDTH / 2160;
const ZERO: ButtonStat = { clicks: 0, durationSec: 0, avgSec: 0 };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** `2025-09-13(Mon)  ㅣ  06:00` — 앱 헤더와 같은 형식. */
function formatDateTime(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}(${WEEKDAYS[d.getDay()]})  ㅣ  ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

type Props = {
  kioskId: number;
  /** 해당 키오스크의 전체 버튼(이미지·아이콘 키에만 쓴다 — 좌표는 쓰지 않는다). */
  buttons: KioskButtonDto[];
  /** buttonType → 기간 집계 */
  stats: ButtonStatMap;
};

export function InsadongRenewalStatsMirror({ kioskId, buttons, stats }: Props) {
  // 같은 이름이 여러 행이면(예: 화면 밖 OFF_MAIN 사본) 화면 버튼을 우선한다.
  const find = (type: string): KioskButtonDto | null => {
    const hits = buttons.filter((b) => (b.buttonType ?? '').trim() === type);
    return hits.find((b) => b.placement !== 'OFF_MAIN') ?? hits[0] ?? null;
  };
  const statOf = (type: string): ButtonStat => stats.get(type) ?? ZERO;
  const maxClicks = Math.max(0, ...[...stats.values()].map((v) => v.clicks));
  const badge = (type: string) => <ButtonStatBadge stat={statOf(type)} max={maxClicks} unit='cq' />;

  const slot10 = DONATION_SLOT_KIOSK_IDS.has(kioskId) ? SLOT10_DONATION : SLOT10_MAP;
  const gridSlots = [...GRID_HEAD, slot10, ...GRID_TAIL];

  /** 버튼 이미지(DB) → 아이콘 키 글리프 → (버튼 없음) 이름 칸. */
  const art = (b: KioskButtonDto | null, label: string, glyphSize: number): ReactNode => {
    if (b?.imageUrl) return <img src={b.imageUrl} alt='' draggable={false} />;
    if (b) {
      return (
        <span className={styles.glyphPlate} style={{ background: tileBgFor(b.id) }}>
          <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(b.iconKey)} size={glyphSize} />
        </span>
      );
    }
    return <span className={styles.missingPlate}>{label}</span>;
  };

  const missingCls = (b: KioskButtonDto | null) => (b ? '' : styles.missing);
  const tip = (type: string, b: KioskButtonDto | null) => (b ? type : `${type} · 등록된 버튼 없음`);

  const home = find(FIXED.home);
  const search = find(FIXED.search);
  const lang = find(FIXED.language);
  const weather = find(FIXED.weather);
  const promo = find(FIXED.promotion);
  const camera = find(FIXED.camera);
  const restroom = find(FIXED.restroom);

  const boardStyle = { transform: `scale(${SCALE})` } as CSSProperties;

  return (
    <div className={styles.scaleWrap} style={{ width: TARGET_WIDTH, height: Math.round(3840 * SCALE) }}>
      <div className={styles.board} style={boardStyle}>
        {/* ── 상단 위치/날짜 ── */}
        <header className={styles.header}>
          <div className={styles.brand}>
            <svg className={styles.pin} viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z' />
            </svg>
            <span>INSADONG</span>
          </div>
          <span className={styles.date}>{formatDateTime(new Date())}</span>
        </header>

        {/* ── 공지 / 날씨 ── */}
        <div className={styles.infoCard}>
          <span className={styles.noticeRule} />
          <p className={styles.noticeText}>인사동 안내 문구가 이 영역에 표시됩니다. (표시 전용)</p>
          <div className={`${styles.weather} ${missingCls(weather)}`} title={tip(FIXED.weather, weather)}>
            <span className={styles.temp}>18°</span>
            <span className={styles.weatherEmoji}>⛅</span>
            {badge(FIXED.weather)}
          </div>
        </div>

        {/* ── 검색장: 홈 · 검색 · 언어선택 ── */}
        <div className={styles.searchRow}>
          <span className={`${styles.homeBtn} ${missingCls(home)}`} title={tip(FIXED.home, home)}>
            <span className={styles.circleClip}>
              {home?.imageUrl ? (
                <img src={home.imageUrl} alt='' draggable={false} />
              ) : (
                <svg className={styles.homeGlyph} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinejoin='round'>
                  <path d='M3 11 12 3l9 8' />
                  <path d='M5 9.5V21h5v-6h4v6h5V9.5' />
                </svg>
              )}
            </span>
            <span className={styles.liftBadge}>{badge(FIXED.home)}</span>
          </span>
          <div className={`${styles.searchInput} ${missingCls(search)}`} title={tip(FIXED.search, search)}>
            <span className={styles.inputPlaceholder}>인사동에 대해 검색해보세요!</span>
            <svg className={styles.searchIcon} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round'>
              <circle cx='11' cy='11' r='7' />
              <path d='m20 20-3.5-3.5' />
            </svg>
            <span className={`${styles.liftBadge} ${styles.liftBadgeSearch}`}>{badge(FIXED.search)}</span>
          </div>
          <span className={`${styles.krBtn} ${missingCls(lang)}`} title={tip(FIXED.language, lang)}>
            KR
            <span className={styles.liftBadge}>{badge(FIXED.language)}</span>
          </span>
        </div>

        {/* ── 퀵 카드 3종 ── */}
        <div className={styles.quickRow}>
          {QUICK.map((q) => {
            const b = find(q.type);
            return (
              <div
                key={q.type}
                className={`${styles.quickCard} ${styles[`quick_${q.variant}`]} ${missingCls(b)}`}
                title={tip(q.type, b)}
              >
                <span className={styles.quickArt}>{art(b, q.label, 160)}</span>
                <span className={styles.quickCopy}>
                  <span className={styles.quickTitle}>{q.label}</span>
                  <span className={styles.quickSub}>{q.sub}</span>
                </span>
                {/* 배지는 그림 위 우상단 — 카드 우상단이면 AI 카드 제목을 덮는다 */}
                <span className={styles.quickBadgeAnchor}>{badge(q.type)}</span>
              </div>
            );
          })}
        </div>

        {/* ── 메인 그리드 4×3 ── */}
        <div className={styles.gridCard}>
          <div className={styles.grid}>
            {gridSlots.map((g) => {
              const b = find(g.type);
              return (
                <div key={g.type} className={`${styles.tile} ${missingCls(b)}`} title={tip(g.type, b)}>
                  <span className={styles.tileArt}>{art(b, g.label, 170)}</span>
                  <span className={styles.tileCaption}>
                    <span className={styles.tileLabel}>{g.label}</span>
                    <span className={styles.tileSub}>{g.sub}</span>
                  </span>
                  {badge(g.type)}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 왼쪽 플로팅 내비(표시 전용 — 버튼 행 없음) ── */}
        <div className={styles.leftNav} aria-hidden>
          <span className={styles.leftNavBtn}>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinejoin='round'>
              <path d='M3 11 12 3l9 8' />
              <path d='M5 9.5V21h5v-6h4v6h5V9.5' />
            </svg>
          </span>
          <span className={styles.leftNavBtn}>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
              <path d='m14 6-6 6 6 6' />
            </svg>
          </span>
          <span className={styles.leftNavBtn}>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='4' r='1.6' fill='currentColor' stroke='none' />
              <path d='M10 8h4l-1 5h4l2 6' />
              <path d='M9.2 11.2a5 5 0 1 0 6.3 7.3' />
            </svg>
          </span>
        </div>

        {/* ── 하단 3종: Promotion(K-DRAMA) · 사진촬영 · 화장실 ── */}
        <div
          className={`${styles.navItem} ${styles.navKdrama} ${missingCls(promo)}`}
          title={tip(FIXED.promotion, promo)}
        >
          <span className={styles.kdramaBox}>
            <span className={styles.kdramaK}>K</span>
            <span className={styles.kdramaWord}>DRAMA</span>
          </span>
          <span className={styles.liftBadge}>{badge(FIXED.promotion)}</span>
        </div>
        <div
          className={`${styles.navItem} ${styles.navCamera} ${missingCls(camera)}`}
          title={tip(FIXED.camera, camera)}
        >
          <span className={styles.cameraCircle}>
            {camera?.imageUrl ? (
              <img src={camera.imageUrl} alt='' draggable={false} />
            ) : (
              <svg className={styles.cameraGlyph} viewBox='0 0 24 24' fill='currentColor'>
                <path d='M9 4 7.5 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.5L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z' />
              </svg>
            )}
          </span>
          {badge(FIXED.camera)}
        </div>
        <div
          className={`${styles.navItem} ${styles.navRestroom} ${missingCls(restroom)}`}
          title={tip(FIXED.restroom, restroom)}
        >
          <span className={styles.restroomCircle}>
            {restroom?.imageUrl ? <img src={restroom.imageUrl} alt='' draggable={false} /> : '🚻'}
          </span>
          <span className={styles.liftBadge}>{badge(FIXED.restroom)}</span>
        </div>
        <span className={`${styles.navLabel} ${styles.navLabelKdrama}`}>K-DRAMA</span>
        <span className={`${styles.navLabel} ${styles.navLabelRestroom}`}>화장실</span>

        {/* ── 하단 배너(표시 전용 — 회전 배너 이미지는 앱 번들에만 있다) ── */}
        <div className={styles.banner} aria-hidden>
          <span className={styles.bannerStripe} />
          <span className={styles.bannerCopy}>
            <span className={styles.bannerTag}>배너 · 표시 전용</span>
            <span className={styles.bannerTitle}>가상 한복 착장을 경험해보세요</span>
          </span>
        </div>
      </div>
    </div>
  );
}
