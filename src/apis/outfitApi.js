import { APIService } from './axios';

// 전체 의상 목록 조회 (페이징)
export const getAllOutfits = async (page, size) => {
  try {
    const res = await APIService.admin.get('/outfits', {
      params: { page, size },
    });
    return res.data;
  } catch (err) {
    console.error('의상 목록 조회 실패:', err);
    throw err;
  }
};

// 의상 상세 정보 조회
export const getOutfitDetail = async (id) => {
  try {
    const res = await APIService.admin.get(`/outfits/${id}`);
    return res.data;
  } catch (err) {
    console.error('의상 상세 조회 실패:', err);
    throw err;
  }
};

// 신규 의상 등록
export const createOutfit = async (formData, images) => {
  try {
    const data = new FormData();
    // 데이터 필드 추가
    data.append('outfit', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
    // 이미지 파일 추가
    if (images && images.length > 0) {
      images.forEach((img) => data.append('images', img));
    }

    const res = await APIService.admin.post('/outfits', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    console.error('의상 등록 실패:', err);
    throw err;
  }
};

// 의상 정보 수정
export const updateOutfit = async (id, formData, images) => {
  try {
    const data = new FormData();
    data.append('outfit', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
    if (images && images.length > 0) {
      images.forEach((img) => data.append('images', img));
    }

    const res = await APIService.admin.put(`/outfits/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    console.error('의상 수정 실패:', err);
    throw err;
  }
};

// 의상 삭제
export const deleteOutfit = async (id) => {
  try {
    const res = await APIService.admin.delete(`/outfits/${id}`);
    return res.data;
  } catch (err) {
    console.error('의상 삭제 실패:', err);
    throw err;
  }
};
