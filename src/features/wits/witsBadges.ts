// 상태 → 배지 색(shared.module.css). 세 화면이 같은 색 규칙을 쓴다: 예정·예약=파랑, 진행·노출·발송=초록, 끝=회색.
import shared from '@commons/shared.module.css';

import type { WitsEventStatus, WitsNotificationStatus } from '@/hooks/wits-api/witsTypes';
import type { AdStatus } from '@/hooks/ad-api/adTypes';

export const WITS_EVENT_STATUS_BADGE: Record<WitsEventStatus, string> = {
  SCHEDULED: shared.badgeBlue,
  ONGOING: shared.badgeGreen,
  ENDED: shared.badgeGray,
};

export const WITS_NOTIFICATION_STATUS_BADGE: Record<WitsNotificationStatus, string> = {
  SCHEDULED: shared.badgeBlue,
  SENT: shared.badgeGreen,
  CANCELED: shared.badgeGray,
};

export const AD_STATUS_BADGE: Record<AdStatus, string> = {
  SCHEDULED: shared.badgeBlue,
  ACTIVE: shared.badgeGreen,
  EXPIRED: shared.badgeGray,
  PAUSED: shared.badgeAmber,
};
