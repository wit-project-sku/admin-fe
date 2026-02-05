import { APIService } from './axios';

const buildProductMultipart = (data, images) => {
  const formData = new FormData();

  // Spring @RequestPart("data") expects JSON
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  // Spring @RequestPart("images") expects multiple files
  if (Array.isArray(images)) {
    images.filter(Boolean).forEach((file) => {
      formData.append('images', file);
    });
  }

  return formData;
};

export const getProductDetail = async (productId) => {
  try {
    const res = await APIService.public.get(`/products/${productId}`);
    return res;
  } catch (err) {
    console.error('상품 상세 조회 실패:', err);
    throw err;
  }
};

export const getAllProducts = async (pageNum = 1, pageSize = 6, productStatus) => {
  try {
    const params = {
      pageNum,
      pageSize,
    };

    // status가 없으면 전체 조회, 있으면 해당 status만 필터링
    if (productStatus) {
      params.productStatus = productStatus;
    }

    // 관리자 API는 보통 인증이 필요하므로 private 인스턴스를 사용
    const res = await APIService.private.get(`/admin/products`, { params });
    return res;
  } catch (err) {
    console.error('상품 전체 조회 실패:', err);
    throw err;
  }
};

// [관리자] 상품 생성 (POST /api/admin/products/categories/{category-id})
export const createProduct = async (categoryId, productRequest, images = []) => {
  try {
    const formData = buildProductMultipart(productRequest, images);
    const res = await APIService.private.post(`/admin/products/categories/${categoryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res;
  } catch (err) {
    console.error('상품 생성 실패:', err);
    throw err;
  }
};

// [관리자] 상품 수정 (PUT /api/admin/products/{product-id})
export const updateProduct = async (productId, productRequest, images) => {
  try {
    const formData = buildProductMultipart(productRequest, images);
    const res = await APIService.private.put(`/admin/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res;
  } catch (err) {
    console.error('상품 수정 실패:', err);
    throw err;
  }
};

// [관리자] 상품 삭제(hard delete) (DELETE /api/admin/products/{product-id}/hard)
export const hardDeleteProduct = async (productId) => {
  try {
    const res = await APIService.private.delete(`/admin/products/${productId}/hard`);
    return res;
  } catch (err) {
    console.error('상품 hard 삭제 실패:', err);
    throw err;
  }
};
