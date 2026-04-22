import { useEffect, useMemo, useState } from 'react';
import { useKioskButtonsPaged } from '@/hooks/kiosk-api/useKioskButtons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { useGetKiosks } from '@/hooks/useGetKiosks';
import { KIOSK_BUTTON_MANAGE_PAGE_SIZE, MAX_BUTTONS_PER_KIOSK } from './constants';

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
    return [...list].sort((a, b) => a.position - b.position || a.id - b.id);
  }, [paged.data]);

  const totalPages = paged.data?.totalPages ?? 1;
  const totalElements = paged.data?.totalElements ?? 0;

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
  };
}
