import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * 촬영 통계의 촬영 주체 — admin-be `/api/admin/stats/*` 의 `channel` 쿼리.
 * KIOSK 키오스크만(서버 기본) · APP WITS 앱만 · ALL 둘의 합.
 */
export type StatsChannel = 'KIOSK' | 'APP' | 'ALL';

export const STATS_CHANNELS: { id: StatsChannel; label: string; hint: string }[] = [
  { id: 'KIOSK', label: '키오스크', hint: '키오스크에서 찍은 촬영만' },
  { id: 'APP', label: 'WITS 앱', hint: '모바일 WITS 앱에서 찍은 촬영만' },
  { id: 'ALL', label: '전체', hint: '키오스크 + WITS 앱 합계' },
];

export function statsChannelLabel(channel: StatsChannel): string {
  return STATS_CHANNELS.find((c) => c.id === channel)?.label ?? channel;
}

type StatsChannelState = {
  channel: StatsChannel;
  setChannel: (channel: StatsChannel) => void;
};

/**
 * 대시보드·상세 분석 리포트·통계 리포트가 같은 값을 쓴다(한 곳에서 바꾸면 다른 화면도 같은 주체로 본다).
 * 탭을 닫으면 키오스크로 돌아간다 — 기존 숫자에 익숙한 사용자가 다음 접속에 앱 숫자를 보고 놀라지 않게.
 */
export const useStatsChannelStore = create<StatsChannelState>()(
  persist(
    (set) => ({
      channel: 'KIOSK',
      setChannel: (channel) => set({ channel }),
    }),
    {
      name: 'admin-stats-channel',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export const useStatsChannel = (): StatsChannel => useStatsChannelStore((s) => s.channel);

/** 훅 밖(엑셀 추출 등)에서 현재 값을 읽는다. */
export const getStatsChannel = (): StatsChannel => useStatsChannelStore.getState().channel;
