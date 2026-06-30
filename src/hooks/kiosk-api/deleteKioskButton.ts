import { APIService } from '@/utils/axios';
import type { DeleteKioskButtonApiResponse } from './kioskButtonsTypes';

/** `DELETE /admin/kiosks/button/{buttonId}` */
export async function deleteKioskButton(buttonId: number): Promise<DeleteKioskButtonApiResponse> {
  const res = await APIService.private.delete<DeleteKioskButtonApiResponse>(`/admin/kiosks/button/${buttonId}`);
  return res;
}
