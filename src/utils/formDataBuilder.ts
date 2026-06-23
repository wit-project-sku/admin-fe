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
