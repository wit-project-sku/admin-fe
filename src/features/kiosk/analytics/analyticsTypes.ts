import type { KioskButtonStatsDetailRow } from '@/hooks/kiosk-api/kioskButtonStatsTypes';

/** Table row: API `buttonDetails` item + stable `id` for React keys. */
export type KioskAnalyticsTableRow = KioskButtonStatsDetailRow & { id: string };
