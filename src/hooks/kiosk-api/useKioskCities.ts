import { useQuery } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';

export type KioskCitiesApiResponse = {
  success: boolean;
  code: number;
  message: string;
  data: string[];
};

/**
 * City labels for kiosk filters. `GET /admin/kiosks/cities`
 */
export function useKioskCities(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-kiosk-cities'],
    queryFn: async () => {
      const res = await APIService.private.get<KioskCitiesApiResponse>('/admin/kiosks/cities');
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000,
  });
}
