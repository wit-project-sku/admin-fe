// 통계 리포트 전용 — 제주국제공항(W008) 홈 화면 미러, 2026-10-28 홈 격자 개편판.
//
// 키오스크 앱(kiosk-electron JejuHome, Figma 6439:71456)이 고정 배치로 그리는 화면을 같은 좌표로 옮겼다 —
// 위치·날짜 · 공지/날씨 · 운항 정보 보드 · 검색줄 · 카드 3 · 격자 4×3 · 필미/사진촬영/화장실.
// 10-28 개편: 탐나오·제주큐랑이 위드마켓 카드 자리로, 지역화폐↔TAX-FREE 자리 바꿈, 위드마켓·TAX-FREE·기부는 회색 '준비중',
// 도와줘 칸 제목은 '제주공항 안내'. 이 배치는 DB line/position 과 맞지 않아(앱도 CMS 순서를 쓰지 않는다) 좌표를 여기 적는다.
//
// - 칸은 DB `button_name`(#W008_아이콘NN)으로 찾는다 — 앱은 표시 문구가 아니라 CMS button_type 으로 터치를 기록하고,
//   button_name 은 그 행의 고정 슬롯이다(오색·화성 미러와 같은 방식).
// - 필미(FillMe)는 DB 버튼 행이 없어 앱이 이름('필미')만으로 기록한다 → 집계도 그 이름으로 찾는다.
// - '준비중' 칸(기부·위드마켓·TAX-FREE)은 집계 대상이 아니라 배지를 달지 않는다(jejuAirportHome — 집계에서도 뺀다).
import type { CSSProperties, ReactNode } from 'react';
import {
  ButtonStatBadge,
  type ButtonStat,
  type ButtonStatMap,
} from '@/features/kiosk/manage/kioskButtonStatOverlay';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { reportHomeArt } from './reportHomeArt';
import styles from './JejuAirportStatsMirror.module.css';

/** 칸 하나 = DB button_name 꼬리(조인 키) + 앱이 그리는 한국어 문구(Localization_Jeju ko). */
type Slot = { name: string; label: string; sub: string; art?: string; plate?: string; comingSoon?: boolean };

const PREFIX = '#W008_';
/** DB 행이 없는 버튼 — 앱이 기록하는 이름(button_type) 그대로. */
const FILLME_TYPE = '필미';

const FIXED = { home: '아이콘01', search: '아이콘02', language: '아이콘03', camera: '아이콘20', restroom: '아이콘21' } as const;

/** 카드 3장 — 앱 AIRPORT_CARDS. 그림 자리는 카드 기준 px(JejuHome.module.css). */
const CARDS: readonly (Slot & { variant: 'cardAi' | 'cardTamnao' | 'cardEvents' })[] = [
  { name: '아이콘04', label: "'제주' 뭐하지", sub: 'AI 검색하기', art: 'card-ai', variant: 'cardAi' },
  { name: '아이콘17', label: '탐나오·제주큐랑', sub: '제주공공플랫폼', art: 'tile-tamnao', variant: 'cardTamnao' },
  { name: '아이콘06', label: '제주도 이벤트', sub: '제주행사', art: 'card-events', variant: 'cardEvents' },
];

/** 격자 4×3 — 앱 TILES_AIRPORT 의 읽기 순서. */
const GRID: readonly Slot[] = [
  { name: '아이콘07', label: "'제주'뭐먹지", sub: '맛집 추천', art: 'tile-eat' },
  { name: '아이콘08', label: "'제주'뭐사지", sub: '쇼핑 추천', art: 'tile-shop' },
  { name: '아이콘09', label: '숙박안내', sub: '제주 숙소 모음', art: 'tile-lodging' },
  { name: '아이콘18', label: '지역화폐', sub: '탐나는전', art: 'tile-localpay' },
  { name: '아이콘11', label: '여기는 제주도', sub: '관광지 추천', art: 'tile-about' },
  { name: '아이콘12', label: "안녕 '귤이'", sub: '귤이 소개', art: 'tile-hello' },
  { name: '아이콘13', label: '제주공항 안내', sub: '편의시설 안내', art: 'tile-help' },
  { name: '아이콘14', label: '렌트카', sub: '간편 예약', art: 'tile-rentcar' },
  { name: '아이콘15', label: '환율', sub: '환율 계산기', art: 'tile-exchange' },
  { name: '아이콘16', label: '기부', sub: '교복 기부', comingSoon: true },
  { name: '아이콘05', label: '위드마켓', sub: '굿즈 만들기', comingSoon: true },
  { name: '아이콘10', label: 'TAX-FREE', sub: '면세 혜택', comingSoon: true },
];

/** 운항 정보 보드 머리 — 열 가운데 x(보드 기준, 앱 JejuFlightBoard COLUMNS). */
const FLIGHT_COLUMNS: readonly [string, number][] = [
  ['출발시각', 410],
  ['항공사/편명', 750],
  ['목적지', 1150],
  ['구분', 1410],
  ['게이트', 1570],
  ['현황', 1730],
];

const TARGET_WIDTH = 560;
const SCALE = TARGET_WIDTH / 2160;
const ZERO: ButtonStat = { clicks: 0, durationSec: 0, avgSec: 0 };
/** 격자 한 칸 간격 — 300 폭 + 180 틈, 412 높이 + 80 틈(앱 COL_STEP/ROW_STEP). */
const COL_STEP = 480;
const ROW_STEP = 492;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** `2025-09-13(Mon)  ㅣ  06:00` — 앱 상단과 같은 형식. */
function formatDateTime(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}(${WEEKDAYS[d.getDay()]})  ㅣ  ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

type Props = {
  /** 해당 키오스크의 전체 버튼(이름에만 쓴다 — 좌표는 쓰지 않는다). */
  buttons: KioskButtonDto[];
  /** buttonType → 기간 집계 */
  stats: ButtonStatMap;
};

export function JejuAirportStatsMirror({ buttons, stats }: Props) {
  const find = (slot: string): KioskButtonDto | null => buttons.find((b) => b.buttonName === PREFIX + slot) ?? null;
  const statOf = (b: KioskButtonDto | null): ButtonStat => (b ? stats.get(b.buttonType) : undefined) ?? ZERO;
  const maxClicks = Math.max(0, ...[...stats.values()].map((v) => v.clicks));
  const badgeOf = (stat: ButtonStat) => <ButtonStatBadge stat={stat} max={maxClicks} unit='cq' />;
  const badge = (b: KioskButtonDto | null) => badgeOf(statOf(b));
  const missingCls = (b: KioskButtonDto | null) => (b ? '' : styles.missing);
  const tip = (b: KioskButtonDto | null, label: string) => (b ? b.buttonType : `${label} · 등록된 버튼 없음`);
  const img = (name: string, cls?: string): ReactNode => {
    const src = reportHomeArt('jeju', name);
    return src ? <img src={src} alt='' className={cls} draggable={false} /> : null;
  };

  const home = find(FIXED.home);
  const search = find(FIXED.search);
  const lang = find(FIXED.language);
  const camera = find(FIXED.camera);
  const restroom = find(FIXED.restroom);
  const fillmeStat = stats.get(FILLME_TYPE) ?? ZERO;
  const bg = reportHomeArt('jeju', 'bg');

  return (
    <div className={styles.scaleWrap} style={{ width: TARGET_WIDTH, height: Math.round(3840 * SCALE) }}>
      <div className={styles.board} style={{ transform: `scale(${SCALE})` } as CSSProperties}>
        {bg ? <img src={bg} alt='' className={styles.bgImage} draggable={false} /> : null}

        {/* ── 위치 · 날짜 — x84 y125 ── */}
        <header className={styles.topBar}>
          <span className={styles.topLeft}>
            {img('ico-location', styles.locationIcon)}
            <span className={styles.siteName}>JEJU</span>
          </span>
          <span className={styles.dateTime}>{formatDateTime(new Date())}</span>
        </header>

        {/* ── 공지 + 날씨 — x80 y297 2000×750. 날씨는 W008 에 버튼 행이 없다(표시 전용) ── */}
        <div className={styles.notice}>
          <div className={styles.noticeLead}>
            <span className={styles.noticeRule} />
            <p className={styles.noticeText}>
              <b>키오스크 공지 문구</b>가 이 영역에 표시됩니다. 운영 시트에 등록한 <b>이달의 안내</b>가 그대로 나옵니다.
            </p>
          </div>
          <div className={styles.weather} aria-hidden>
            <span className={styles.weatherTemp}>18˚</span>
            {img('weather-sun', styles.weatherIcon)}
          </div>
        </div>

        {/* ── 운항 정보 보드 — x155 y732, 표시 전용 ── */}
        <div className={styles.flightBoard} aria-hidden>
          <span className={styles.flightTitle}>운항 정보</span>
          <span className={styles.flightRule} />
          {FLIGHT_COLUMNS.map(([label, x]) => (
            <span key={label} className={styles.flightCol} style={{ left: x }}>
              <span className={styles.flightHead}>{label}</span>
              <span className={styles.flightValue}>—</span>
            </span>
          ))}
        </div>
        <span className={styles.more} aria-hidden>
          <svg viewBox='0 0 81 51' className={styles.moreArrow}>
            <path d='M0 0h81L40.5 51Z' fill='currentColor' />
          </svg>
          항공편 정보 더보기
        </span>

        {/* ── 검색줄: 홈 · 검색 · 언어선택 — x80 y1136 ── */}
        <div className={styles.searchRow}>
          <span className={`${styles.searchHome} ${missingCls(home)}`} title={tip(home, '홈')}>
            {img('ico-home-search')}
            <span className={styles.liftBadge}>{badge(home)}</span>
          </span>
          <div className={`${styles.searchField} ${missingCls(search)}`} title={tip(search, '검색')}>
            <span className={styles.searchPlaceholder}>제주도에 대해 검색해보세요!</span>
            {img('ico-search', styles.searchIcon)}
            <span className={`${styles.liftBadge} ${styles.liftBadgeSearch}`}>{badge(search)}</span>
          </div>
          <span className={`${styles.langBtn} ${missingCls(lang)}`} title={tip(lang, '언어선택')}>
            KR
            <span className={styles.liftBadge}>{badge(lang)}</span>
          </span>
        </div>

        {/* ── 카드 3장 — x120 y1407 ── */}
        <div className={styles.cards}>
          {CARDS.map((c) => {
            const b = find(c.name);
            return (
              <div key={c.name} className={`${styles.card} ${styles[c.variant]} ${missingCls(b)}`} title={tip(b, c.label)}>
                <span className={styles.cardTitle}>{c.label}</span>
                <span className={styles.cardSub}>{c.sub}</span>
                <span className={styles.cardArt}>{c.art ? img(c.art) : null}</span>
                <span className={styles.cardBadgeAnchor}>{badge(b)}</span>
              </div>
            );
          })}
        </div>

        {/* ── 격자 4×3 — 판 x135 y1772, 칸 x203 y1821 ── */}
        <div className={styles.panel} />
        {GRID.map((g, i) => {
          const b = find(g.name);
          const pos = { left: 203 + (i % 4) * COL_STEP, top: 1821 + Math.floor(i / 4) * ROW_STEP } as CSSProperties;
          return (
            <div
              key={g.name}
              className={`${styles.tile} ${g.comingSoon ? styles.tileComingSoon : ''} ${missingCls(b)}`}
              style={pos}
              title={g.comingSoon ? `${g.label} · 준비중(집계 제외)` : tip(b, g.label)}
            >
              {g.comingSoon || !g.art ? (
                <span className={`${styles.tileArt} ${styles.tilePlateBlank}`} />
              ) : (
                <span className={styles.tileArt}>{img(g.art)}</span>
              )}
              <span className={styles.tileText}>
                {/* 앱은 '준비중' 칸에 버튼 이름 대신 '준비중'만 쓴다 — 리포트는 어느 버튼인지 보이게 이름을 함께 둔다. */}
                <span className={styles.tileTitle}>{g.comingSoon ? `${g.label}(준비중)` : g.label}</span>
                {g.comingSoon ? null : <span className={styles.tileSub}>{g.sub}</span>}
              </span>
              {g.comingSoon ? null : badge(b)}
            </div>
          );
        })}

        {/* ── 왼쪽 떠 있는 내비(홈·뒤로) + 교통약자 — 표시 전용 ── */}
        <span className={styles.leftNav} aria-hidden>
          {img('nav-left')}
        </span>
        <span className={styles.accessibility} aria-hidden>
          {img('ico-accessibility')}
        </span>

        {/* ── 하단 3: 필미(스마트 헬스케어) · 사진촬영 · 화장실 ── */}
        <div className={styles.fillme} title={FILLME_TYPE}>
          {img('btn-fillme')}
          <span className={styles.liftBadge}>{badgeOf(fillmeStat)}</span>
        </div>
        <span className={`${styles.actionLabel} ${styles.labelFillme}`}>스마트 헬스케어</span>
        <div className={`${styles.camera} ${missingCls(camera)}`} title={tip(camera, '사진촬영')}>
          {img('btn-camera', styles.round)}
          {badge(camera)}
        </div>
        <div className={`${styles.restroom} ${missingCls(restroom)}`} title={tip(restroom, '화장실')}>
          {img('ico-restroom', styles.round)}
          <span className={styles.liftBadge}>{badge(restroom)}</span>
        </div>
        <span className={`${styles.actionLabel} ${styles.labelRestroom}`}>화장실</span>
      </div>
    </div>
  );
}
