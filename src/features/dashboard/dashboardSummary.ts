export type KioskCountRow = { kioskId: string | number; kioskName: string; count: number };

export type ShootingSummary = {
  todayTotal?: number;
  monthlyTotal?: number;
  grandTotal?: number;
  todayByKiosk?: KioskCountRow[];
  monthlyByKiosk?: KioskCountRow[];
};

/** Normalizes `/admin/stats/summary`-style payloads (raw or `{ data }`). */
export function parseShootingSummaryPayload(raw: unknown): ShootingSummary | null {
  const inner = (raw as { data?: unknown } | null | undefined)?.data ?? raw;
  if (inner == null || typeof inner !== 'object') return null;
  return inner as ShootingSummary;
}
