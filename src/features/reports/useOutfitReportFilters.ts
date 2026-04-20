import { useCallback, useState } from 'react';
import type { OutfitSubmittedFilters } from './reportTypes';

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Default 기간: current month start ~ today (local time). */
function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: toLocalYmd(start), end: toLocalYmd(now) };
}

/** Shared filter UI state for 의상별 인기 랭킹 / 전체 의상 통계 (no network). */
export function useOutfitReportFilters() {
  const [kioskDraft, setKioskDraft] = useState('');
  const [dateDraft, setDateDraft] = useState(() => getDefaultDateRange());
  const [submitted, setSubmitted] = useState<OutfitSubmittedFilters | null>(() => {
    const { start, end } = getDefaultDateRange();
    return { start, end, kioskId: '' };
  });
  const [rankingSort, setRankingSort] = useState<'popular' | 'number'>('popular');
  const [statsSort, setStatsSort] = useState<'shots' | 'number'>('shots');

  const applyFilters = useCallback(() => {
    setSubmitted({
      start: dateDraft.start,
      end: dateDraft.end,
      kioskId: kioskDraft,
    });
  }, [dateDraft.start, dateDraft.end, kioskDraft]);

  const clearFilters = useCallback(() => {
    const next = getDefaultDateRange();
    setKioskDraft('');
    setDateDraft(next);
    setSubmitted({ start: next.start, end: next.end, kioskId: '' });
  }, []);

  return {
    kioskDraft,
    setKioskDraft,
    dateDraft,
    setDateDraft,
    submitted,
    applyFilters,
    clearFilters,
    rankingSort,
    setRankingSort,
    statsSort,
    setStatsSort,
  };
}

export type OutfitReportFiltersState = ReturnType<typeof useOutfitReportFilters>;
