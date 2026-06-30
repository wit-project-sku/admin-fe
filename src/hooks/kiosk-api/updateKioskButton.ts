import { APIService } from '@/utils/axios';
import type {
  UpdateKioskButtonApiResponse,
  UpdateKioskButtonPayload,
} from './kioskButtonsTypes';

/** `PUT /admin/kiosks/button/{buttonId}` */
export async function updateKioskButton(
  buttonId: number,
  payload: UpdateKioskButtonPayload,
): Promise<UpdateKioskButtonApiResponse> {
  const res = await APIService.private.put<UpdateKioskButtonApiResponse>(
    `/admin/kiosks/button/${buttonId}`,
    payload,
  );
  return res.data;
}
