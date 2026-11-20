import { isAxiosError } from 'axios';

/**
 * 서버가 돌려준 거절 메시지(BaseResponse.message)를 그대로 꺼낸다. 없으면 fallback.
 * 400 검증·409 상태 충돌처럼 "왜 안 되는지"를 서버가 말해 주는 경우를 화면에 그대로 보여 주기 위함.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | string | undefined;
    if (typeof body === 'string' && body.trim()) return body;
    const msg = body && typeof body === 'object' ? body.message : undefined;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}
