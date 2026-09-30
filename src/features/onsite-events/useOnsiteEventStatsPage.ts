import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SearchableOption } from '@components/common/SearchableSelect';
import { useOnsiteEventOptions, useOnsiteEventStats } from '../../hooks/onsite-event-api/useOnsiteEvents';
import type { OnsiteEventOptionDto } from '../../hooks/onsite-event-api/onsiteEventTypes';
import { getLocalTodayYmd } from '../../utils/dateUtils';
import { formatPeriodShort } from './onsiteEventFormat';

const EVENT_PARAM = 'event';

/**
 * 처음 열었을 때 고를 행사 — 오늘(KST) 이전에 시작한 행사 중 시작일이 가장 늦은 것.
 * 전부 기간 전이면 첫 옵션(서버가 시작일 늦은 순으로 준다).
 */
function pickDefault(options: OnsiteEventOptionDto[], today: string): OnsiteEventOptionDto | null {
  let best: OnsiteEventOptionDto | null = null;
  for (const o of options) {
    if (o.startDate > today) continue;
    if (!best || o.startDate > best.startDate || (o.startDate === best.startDate && o.id > best.id)) best = o;
  }
  return best ?? options[0] ?? null;
}

/** 행사 촬영 통계 화면 — 드롭다운 옵션, 주소(`?event=`)에 묶인 선택, 선택 행사의 리포트. */
export function useOnsiteEventStatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { options, isPending: optionsPending, isError: optionsError } = useOnsiteEventOptions();

  const paramId = Number(searchParams.get(EVENT_PARAM));
  const selected = useMemo<OnsiteEventOptionDto | null>(() => {
    if (options.length === 0) return null;
    const fromUrl = Number.isFinite(paramId) && paramId > 0 ? options.find((o) => o.id === paramId) : undefined;
    return fromUrl ?? pickDefault(options, getLocalTodayYmd());
  }, [options, paramId]);

  // 기본 선택(또는 삭제돼 없어진 id)을 주소에 반영 — 새로 고침·링크 공유 시 같은 행사가 열린다.
  useEffect(() => {
    if (!selected || selected.id === paramId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(EVENT_PARAM, String(selected.id));
        return next;
      },
      { replace: true },
    );
  }, [selected, paramId, setSearchParams]);

  const selectEvent = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(EVENT_PARAM, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const selectOptions = useMemo<SearchableOption[]>(
    () =>
      options.map((o) => ({
        value: String(o.id),
        label: `${o.name} · ${formatPeriodShort(o.startDate, o.endDate)}`,
        sublabel: `${o.venue} · ${o.contentLabel}${o.notStarted ? ' · 기간 전' : ''}`,
      })),
    [options],
  );

  // 기간 전 행사는 리포트를 받지 않는다(서버도 빈 값을 준다) — 안내 문구만 보여 준다.
  const statsId = selected && !selected.notStarted ? selected.id : null;
  const { stats, isPending: statsPending, isError: statsError } = useOnsiteEventStats(statsId);

  return {
    optionsPending,
    optionsError,
    hasEvents: options.length > 0,
    selectOptions,
    selected,
    selectEvent,
    stats,
    statsPending,
    statsError,
    notStarted: !!selected?.notStarted || !!stats?.notStarted,
  };
}
