import { APIService } from './axios';

// [관리자] 특정 배송 내역 조회 (GET /api/deliveries/admin/{delivery-id})
export const fetchDeliveryByIdAdmin = async (deliveryId) => {
  try {
    const res = await APIService.private.get(`/deliveries/admin/${deliveryId}`);
    return res;
  } catch (err) {
    console.error('배송 내역(관리자) 조회 실패:', err);
    throw err;
  }
};

// [관리자] 배송 내역 페이지 조회 (GET /api/deliveries/admin?pageNum=&pageSize=)
export const fetchAllDeliveriesAdmin = async (pageNum = 1, pageSize = 7) => {
  try {
    const res = await APIService.private.get('/deliveries/admin', {
      params: { pageNum, pageSize },
    });
    return res;
  } catch (err) {
    console.error('배송 내역 페이지 조회(관리자) 실패:', err);
    throw err;
  }
};

// [관리자] 특정 배송 정보 수정 (PUT /api/deliveries/admin/{delivery-id})
export const updateDeliveryByAdmin = async (deliveryId, payload) => {
  try {
    const res = await APIService.private.put(`/deliveries/admin/${deliveryId}`, payload);
    return res;
  } catch (err) {
    console.error('배송 정보 수정(관리자) 실패:', err);
    throw err;
  }
};
