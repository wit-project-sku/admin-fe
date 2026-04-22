import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetKiosks, type AdminKioskDto } from '@/hooks/useGetKiosks';
import { useKioskButtonStatsSummary } from '@/hooks/kiosk-api/useKioskButtonStatsSummary';
import { useKioskButtons } from '@/hooks/kiosk-api/useKioskButtons';
import { useKioskCities } from '@/hooks/kiosk-api/useKioskCities';
import type { KioskButtonStatsSummaryBlock } from '@/hooks/kiosk-api/kioskButtonStatsTypes';
import { getDateRange, toDateYmd, type AnalyticsFilters } from '../kioskAnalyticsMock';
import type { KioskAnalyticsTableRow } from './analyticsTypes';
import { defaultAnalyticsFilters, TABLE_PAGE_SIZE } from './constants';
import { themeColorFromKey } from '../kioskFormatters';

function parseKioskIdQuery(raw: string): number | undefined {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function firstBlock(data: { content?: KioskButtonStatsSummaryBlock[] } | undefined): KioskButtonStatsSummaryBlock | null {
  const c = data?.content;
  if (!c?.length) return null;
  return c[0] ?? null;
}

export function useKioskAnalyticsPageModel() {
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultAnalyticsFilters);
  const [page, setPage] = useState(1);

  const { data: citiesRaw, isLoading: citiesLoading } = useKioskCities();
  const cityOptions = useMemo(() => {
    const rows = Array.isArray(citiesRaw) ? citiesRaw : [];
    return rows.map((c) => ({ value: c, label: c }));
  }, [citiesRaw]);

  const cityFilter = useMemo(() => filters.city.trim(), [filters.city]);

  const { data: kiosksRaw, isLoading: kiosksLoading } = useGetKiosks({
    city: cityFilter || undefined,
  });
  const kiosks = useMemo<AdminKioskDto[]>(() => (Array.isArray(kiosksRaw) ? kiosksRaw : []), [kiosksRaw]);

  const { start, end } = useMemo(
    () => getDateRange(filters.preset, filters.customStart, filters.customEnd),
    [filters.preset, filters.customStart, filters.customEnd],
  );
  const startDate = useMemo(() => toDateYmd(start), [start]);
  const endDate = useMemo(() => toDateYmd(end), [end]);

  const kioskIdParam = useMemo(() => parseKioskIdQuery(filters.kioskId), [filters.kioskId]);
  const buttonTypeParam = useMemo(() => filters.buttonType.trim() || undefined, [filters.buttonType]);
  const cityParam = useMemo(() => filters.city.trim() || undefined, [filters.city]);

  const selectedKiosk = useMemo(
    () => (filters.kioskId ? kiosks.find((k) => String(k.id) === filters.kioskId) : undefined),
    [kiosks, filters.kioskId],
  );

  const buttonsCity = useMemo(
    () => selectedKiosk?.city?.trim() || filters.city.trim() || undefined,
    [selectedKiosk, filters.city],
  );

  const { data: buttonsRaw, isLoading: buttonsLoading } = useKioskButtons({
    kioskId: kioskIdParam,
    city: buttonsCity,
    district: selectedKiosk?.district,
  });

  /** Distinct `buttonType` values in API response order (no client sort). */
  const buttonTypeOptions = useMemo(() => {
    const rows = Array.isArray(buttonsRaw) ? buttonsRaw : [];
    const seen = new Set<string>();
    const types: string[] = [];
    for (const r of rows) {
      const t = r.buttonType?.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      types.push(t);
    }
    return types.map((t) => ({ value: t, label: t }));
  }, [buttonsRaw]);

  const statsQuery = useKioskButtonStatsSummary(
    {
      startDate,
      endDate,
      pageNum: page,
      pageSize: TABLE_PAGE_SIZE,
      kioskId: kioskIdParam,
      buttonType: buttonTypeParam,
      city: cityParam,
    },
    { enabled: Boolean(startDate && endDate) },
  );

  useEffect(() => {
    if (!filters.kioskId || kiosksLoading) return;
    const ok = kiosks.some((k) => String(k.id) === filters.kioskId);
    if (!ok) setFilters((f) => ({ ...f, kioskId: '' }));
  }, [filters.kioskId, kiosks, kiosksLoading]);

  const pageData = statsQuery.data?.data;
  const block = useMemo(() => firstBlock(pageData), [pageData]);

  const kioskOptions = useMemo(
    () =>
      kiosks.map((k) => ({
        value: String(k.id),
        label: k.name,
        sublabel: [k.city, k.district].filter(Boolean).join(' · ') || undefined,
      })),
    [kiosks],
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultAnalyticsFilters());
    setPage(1);
  }, []);

  const bumpPageReset = useCallback(() => setPage(1), []);

  const tableRows = useMemo<KioskAnalyticsTableRow[]>(() => {
    const rows = block?.buttonDetails ?? [];
    return rows.map((r) => ({
      ...r,
      id: `${r.kioskId}-${r.buttonType}-${r.position}`,
    }));
  }, [block]);

  const totalTablePages = Math.max(1, pageData?.totalPages ?? 1);

  useEffect(() => {
    if (!pageData?.totalPages) return;
    setPage((p) => Math.min(Math.max(1, p), Math.max(1, pageData.totalPages)));
  }, [pageData?.totalPages]);

  const safePage = Math.min(page, totalTablePages);
  const pageRows = tableRows;
  const tableTotalCount = pageData?.totalElements ?? 0;

  const clickDistData = useMemo(
    () =>
      (block?.statsByClicks ?? []).map((e, i) => {
        const loc = e?.buttonName?.trim() || `항목 ${i + 1}`;
        const name = e.buttonType?.trim() || `항목 ${i + 1}`;
        return {
          name: `${loc}=${name}`,
          clicks: e.value,
          color: themeColorFromKey(name),
        };
      }),
    [block],
  );

  const usagePerButtonData = useMemo(
    () =>
      (block?.statsByDurations ?? []).map((e, i) => {
        const loc = e.buttonName?.trim() || `항목 ${i + 1}`;
        const name = e.buttonType?.trim() || `항목 ${i + 1}`;

        return {
          name: `${loc}=${name}`,
          /** API `value` = 사용 시간(초) — 그대로 차트에 사용 */
          usageSeconds: e.value,
          color: themeColorFromKey(`${name}|d`),
        };
      }),
    [block],
  );

  const trendChartData = useMemo(
    () =>
      (block?.chartData ?? []).map((t, i) => ({
        label: t.label?.trim() || `T${i + 1}`,
        clicks: t.clicks,
        /** `duration` = 사용 시간(초) — 그대로 시계열에 사용 */
        usageSeconds: t.duration,
      })),
    [block],
  );

  const topLocChart = useMemo(
    () =>
      (block?.cityActivityGraph ?? []).map((r, i) => ({
        name: r.buttonType?.trim() || `지역 ${i + 1}`,
        clicks: r.value,
      })),
    [block],
  );

  /** `kioskUsageGraph[].value` = 사용 시간(초) — 차트·툴팁에서 포맷 표시 */
  const topKioskUsageData = useMemo(
    () =>
      (block?.kioskUsageGraph ?? []).map((r, i) => ({
        name: r.buttonType?.trim() || `WITH ${i + 1}`,
        usageSeconds: r.value,
      })),
    [block],
  );

  const kpi = useMemo(() => {
    if (!block) {
      return {
        totalClicks: 0,
        totalDurationSec: 0,
        avgSessionSec: 0,
        activeRegionCount: 0,
      };
    }
    return {
      totalClicks: block.totalClicks,
      totalDurationSec: block.totalDuration,
      avgSessionSec: block.avgDuration,
      activeRegionCount: (block.cityActivityGraph ?? []).length,
    };
  }, [block]);

  const statsEmpty = useMemo(
    () => !statsQuery.isLoading && !statsQuery.error && !block,
    [statsQuery.isLoading, statsQuery.error, block],
  );

  return {
    filters,
    setFilters,
    resetFilters,
    bumpPageReset,
    setPage,
    safePage,
    totalTablePages,
    pageRows,
    tableTotalCount,
    kioskOptions,
    cityOptions,
    citiesLoading,
    kiosksLoading,
    buttonTypeOptions,
    buttonsLoading,
    clickDistData,
    usagePerButtonData,
    topKioskUsageData,
    topLocChart,
    trendChartData,
    kpi,
    statsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
    statsEmpty,
  };
}
