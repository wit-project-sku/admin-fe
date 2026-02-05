import { APIService } from './axios';

export const getCategories = async () => {
  try {
    const res = await APIService.public.get('/categories');
    return res.data;
  } catch (err) {
    console.error('카테고리 조회 실패:', err);
    throw err;
  }
};
