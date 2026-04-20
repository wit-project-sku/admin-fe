import { APIService } from '@/utils/axios';
import type { CreateKioskButtonApiResponse, CreateKioskButtonPayload } from './kioskButtonsTypes';

/** `POST /admin/kiosks/button` */
export async function createKioskButton(
  payload: CreateKioskButtonPayload,
): Promise<CreateKioskButtonApiResponse> {
  const res = await APIService.private.post<CreateKioskButtonApiResponse>('/admin/kiosks/button', payload);
  return res.data;
}
