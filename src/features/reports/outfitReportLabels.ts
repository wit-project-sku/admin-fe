import type { OutfitSubmittedFilters } from './reportTypes';

export function outfitContextLabels(
  filters: OutfitSubmittedFilters | null,
  kioskNameById: Record<string, string>,
): { rangeLabel: string; kioskLabel: string } {
  if (!filters) {
    return { rangeLabel: '', kioskLabel: '' };
  }
  const s = filters.start?.trim() ?? '';
  const e = filters.end?.trim() ?? '';
  let rangeLabel: string;
  if (s && e) rangeLabel = `${s} ~ ${e}`;
  else if (s || e) rangeLabel = `${s || '—'} ~ ${e || '—'}`;
  else rangeLabel = '전체 기간';
  const kioskLabel = filters.kioskId
    ? `${kioskNameById[filters.kioskId] ?? '지점'} 기준`
    : '전체 지점 기준';
  return { rangeLabel, kioskLabel };
}
