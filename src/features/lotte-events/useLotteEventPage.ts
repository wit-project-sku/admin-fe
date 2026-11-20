import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useLotteEventList } from '../../hooks/lotte-event-api/useLotteEvents';
import type { LotteEventDto } from '../../hooks/lotte-event-api/lotteEventTypes';
import { useLotteBranches, type LotteBranchFilter } from '../lotte/lotteBranches';
import { LOTTE_BUILDINGS, LOTTE_EVENT_MESSAGES, LOTTE_EVENT_PAGE_SIZE, type LotteEventTab } from './lotteEventConfig';

/** 건물 이벤트 — 지점·건물·상태 탭·페이지, 등록/수정 창, 삭제 창. */
export function useLotteEventPage() {
  const { branches, byCode, byKioskId } = useLotteBranches();
  const [branch, setBranch] = useState<LotteBranchFilter>('');
  const [building, setBuilding] = useState('');
  const [tab, setTab] = useState<LotteEventTab>('ONGOING');
  const [page, setPage] = useState(1);
  /** null = 닫힘, 'new' = 등록, 그 밖 = 수정할 이벤트 */
  const [editing, setEditing] = useState<LotteEventDto | 'new' | null>(null);
  const [deleting, setDeleting] = useState<LotteEventDto | null>(null);

  const selected = branch ? byCode.get(branch) : undefined;
  const kioskId = selected?.kioskId ?? undefined;
  const branchMissing = branch !== '' && kioskId == null;
  /** 건물 칩은 건물이 둘 이상인 지점(월드몰)을 골랐을 때만 */
  const buildingOptions = branch ? LOTTE_BUILDINGS[branch] : [];
  const showBuildingFilter = buildingOptions.length > 1;

  const list = useLotteEventList(
    {
      kioskId,
      building: showBuildingFilter && building ? building : undefined,
      status: tab === 'ALL' ? undefined : tab,
      pageNum: page,
      pageSize: LOTTE_EVENT_PAGE_SIZE,
    },
    !branchMissing,
  );

  useEffect(() => setBuilding(''), [branch]);
  useEffect(() => setPage(1), [branch, building, tab]);
  useEffect(() => setPage((p) => Math.min(Math.max(1, p), list.totalPages)), [list.totalPages]);

  const notReady = isAxiosError(list.error) && list.error.response?.status === 404;

  const branchCodeOf = useCallback((id: number) => byKioskId.get(id)?.code ?? `#${id}`, [byKioskId]);

  return {
    branches,
    branch,
    setBranch,
    branchMissing,
    building,
    setBuilding,
    buildingOptions,
    showBuildingFilter,
    tab,
    setTab,
    page,
    setPage,
    rows: branchMissing ? [] : list.rows,
    loading: list.isPending,
    errorMessage: list.isError ? (notReady ? LOTTE_EVENT_MESSAGES.notReady : LOTTE_EVENT_MESSAGES.loadError) : '',
    emptyMessage: LOTTE_EVENT_MESSAGES.empty,
    totalPages: list.totalPages,
    totalCount: branchMissing ? 0 : list.totalElements,
    branchCodeOf,
    /** 등록 창의 지점 기본값 — 보고 있던 지점 */
    defaultBranch: branch,
    editing,
    openCreate: () => setEditing('new'),
    openEdit: (row: LotteEventDto) => setEditing(row),
    closeEdit: () => setEditing(null),
    deleting,
    openDelete: (row: LotteEventDto) => setDeleting(row),
    closeDelete: () => setDeleting(null),
  };
}
