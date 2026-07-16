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
  // APIService.private 는 이미 응답 body(envelope)로 언래핑한다 → res 자체가 {success,code,message,data}.
  const res = await APIService.private.put<UpdateKioskButtonApiResponse>(
    `/admin/kiosks/button/${buttonId}`,
    payload,
  );
  return res;
}
