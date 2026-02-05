import { APIService } from './axios';

export const getKiosks = async () => {
  try {
    const res = await APIService.private.get('/admin/kiosks');
    return res.data;
  } catch (err) {
    console.error('카테고리 조회 실패:', err);
    throw err;
  }
};
