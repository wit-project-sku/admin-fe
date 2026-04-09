import type { ProductStatus } from '../../hooks/product-api/productApiTypes';

function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

const STATUS_SET = new Set<string>(['ON_SALE', 'SOLD_OUT', 'HIDDEN']);

function normalizeListStatus(raw: unknown): ProductStatus {
  if (typeof raw === 'string' && STATUS_SET.has(raw)) return raw as ProductStatus;
  return 'ON_SALE';
}

export type ProductRow = {
  id: number | string;
  name: string;
  subTitle?: string;
  images?: { imageUrl?: string }[];
  categoryName?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
};

export function mapProductListItemToRow(raw: unknown): ProductRow {
  if (raw == null || typeof raw !== 'object') {
    return {
      id: '',
      name: '-',
      categoryName: '-',
      price: 0,
      stock: 0,
      status: 'HIDDEN',
    };
  }
  const o = raw as Record<string, unknown>;
  const id = o.id ?? o.productId ?? '';
  const name = firstStr(o.name, o.title, o.productName) || '-';
  const subTitle = firstStr(o.subTitle, o.sub_title);
  const cat = o.category as Record<string, unknown> | undefined;
  const categoryName = firstStr(cat?.name, o.categoryName, o.category_name) || '-';

  let images: { imageUrl?: string }[] | undefined;
  const rawImages = o.images;
  if (Array.isArray(rawImages)) {
    images = rawImages.map((item) => {
      if (!item || typeof item !== 'object') return {};
      const im = item as Record<string, unknown>;
      const u = im.imageUrl ?? im.url ?? im.image_url;
      return { imageUrl: typeof u === 'string' ? u : undefined };
    });
  }

  const topImg = o.imageUrl ?? o.image_url;
  if (typeof topImg === 'string' && topImg && (!images || images.length === 0)) {
    images = [{ imageUrl: topImg }];
  }

  const price = Number(o.price ?? o.salePrice ?? 0);
  const stock = Number(o.stock ?? o.quantity ?? 0);
  const status = normalizeListStatus(o.status);

  return {
    id,
    name,
    subTitle: subTitle || undefined,
    images,
    categoryName,
    price: Number.isFinite(price) ? price : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    status,
  };
}
