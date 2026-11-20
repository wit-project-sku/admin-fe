import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import { useStoryCount, useStoryList, useStoryMutations } from '../../hooks/story-api/useStories';
import type { StoryDto, StoryStatus } from '../../hooks/story-api/storyTypes';
import { useLotteBranches, type LotteBranchFilter } from '../lotte/lotteBranches';
import { STORY_MESSAGES, STORY_PAGE_SIZE, type StoryTab } from './storyConfig';

/** 사연 관리 — 지점·상태 탭·페이지, 승인/숨김, 미리보기·순서 창. */
export function useStoryManagePage() {
  const { branches, byCode, byKioskId } = useLotteBranches();
  const [branch, setBranch] = useState<LotteBranchFilter>('');
  const [tab, setTab] = useState<StoryTab>('PENDING');
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<StoryDto | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  const selected = branch ? byCode.get(branch) : undefined;
  const kioskId = selected?.kioskId ?? undefined;
  /** 고른 지점이 서버에 없으면 거를 수 없다 — 전체를 보여 주면 다른 지점 사연이 섞이니 아예 받지 않는다. */
  const branchMissing = branch !== '' && kioskId == null;
  const enabled = !branchMissing;

  const status: StoryStatus | undefined = tab === 'ALL' ? undefined : tab;
  const list = useStoryList({ status, kioskId, pageNum: page, pageSize: STORY_PAGE_SIZE }, enabled);

  const counts: Record<StoryTab, number | undefined> = {
    PENDING: useStoryCount('PENDING', kioskId, enabled),
    APPROVED: useStoryCount('APPROVED', kioskId, enabled),
    HIDDEN: useStoryCount('HIDDEN', kioskId, enabled),
    ALL: useStoryCount(undefined, kioskId, enabled),
  };

  const { changeStatusAsync, pendingStatusId, saveOrderAsync, isSavingOrder } = useStoryMutations();

  useEffect(() => {
    setPage(1);
  }, [branch, tab]);

  // 승인·숨김으로 마지막 장이 비면 앞 장으로 당긴다.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), list.totalPages));
  }, [list.totalPages]);

  const changeStatus = useCallback(
    async (story: Pick<StoryDto, 'id'>, next: Exclude<StoryStatus, 'PENDING'>) => {
      try {
        const res = await changeStatusAsync({ id: story.id, status: next });
        const updated = (res as { data?: StoryDto } | null)?.data ?? null;
        // 미리보기 창은 탭이 바뀌어도(승인 → 검수 대기 목록에서 빠져도) 열린 채로 새 상태를 보여 준다.
        if (updated) setPreview((p) => (p && p.id === updated.id ? updated : p));
        return updated;
      } catch (err) {
        alert(apiErrorMessage(err, STORY_MESSAGES.statusFailed));
        return null;
      }
    },
    [changeStatusAsync],
  );

  const branchCodeOf = useCallback((id: number) => byKioskId.get(id)?.code ?? `#${id}`, [byKioskId]);

  return {
    branches,
    branch,
    setBranch,
    selectedBranch: selected,
    branchMissing,
    tab,
    setTab,
    counts,
    page,
    setPage,
    rows: branchMissing ? [] : list.rows,
    loading: list.isPending,
    errorMessage: list.isError ? STORY_MESSAGES.loadError : '',
    // 지점이 없을 때의 안내는 표 위 띠에 있다 — 표 안에는 짧게.
    emptyMessage: branchMissing
      ? '표시할 사연이 없습니다.'
      : tab === 'PENDING'
        ? STORY_MESSAGES.emptyPending
        : STORY_MESSAGES.empty,
    totalPages: list.totalPages,
    totalCount: branchMissing ? 0 : list.totalElements,
    pendingStatusId,
    changeStatus,
    branchCodeOf,
    preview,
    openPreview: (row: StoryDto) => setPreview(row),
    closePreview: () => setPreview(null),
    /** 순서는 한 키오스크 단위 — 지점을 골라야 연다. */
    canOrder: kioskId != null,
    orderKioskId: kioskId ?? null,
    showOrder,
    openOrder: () => setShowOrder(true),
    closeOrder: () => setShowOrder(false),
    saveOrderAsync,
    isSavingOrder,
  };
}
