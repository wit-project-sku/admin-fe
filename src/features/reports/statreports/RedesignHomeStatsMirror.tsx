// 통계 리포트 전용 — 오색시장(키오스크 4)·화성휴게소(키오스크 5)의 2026-10 새 홈 화면 미러.
//
// 키오스크 앱(kiosk-electron OsanHome / HwaseongHome, Figma 7812:106458 · 7904:104580)은 두 지점 모두 같은 틀을
// 고정 배치로 그린다 — 위치·날짜 · 공지/날씨 · 보드(오늘의 상점 / 도로교통상황) · 검색줄 · 카드 3 · 격자 4×3 · 하단 3.
// 서버 line/position 을 쓰지 않으므로(오색은 CMS 에 예전 격자가 남아 있어 앱이 아예 무시한다) DB 좌표로 타일을 까는
// KioskMirrorGridApp / KioskMirrorHwaseong 는 예전 화면이 된다. 여기서는 앱과 같은 좌표로 그리고 칸마다 클릭 수 배지만 얹는다.
//
// - 칸은 DB `button_name`(#W004_아이콘07 …)으로 찾는다. 앱이 같은 슬롯 번호로 터치를 기록하고(buttonCatalog BUTTON_IDS),
//   button_name 은 stage·prod 가 같다 — 표시 이름(button_type)은 stage 에서 두 칸이 바뀌어 있어 조인 키로 쓰지 않는다.
// - 새 화면에서 빠진 버튼은 리포트에서 집계하지 않는다(2026-10-26 사용자 결정) — isOnRedesignHome 이 그 기준이다.
// - 홈 칸에는 배지를 달지 않는다 — 홈은 터치 기록 대상이 아니다(인사동 리뉴얼 미러와 같다).
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
import styles from './RedesignHomeStatsMirror.module.css';

/** 칸 하나 = DB button_name 꼬리(조인 키) + 화면 표기(앱의 한국어 문구). */
type Slot = { name: string; label: string; sub?: string; plate?: string };

type Site = {
  /** button_name 머리 — `#W004_` */
  prefix: string;
  brand: string;
  accent: string;
  /** 카드 3장의 바탕색(왼쪽부터) */
  cardBg: readonly [string, string, string];
  boardTitle: string;
  searchPlaceholder: string;
  promoText: string;
  promoLabel: string;
  cards: readonly [Slot, Slot, Slot];
  grid: readonly Slot[];
};

/** 하단·검색줄·날씨 — 두 지점이 같은 슬롯을 쓴다. */
const FIXED = {
  weather: '메인D',
  home: '아이콘01',
  search: '아이콘02',
  language: '아이콘03',
  promotion: '아이콘19',
  camera: '아이콘20',
  restroom: '아이콘21',
} as const;
/** 홈에는 없지만 사진 촬영 흐름 안의 버튼 — 화면 개편으로 없어진 버튼이 아니라 집계에 남긴다. */
const PHOTO_FLOW = ['혼자찍기', '같이찍기'] as const;

const OSAEK: Site = {
  prefix: '#W004_',
  brand: 'OSAEK MARKET',
  accent: '#1a4d7e',
  cardBg: ['#f5f1ef', '#f3eae3', '#f5efe9'],
  boardTitle: '오늘의 상점',
  searchPlaceholder: '오색시장에 대해 검색해보세요!',
  promoText: 'K-DRAMA',
  promoLabel: '프로모션(준비중)',
  cards: [
    { name: '아이콘04', label: "'정이' 뭐하지", sub: 'AI 검색하기' },
    { name: '아이콘05', label: '위드마켓', sub: '굿즈 만들기' },
    { name: '아이콘06', label: '오산시 이벤트', sub: '오산시 행사' },
  ],
  // 앱 TILES 의 읽기 순서. #W004_아이콘17(전국 시장)은 새 화면에 없다.
  grid: [
    { name: '아이콘07', label: "'정이' 뭐먹지", sub: '맛집 추천' },
    { name: '아이콘08', label: "'정이' 뭐사지(식품)", sub: '쇼핑 추천' },
    { name: '아이콘09', label: "'정이' 뭐사지(물품)", sub: '물품 추천' },
    { name: '아이콘10', label: 'TAX-FREE', sub: '면세혜택' },
    { name: '아이콘11', label: '여기는 오색시장', sub: '관광지 추천' },
    { name: '아이콘12', label: "안녕 '정이'", sub: "'정이' 소개" },
    { name: '아이콘13', label: "도와줘 '정이'", sub: '편의시설 안내' },
    { name: '아이콘14', label: '오색시장 지도', sub: '지도' },
    { name: '아이콘15', label: '환율', sub: '환율 계산기' },
    { name: '아이콘22', label: '기부', sub: '교복 기부' },
    { name: '아이콘16', label: '교통안내', sub: '대중교통 안내' },
    { name: '아이콘18', label: '지역화폐', sub: '오색전·온누리' },
  ],
};

const HWASEONG: Site = {
  prefix: '#W005_',
  brand: 'HWASEONG S/A',
  accent: '#005ab4',
  cardBg: ['#ffffff', '#ffffff', '#ffffff'],
  boardTitle: '도로교통상황',
  searchPlaceholder: '화성휴게소에 대해 검색해보세요!',
  promoText: '스마트관광',
  promoLabel: '스마트관광(준비중)',
  cards: [
    { name: '아이콘04', label: '전국도로교통상황', sub: '실시간 교통정보' },
    { name: '아이콘05', label: '전국휴게소', sub: '휴게소 정보' },
    { name: '아이콘06', label: '화성시 이벤트', sub: '화성시 행사' },
  ],
  // 앱 TILES 의 읽기 순서와 칸 색. #W005_아이콘14(화성휴게소 지도)는 새 화면에 없다.
  grid: [
    { name: '아이콘07', label: "'휴' 뭐먹지", sub: '맛집 추천', plate: '#fff0cb' },
    { name: '아이콘08', label: "'휴' 뭐사지(물품)", sub: '물품 추천', plate: '#e5f2fc' },
    { name: '아이콘09', label: '전국시장', sub: '쇼핑 추천', plate: '#ffe1fd' },
    { name: '아이콘10', label: 'TAX-FREE', sub: '면세혜택', plate: '#efefef' },
    { name: '아이콘11', label: '화성휴게소', sub: '관광지 추천', plate: '#deffbc' },
    { name: '아이콘12', label: "안녕 '휴'", sub: "'휴' 소개", plate: '#ffe1e4' },
    { name: '아이콘13', label: "도와줘 '휴'", sub: '편의시설 안내', plate: '#ede4ff' },
    { name: '아이콘15', label: '환율', sub: '환율 계산기', plate: '#ffefd9' },
    { name: '아이콘16', label: '문화재(준비중)', sub: '문화유산 안내', plate: '#d3b7a5' },
    { name: '아이콘22', label: '기부', sub: '교복 기부', plate: '#e5f7f4' },
    { name: '아이콘17', label: 'K-컬처(준비중)', sub: '한류 문화 체험', plate: '#fff5bb' },
    { name: '아이콘18', label: '지역화폐', sub: '행복화성지역화폐', plate: '#f2ede6' },
  ],
};

/** 새 홈을 그리는 지점 — 아이콘 등록 관리 미러와 같은 판정(id 또는 이름). */
export function redesignSiteOf(kioskId?: number, kioskName = ''): Site | null {
  if (kioskId === 4 || kioskName.includes('오색') || kioskName.includes('오산')) return OSAEK;
  if (kioskId === 5 || kioskName.includes('화성') || kioskName.includes('휴게소')) return HWASEONG;
  return null;
}

const onScreenNames = new Map<Site, ReadonlySet<string>>(
  [OSAEK, HWASEONG].map((site) => [
    site,
    new Set(
      [...Object.values(FIXED), ...site.cards.map((c) => c.name), ...site.grid.map((g) => g.name), ...PHOTO_FLOW].map(
        (n) => site.prefix + n,
      ),
    ),
  ]),
);

/**
 * 이 버튼이 새 홈 화면(+촬영 흐름)에 있는가 — 없으면 리포트 집계에서 뺀다.
 * 행에 button_name 이 없으면(예전 이름으로 쌓인 기록) 등록 버튼 목록에서 같은 이름의 버튼을 찾아 판정한다.
 */
export function isOnRedesignHome(
  site: Site,
  row: { buttonName?: string | null; buttonType: string },
  buttons: readonly KioskButtonDto[],
): boolean {
  const name = row.buttonName ?? buttons.find((b) => (b.buttonType ?? '').trim() === row.buttonType.trim())?.buttonName;
  return !!name && (onScreenNames.get(site)?.has(name) ?? false);
}

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
  site: Site;
  /** 해당 키오스크의 전체 버튼(이름·이미지·아이콘 키에만 쓴다 — 좌표는 쓰지 않는다). */
  buttons: KioskButtonDto[];
  /** buttonType → 기간 집계 */
  stats: ButtonStatMap;
};

export function RedesignHomeStatsMirror({ site, buttons, stats }: Props) {
  const find = (slot: string): KioskButtonDto | null =>
    buttons.find((b) => b.buttonName === site.prefix + slot) ?? null;
  const statOf = (b: KioskButtonDto | null): ButtonStat => (b ? stats.get(b.buttonType) : undefined) ?? ZERO;
  const maxClicks = Math.max(0, ...[...stats.values()].map((v) => v.clicks));
  const badge = (b: KioskButtonDto | null) => <ButtonStatBadge stat={statOf(b)} max={maxClicks} unit='cq' />;
  const missingCls = (b: KioskButtonDto | null) => (b ? '' : styles.missing);
  const tip = (b: KioskButtonDto | null, label: string) => (b ? b.buttonType : `${label} · 등록된 버튼 없음`);

  /** 버튼 이미지(DB) → 아이콘 키 글리프 → (버튼 없음) 이름. */
  const art = (b: KioskButtonDto | null, label: string, glyphSize: number, plate?: string): ReactNode => {
    if (b?.imageUrl) return <img src={b.imageUrl} alt='' draggable={false} />;
    if (b) {
      return (
        <span className={styles.glyphPlate} style={{ background: plate ?? tileBgFor(b.id) }}>
          <KioskAppIconGlyph iconKey={resolveKioskButtonIconKey(b.iconKey)} size={glyphSize} />
        </span>
      );
    }
    return <span className={styles.missingPlate}>{label}</span>;
  };

  const weather = find(FIXED.weather);
  const home = find(FIXED.home);
  const search = find(FIXED.search);
  const lang = find(FIXED.language);
  const promo = find(FIXED.promotion);
  const camera = find(FIXED.camera);
  const restroom = find(FIXED.restroom);

  const boardStyle = { transform: `scale(${SCALE})`, '--accent': site.accent } as CSSProperties;

  return (
    <div className={styles.scaleWrap} style={{ width: TARGET_WIDTH, height: Math.round(3840 * SCALE) }}>
      <div className={styles.board} style={boardStyle}>
        {/* ── 위치 · 날짜 — x84 y125 ── */}
        <header className={styles.topBar}>
          <span className={styles.brand}>
            <svg className={styles.pin} viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z' />
            </svg>
            {site.brand}
          </span>
          <span className={styles.date}>{formatDateTime(new Date())}</span>
        </header>

        {/* ── 공지 + 날씨 — x80 y297 2000×750 ── */}
        <div className={styles.notice}>
          <span className={styles.noticeRule} />
          <p className={styles.noticeText}>공지 문구가 이 영역에 표시됩니다. (표시 전용)</p>
          <div className={`${styles.weather} ${missingCls(weather)}`} title={tip(weather, '날씨')}>
            <span className={styles.temp}>18°</span>
            <span className={styles.weatherEmoji}>⛅</span>
            {badge(weather)}
          </div>
        </div>

        {/* ── 보드(오늘의 상점 / 도로교통상황) — 표시 전용. 화성 보드 터치는 카드 1(도로 교통상황)로 기록된다 ── */}
        <div className={styles.infoBoard} aria-hidden>
          <span className={styles.infoBoardTitle}>{site.boardTitle}</span>
          <span className={styles.infoBoardRule} />
        </div>

        {/* ── 검색줄: 홈 · 검색 · 언어선택 — x80 y1136 ── */}
        <div className={styles.searchRow}>
          <span className={`${styles.homeBtn} ${missingCls(home)}`} title={tip(home, '홈')}>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinejoin='round'>
              <path d='M3 11 12 3l9 8' />
              <path d='M5 9.5V21h5v-6h4v6h5V9.5' />
            </svg>
          </span>
          <div className={`${styles.searchField} ${missingCls(search)}`} title={tip(search, '검색')}>
            <span className={styles.placeholder}>{site.searchPlaceholder}</span>
            <svg className={styles.searchIcon} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round'>
              <circle cx='11' cy='11' r='7' />
              <path d='m20 20-3.5-3.5' />
            </svg>
            <span className={`${styles.liftBadge} ${styles.liftBadgeSearch}`}>{badge(search)}</span>
          </div>
          <span className={`${styles.langBtn} ${missingCls(lang)}`} title={tip(lang, '언어선택')}>
            KR
            <span className={styles.liftBadge}>{badge(lang)}</span>
          </span>
        </div>

        {/* ── 카드 3장 — x120 y1407 ── */}
        <div className={styles.cards}>
          {site.cards.map((c, i) => {
            const b = find(c.name);
            return (
              <div
                key={c.name}
                className={`${styles.card} ${styles[`card${i}`]} ${missingCls(b)}`}
                style={{ background: site.cardBg[i] }}
                title={tip(b, c.label)}
              >
                <span className={styles.cardCopy}>
                  <span className={styles.cardTitle}>{c.label}</span>
                  <span className={styles.cardSub}>{c.sub}</span>
                </span>
                <span className={styles.cardArt}>{art(b, c.label, 140)}</span>
                {badge(b)}
              </div>
            );
          })}
        </div>

        {/* ── 격자 4×3 — 판 x135 y1772, 칸 x203 y1821 ── */}
        <div className={styles.panel} />
        {site.grid.map((g, i) => {
          const b = find(g.name);
          const pos = { left: 203 + (i % 4) * COL_STEP, top: 1821 + Math.floor(i / 4) * ROW_STEP } as CSSProperties;
          return (
            <div key={g.name} className={`${styles.tile} ${missingCls(b)}`} style={pos} title={tip(b, g.label)}>
              <span className={styles.tileArt}>{art(b, g.label, 170, g.plate)}</span>
              <span className={styles.tileText}>
                <span className={styles.tileTitle}>{g.label}</span>
                <span className={styles.tileSub}>{g.sub}</span>
              </span>
              {badge(b)}
            </div>
          );
        })}

        {/* ── 하단 3: 프로모션/스마트관광 · 사진촬영 · 화장실 ── */}
        <div className={`${styles.promo} ${missingCls(promo)}`} title={tip(promo, site.promoLabel)}>
          <span className={styles.promoText}>{site.promoText}</span>
          <span className={styles.liftBadge}>{badge(promo)}</span>
        </div>
        <span className={`${styles.actionLabel} ${styles.labelPromo}`}>{site.promoLabel}</span>
        <div className={`${styles.camera} ${missingCls(camera)}`} title={tip(camera, '사진촬영')}>
          <span className={styles.cameraCircle}>
            {camera?.imageUrl ? (
              <img src={camera.imageUrl} alt='' draggable={false} />
            ) : (
              <svg viewBox='0 0 24 24' fill='currentColor'>
                <path d='M9 4 7.5 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.5L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z' />
              </svg>
            )}
          </span>
          {badge(camera)}
        </div>
        <div className={`${styles.restroom} ${missingCls(restroom)}`} title={tip(restroom, '화장실')}>
          <span className={styles.restroomCircle}>
            {restroom?.imageUrl ? <img src={restroom.imageUrl} alt='' draggable={false} /> : '🚻'}
          </span>
          <span className={styles.liftBadge}>{badge(restroom)}</span>
        </div>
        <span className={`${styles.actionLabel} ${styles.labelRestroom}`}>화장실</span>
      </div>
    </div>
  );
}
