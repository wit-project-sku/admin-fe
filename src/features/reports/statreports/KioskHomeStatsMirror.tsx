// 지점별 상세 — 키오스크 홈 화면을 '실제 배치 그대로' 그리고 버튼마다 기간 통계를 얹는다.
// 레이아웃은 아이콘 등록 관리의 실사 미러를 그대로 재사용한다(레이아웃 진실의 원천을 하나로 유지).
// 표를 대체하는 화면이므로 편집(드래그·선택)은 끄고 읽기 전용으로만 쓴다.
import { KioskMirrorGridApp, INSADONG_SKIN, OSAN_SKIN } from '@/features/kiosk/manage/KioskMirrorGridApp';
import { KioskMirrorHwaseong } from '@/features/kiosk/manage/KioskMirrorHwaseong';
import type { ButtonStat, ButtonStatMap } from '@/features/kiosk/manage/kioskButtonStatOverlay';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import s from './StatReports.module.css';

export type { ButtonStat };

function fmtDur(sec: number): string {
  const v = Math.max(0, Math.round(sec));
  if (v < 60) return `${v}초`;
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/**
 * 홈 화면에 타일로 뜨지 않는 버튼(고정 바·화면 밖)은 미러 마크업이 지점마다 달라 배지를 얹기 어렵다.
 * 대신 미러 아래에 같은 형식의 스트립으로 모아 보여 준다 — 어떤 버튼도 리포트에서 누락되지 않게.
 */
function OtherButtonsStrip({
  title,
  buttons,
  stats,
}: {
  title: string;
  buttons: KioskButtonDto[];
  stats: ButtonStatMap;
}) {
  if (buttons.length === 0) return null;
  return (
    <div className={s.mirrorStrip}>
      <span className={s.mirrorStripTitle}>{title}</span>
      {buttons.map((b) => {
        const st = stats.get(b.buttonType);
        return (
          <span className={s.mirrorStripItem} key={b.id}>
            <b>{b.buttonType}</b>
            <span>{(st?.clicks ?? 0).toLocaleString()}회</span>
            <span className={s.mirrorStripSub}>
              {fmtDur(st?.durationSec ?? 0)} · {Math.round(st?.avgSec ?? 0)}초
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** 지점 하나의 홈 화면 + 통계. buttons 는 해당 키오스크의 전체 버튼(좌표·이미지 포함). */
export function KioskHomeStatsMirror({
  kioskName,
  kioskId,
  buttons,
  stats,
}: {
  kioskName: string;
  kioskId?: number;
  buttons: KioskButtonDto[];
  stats: ButtonStatMap;
}) {
  if (buttons.length === 0) return null;

  // 미러 선택 규칙은 아이콘 등록 관리와 동일하게 맞춘다(레이아웃이 지점마다 다르다).
  const isHwaseong = kioskId === 5 || kioskName.includes('화성') || kioskName.includes('휴게소');
  const isOsan = kioskId === 4 || kioskName.includes('오색') || kioskName.includes('오산');

  const noop = () => {};
  const fixed = buttons.filter((b) => b.placement === 'FIXED');
  const offMain = buttons.filter((b) => b.placement === 'OFF_MAIN');

  return (
    <div className={s.mirrorWrap}>
      <div className={s.mirrorBoard}>
        {isHwaseong ? (
          <KioskMirrorHwaseong buttons={buttons} onMove={noop} disabled stats={stats} />
        ) : (
          <KioskMirrorGridApp
            buttons={buttons}
            skin={isOsan ? OSAN_SKIN : INSADONG_SKIN}
            onMove={noop}
            disabled
            stats={stats}
          />
        )}
      </div>
      <OtherButtonsStrip title="고정 버튼" buttons={fixed} stats={stats} />
      <OtherButtonsStrip title="화면 밖" buttons={offMain} stats={stats} />
    </div>
  );
}
