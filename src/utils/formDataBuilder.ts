/** Multipart: `data` (JSON) + optional `image` 파트. 캠페인·학교 등록/수정 공용. */
export const buildDataImageMultipart = (
  data: unknown,
  image?: File | null,
  thumbnail?: File | null,
): FormData => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (image) formData.append('image', image);
  if (thumbnail) formData.append('thumbnail', thumbnail);
  return formData;
};

export const buildProductMultipart = (data: unknown, images: (File | Blob | null | undefined)[] | undefined): FormData => {
  const formData = new FormData();

  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  if (Array.isArray(images)) {
    images.filter(Boolean).forEach((file) => {
      if (file) formData.append('images', file);
    });
  }

  return formData;
};

export const buildShopMultipart = (data: unknown, images: (File | Blob | null | undefined)[] | undefined): FormData => {
  const formData = new FormData();

  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  if (Array.isArray(images)) {
    images.filter(Boolean).forEach((file) => {
      if (file) formData.append('images', file);
    });
  }

  return formData;
};
