import { APIService } from './axios';

export const loginAdmin = async (payload) => {
  try {
    const res = await APIService.public.post('/auths/login', payload);
    return res;
  } catch (err) {
    console.error('관리자 로그인 실패:', err);
    throw err;
  }
};
