import { APIService } from './axios';

// [관리자] 환불 상세 조회 (GET /api/refunds/admin/{refund-id})
export const getRefundByIdAdmin = async (refundId) => {
  try {
    const res = await APIService.private.get(`/refunds/admin/${refundId}`);
    return res;
  } catch (err) {
    console.error('환불 상세 조회(관리자) 실패:', err);
    throw err;
  }
};

// [관리자] 환불 내역 페이지 조회 (GET /api/refunds/admin?pageNum=&pageSize=)
export const getAllRefundsAdmin = async (pageNum = 1, pageSize = 7) => {
  try {
    const res = await APIService.private.get('/refunds/admin', {
      params: { pageNum, pageSize },
    });
    return res;
  } catch (err) {
    console.error('환불 내역 페이지 조회(관리자) 실패:', err);
    throw err;
  }
};
