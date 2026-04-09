import {
  assignShotRanks,
  downloadOutfitCsv,
  getOutfitDisplayCode,
  getOutfitTotalShots,
  sortOutfitsByNumber,
  sortOutfitsByPopular,
} from '../../utils/outfitReportUtils';
import type { OutfitSubmittedFilters } from './reportTypes';

function csvSuffix(filters: OutfitSubmittedFilters | null): string {
  if (!filters) return '조회';
  const s = filters.start?.trim();
  const e = filters.end?.trim();
  return s && e ? `${s}_${e}` : '조회';
}

export function downloadOutfitRankingExcel(
  rows: Record<string, unknown>[],
  rankingSort: 'popular' | 'number',
  filters: OutfitSubmittedFilters | null,
) {
  const sorted = rankingSort === 'popular' ? sortOutfitsByPopular(rows) : sortOutfitsByNumber(rows);
  const headers = ['RANK', 'ID', 'NAME', 'CODE', 'CATEGORY', 'TOTAL_SHOTS'];
  const tableRows = sorted.map((o, i) => [
    i + 1,
    String(o.id ?? ''),
    String(o.name ?? ''),
    getOutfitDisplayCode(o),
    String(o.categoryName ?? ''),
    getOutfitTotalShots(o),
  ]);
  downloadOutfitCsv(`의상_랭킹_${csvSuffix(filters)}.csv`, headers, tableRows);
}

export function downloadOutfitStatsExcel(
  rows: Record<string, unknown>[],
  statsSort: 'shots' | 'number',
  filters: OutfitSubmittedFilters | null,
) {
  const sorted = statsSort === 'shots' ? sortOutfitsByPopular(rows) : sortOutfitsByNumber(rows);
  const ranks = statsSort === 'shots' ? assignShotRanks(sorted) : null;
  const headers =
    statsSort === 'shots'
      ? ['RANK', 'NO', 'NAME', 'CODE', 'CATEGORY', 'TOTAL_SHOTS']
      : ['NO', 'NAME', 'CODE', 'CATEGORY', 'TOTAL_SHOTS'];
  const tableRows = sorted.map((o) => {
    const id = o.id;
    const no = `#${String(id).padStart(3, '0')}`;
    const base = [
      no,
      String(o.name ?? ''),
      getOutfitDisplayCode(o),
      String(o.categoryName ?? ''),
      getOutfitTotalShots(o),
    ];
    if (statsSort === 'shots' && ranks) {
      return [ranks.get(String(id)) ?? '', ...base];
    }
    return base;
  });
  downloadOutfitCsv(`의상_통계_${csvSuffix(filters)}.csv`, headers, tableRows);
}
