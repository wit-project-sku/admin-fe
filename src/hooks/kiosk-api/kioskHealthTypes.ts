/**
 * 키오스크 생존 감시 · admin-be `domain/monitor`.
 * 시각은 모두 KST `yyyy-MM-dd HH:mm:ss`, 운영시간은 `HH:mm`.
 */
export type KioskLiveness = 'ONLINE' | 'WAITING' | 'OFFLINE' | 'OUT_OF_HOURS' | 'MAINTENANCE' | 'UNMONITORED';

export type KioskHealthEventType = 'OFFLINE' | 'RECOVERED' | 'MAINTENANCE_ON' | 'MAINTENANCE_OFF';

export type KioskHealthDto = {
  kioskId: number;
  kioskName: string;
  status: KioskLiveness;
  monitored: boolean;
  openTime: string | null;
  closeTime: string | null;
  maintenanceUntil: string | null;
  lastSeenAt: string | null;
  /** 오프라인 알림이 나간 시각. 오프라인 상태가 아니면 null */
  offlineSince: string | null;
};

export type KioskHealthEventDto = {
  kioskId: number;
  kioskName: string | null;
  type: KioskHealthEventType;
  occurredAt: string;
  detail: string | null;
};

export type KioskHealthBoardDto = {
  checkedAt: string;
  thresholdMinutes: number;
  /** 감시 시작·운영 시작·점검 종료 뒤 첫 신호를 기다리는 시간(분). 구버전 서버엔 없다. */
  bootGraceMinutes?: number;
  kiosks: KioskHealthDto[];
  recentEvents: KioskHealthEventDto[];
};

export type KioskHealthSettingsPayload = {
  monitored: boolean;
  openTime: string | null;
  closeTime: string | null;
};
