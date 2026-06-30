import { useQuery } from '@tanstack/react-query';

/** App type / category as returned by backend (replace queryFn with real API). */
export type KioskAppTypeDto = {
  id: string;
  name: string;
  code?: string;
};

/** Used until the query resolves; keep in sync with `MOCK_TYPES`. */
export const KIOSK_APP_TYPES_FALLBACK: KioskAppTypeDto[] = [
  { id: 't-map', name: '지도', code: 'MAP' },
  { id: 't-shop', name: '쇼핑', code: 'SHOP' },
  { id: 't-food', name: '맛집', code: 'RESTAURANT' },
  { id: 't-info', name: '안내', code: 'INFO' },
  { id: 't-transit', name: '교통', code: 'TRANSIT' },
  { id: 't-service', name: '서비스', code: 'SERVICE' },
  { id: 't-culture', name: '문화', code: 'CULTURE' },
  { id: 't-family', name: '가족', code: 'FAMILY' },
];

const MOCK_TYPES = KIOSK_APP_TYPES_FALLBACK;

/**
 * Fetches kiosk app types for dropdowns. Wire to e.g. GET /api/admin/kiosk-app-types.
 */
export function useKioskAppTypes() {
  return useQuery({
    queryKey: ['kiosk-app-types'],
    queryFn: async (): Promise<KioskAppTypeDto[]> => {
      // Simulate network; swap for: (await APIService.private.get('/admin/kiosk-app-types')).data
      await new Promise((r) => setTimeout(r, 120));
      return MOCK_TYPES;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getTypeLabel(types: KioskAppTypeDto[] | undefined, typeId: string): string {
  return types?.find((t) => t.id === typeId)?.name ?? typeId;
}
