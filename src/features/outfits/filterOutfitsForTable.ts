import type { OutfitRow } from './outfitListMappers';

export type { OutfitRow } from './outfitListMappers';

export function filterOutfitsForTable(outfits: OutfitRow[], filterKey: string, search: string): OutfitRow[] {
  const kw = search.trim().toLowerCase();
  return outfits.filter((o) => {
    const matchesFilter = filterKey === 'ALL' || o.status === filterKey;
    const matchesSearch =
      !kw ||
      o.outfitCode.toLowerCase().includes(kw) ||
      o.name.toLowerCase().includes(kw) ||
      o.categoryName.toLowerCase().includes(kw) ||
      o.displayName.toLowerCase().includes(kw);
    return matchesFilter && matchesSearch;
  });
}
