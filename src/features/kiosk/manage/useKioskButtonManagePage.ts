import { useEffect, useMemo, useState } from 'react';
import { useKioskButtons, useKioskButtonsPaged } from '@/hooks/kiosk-api/useKioskButtons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { useGetKiosks } from '@/hooks/useGetKiosks';
import {
  DEFAULT_BUTTONS_PER_LINE,
  KIOSK_BUTTON_MANAGE_PAGE_SIZE,
  MAX_BUTTONS_PER_KIOSK,
  sortByLinePosition,
} from './constants';

export function useKioskButtonManagePage() {
  const [tab, setTab] = useState<'all' | 'byKiosk'>('all');
  const [byKioskId, setByKioskId] = useState('');
  const [page, setPage] = useState(1);

  const { data: kiosksRaw, isLoading: kiosksLoading } = useGetKiosks();
  const kiosks = useMemo(() => (Array.isArray(kiosksRaw) ? kiosksRaw : []), [kiosksRaw]);

  useEffect(() => {
    if (!kiosks.length) return;
    if (!byKioskId || !kiosks.some((k) => String(k.id) === byKioskId)) {
      setByKioskId(String(kiosks[0].id));
    }
  }, [kiosks, byKioskId]);

  useEffect(() => {
    setPage(1);
  }, [tab, byKioskId]);

  const kioskIdNum = useMemo(() => {
    const n = Number(byKioskId);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }, [byKioskId]);

  const allPaged = useKioskButtonsPaged({
    pageNum: page,
    pageSize: KIOSK_BUTTON_MANAGE_PAGE_SIZE,
    enabled: tab === 'all',
  });

  const byKioskPaged = useKioskButtonsPaged({
    pageNum: page,
    pageSize: KIOSK_BUTTON_MANAGE_PAGE_SIZE,
    kioskId: kioskIdNum,
    enabled: tab === 'byKiosk' && typeof kioskIdNum === 'number',
  });

  const paged = tab === 'all' ? allPaged : byKioskPaged;

  const buttons = useMemo((): KioskButtonDto[] => {
    const list = paged.data?.content ?? [];
    return sortByLinePosition(list);
  }, [paged.data]);

  const totalPages = paged.data?.totalPages ?? 1;
  const totalElements = paged.data?.totalElements ?? 0;

  // WITH별 탭: 레이아웃 미리보기용 — 선택된 키오스크의 버튼 전체(페이징 없이 병합)를 (line, position) 순으로.
  const byKioskAll = useKioskButtons({
    kioskId: kioskIdNum,
    enabled: tab === 'byKiosk' && typeof kioskIdNum === 'number',
  });
  const byKioskAllButtons = useMemo(
    (): KioskButtonDto[] => sortByLinePosition(byKioskAll.data ?? []),
    [byKioskAll.data],
  );

  const selectedKiosk = useMemo(
    () => kiosks.find((k) => String(k.id) === byKioskId),
    [kiosks, byKioskId],
  );
  const selectedButtonsPerLine = selectedKiosk?.buttonsPerLine ?? DEFAULT_BUTTONS_PER_LINE;
  const selectedLineCapacities = useMemo(
    () => (Array.isArray(selectedKiosk?.lineCapacities) ? selectedKiosk!.lineCapacities! : []),
    [selectedKiosk],
  );

  const kioskSelectOptions = useMemo(
    () =>
      kiosks.map((k) => ({
        value: String(k.id),
        label: k.name,
        sublabel: [k.city, k.district].filter(Boolean).join(' · ') || undefined,
      })),
    [kiosks],
  );

  const selectedKioskName = useMemo(
    () => kiosks.find((k) => String(k.id) === byKioskId)?.name ?? '—',
    [kiosks, byKioskId],
  );

  /** “전체 버튼” 탭에서 WITH 열·부제 표시 */
  const showKioskColumn = tab === 'all';

  return {
    tab,
    setTab,
    byKioskId,
    setByKioskId,
    buttons,
    page,
    setPage,
    totalPages,
    totalElements,
    isLoading: paged.isLoading,
    error: paged.error,
    kiosksLoading,
    kioskSelectOptions,
    selectedKioskName,
    showKioskColumn,
    maxButtonsPerKiosk: MAX_BUTTONS_PER_KIOSK,
    // WITH별 레이아웃 미리보기용
    byKioskAllButtons,
    byKioskAllLoading: byKioskAll.isLoading,
    selectedKioskIdNum: kioskIdNum,
    selectedButtonsPerLine,
    selectedLineCapacities,
  };
}
