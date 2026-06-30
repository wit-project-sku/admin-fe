/** JSON inside multipart `data` blob for POST `/admin/products/categories` and PUT `/admin/products/:id`. */
export type ProductStatus = 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN';

export type ProductWriteBody = {
  name: string;
  subTitle: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  categoryId: number;
  kioskIds: number[];
};
