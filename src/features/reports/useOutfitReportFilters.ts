import { useCallback, useState } from 'react';
import type { OutfitSubmittedFilters } from './reportTypes';

/** Shared filter UI state for 의상별 인기 랭킹 / 전체 의상 통계 (no network). */
export function useOutfitReportFilters() {
  const [kioskDraft, setKioskDraft] = useState('');
  const [dateDraft, setDateDraft] = useState({ start: '', end: '' });
  const [submitted, setSubmitted] = useState<OutfitSubmittedFilters | null>(null);
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
    setKioskDraft('');
    setDateDraft({ start: '', end: '' });
    setSubmitted(null);
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
