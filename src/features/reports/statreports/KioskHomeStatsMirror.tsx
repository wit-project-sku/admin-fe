// 지점별 상세 — 키오스크 홈 화면을 '실제 배치 그대로' 그리고 버튼마다 기간 통계를 얹는다.
// 레이아웃은 아이콘 등록 관리의 실사 미러를 그대로 재사용한다(레이아웃 진실의 원천을 하나로 유지).
// 표를 대체하는 화면이므로 편집(드래그·선택)은 끄고 읽기 전용으로만 쓴다.
import { KioskMirrorGridApp, INSADONG_SKIN, OSAN_SKIN } from '@/features/kiosk/manage/KioskMirrorGridApp';
import { KioskMirrorHwaseong } from '@/features/kiosk/manage/KioskMirrorHwaseong';
import type { ButtonStat, ButtonStatMap } from '@/features/kiosk/manage/kioskButtonStatOverlay';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import s from './StatReports.module.css';

export type { ButtonStat };


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

  return (
    <div className={s.mirrorWrap}>
      <p className={s.mirrorCaption}>
        버튼 위 숫자 = 기간 내 <b>클릭 수</b> · 파란 굵은 글씨가 최다 클릭
      </p>
      <div className={s.mirrorBoard}>
        {isHwaseong ? (
          <KioskMirrorHwaseong buttons={buttons} onMove={noop} disabled stats={stats} hideBanner />
        ) : (
          <KioskMirrorGridApp
            buttons={buttons}
            skin={isOsan ? OSAN_SKIN : INSADONG_SKIN}
            onMove={noop}
            disabled
            stats={stats}
            hideBanner
          />
        )}
      </div>
    </div>
  );
}
