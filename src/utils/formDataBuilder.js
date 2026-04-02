export const buildProductMultipart = (data, images) => {
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