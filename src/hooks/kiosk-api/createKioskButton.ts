import { APIService } from '@/utils/axios';
import type { CreateKioskButtonApiResponse, CreateKioskButtonPayload } from './kioskButtonsTypes';

/** `POST /admin/kiosks/button` */
export async function createKioskButton(
  payload: CreateKioskButtonPayload,
): Promise<CreateKioskButtonApiResponse> {
  // APIService.private 는 이미 응답 body(envelope)로 언래핑한다 → res 자체가 {success,code,message,data}.
  const res = await APIService.private.post<CreateKioskButtonApiResponse>('/admin/kiosks/button', payload);
  return res;
}
