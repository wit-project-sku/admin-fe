// 지점별 상세 — 키오스크 홈 화면을 '실제 배치 그대로' 그리고 버튼마다 기간 통계를 얹는다.
// 레이아웃은 아이콘 등록 관리의 실사 미러를 그대로 재사용한다(레이아웃 진실의 원천을 하나로 유지).
// 단, 인사동 1·2·3 은 앱이 서버 좌표 없이 고정 리뉴얼 화면을 그리므로 리포트 전용 리뉴얼 미러를 쓴다.
// 표를 대체하는 화면이므로 선택(onSelect)을 넘기지 않아 읽기 전용으로만 쓴다.
import { KioskMirrorGridApp, INSADONG_SKIN, OSAN_SKIN } from '@/features/kiosk/manage/KioskMirrorGridApp';
import { KioskMirrorHwaseong } from '@/features/kiosk/manage/KioskMirrorHwaseong';
import { InsadongRenewalStatsMirror, INSADONG_RENEWAL_KIOSK_IDS } from './InsadongRenewalStatsMirror';
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
  // 인사동 리뉴얼(1·2·3)은 DB line/position 이 아니라 앱의 고정 배치로 그린다.
  const renewalKioskId = kioskId != null && INSADONG_RENEWAL_KIOSK_IDS.has(kioskId) ? kioskId : null;

  return (
    <div className={s.mirrorWrap}>
      <p className={s.mirrorCaption}>
        버튼 위 숫자 = 기간 내 <b>클릭 수</b> · 파란 굵은 글씨가 최다 클릭
      </p>
      <div className={s.mirrorBoard}>
        {renewalKioskId != null ? (
          <InsadongRenewalStatsMirror kioskId={renewalKioskId} buttons={buttons} stats={stats} />
        ) : isHwaseong ? (
          <KioskMirrorHwaseong buttons={buttons} stats={stats} hideBanner />
        ) : (
          <KioskMirrorGridApp
            buttons={buttons}
            skin={isOsan ? OSAN_SKIN : INSADONG_SKIN}
            stats={stats}
            hideBanner
          />
        )}
      </div>
    </div>
  );
}
