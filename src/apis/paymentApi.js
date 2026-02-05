import { APIService } from './axios';

// [관리자] 결제 내역 페이지 조회
export const getPaymentsAdmin = async (pageNum = 1, pageSize = 7) => {
  try {
    const res = await APIService.private.get('/payments/admin', {
      params: { pageNum, pageSize },
    });
    return res;
  } catch (err) {
    console.error('결제 내역 페이지 조회 실패:', err);
    throw err;
  }
};
