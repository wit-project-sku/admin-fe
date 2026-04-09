import type { ProductRow } from './productListMappers';

export type { ProductRow } from './productListMappers';

export function filterProductsForTable(products: ProductRow[], filterKey: string, search: string): ProductRow[] {
  const q = search.trim().toLowerCase();
  return products.filter((p) => {
    const matchesFilter = filterKey === 'ALL' || p.status === filterKey;
    const matchesSearch = !q || p.name.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });
}
