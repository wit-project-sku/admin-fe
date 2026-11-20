import { useEffect, useMemo, useState } from 'react';
import { ModalContainer, ModalFooter, ModalHeader } from '@modals/ModalElements';
import { useApprovedStories } from '../../hooks/story-api/useStories';
import type { StoryDto } from '../../hooks/story-api/storyTypes';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import s from '../lotte/Lotte.module.css';
import { formatDateTime } from '../lotte/lotteFormat';
import { StoryPreviewThumb } from './StoryPreviewThumb';
import { STORY_KIOSK_WINDOW_DAYS, STORY_MESSAGES, STORY_TYPE_LABEL, isPastKioskWindow, sortForKiosk } from './storyConfig';

type Props = {
  kioskId: number;
  branchLabel: string;
  saving: boolean;
  onSave: (vars: { kioskId: number; storyIds: number[] }) => Promise<unknown>;
  onClose: () => void;
};

/**
 * 키오스크 사연 순서 — 한 지점의 승인된 사연을 '앞에 고정'과 '최근 승인 순' 두 칸으로 나눈다.
 * 고정 칸은 끌어서(또는 ▲▼) 순서를 바꾸고, 저장하면 그 순서대로 1번부터 고정된다(PATCH /admin/stories/order).
 * 고정하지 않은 사연은 서버가 승인 최신순으로 뒤에 붙인다 — 새로 승인한 사연이 자동으로 들어갈 자리다.
 */
export function StoryOrderModal({ kioskId, branchLabel, saving, onSave, onClose }: Props) {
  const { stories, isPending, isError } = useApprovedStories(kioskId);
  const [pinned, setPinned] = useState<number[] | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | 'end' | null>(null);
  const [error, setError] = useState('');

  const byId = useMemo(() => new Map(stories.map((st) => [st.id, st])), [stories]);

  // 처음 받은 순서로 고정 칸을 채운다(이미 정해 둔 순서).
  useEffect(() => {
    if (isPending || pinned != null) return;
    setPinned(
      sortForKiosk(stories)
        .filter((st) => st.displayOrder != null)
        .map((st) => st.id),
    );
  }, [isPending, stories, pinned]);

  const pinnedIds = pinned ?? [];
  const pinnedSet = new Set(pinnedIds);
  const pinnedStories = pinnedIds.map((id) => byId.get(id)).filter((x): x is StoryDto => !!x);
  const autoStories = sortForKiosk(stories.filter((st) => !pinnedSet.has(st.id)).map((st) => ({ ...st, displayOrder: null })));

  const original = useMemo(
    () =>
      sortForKiosk(stories)
        .filter((st) => st.displayOrder != null)
        .map((st) => st.id)
        .join(','),
    [stories],
  );
  const dirty = pinned != null && pinnedIds.join(',') !== original;

  const move = (id: number, toIndex: number) => {
    setPinned((prev) => {
      const list = (prev ?? []).filter((x) => x !== id);
      list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, id);
      return list;
    });
  };

  const pin = (id: number) => setPinned((prev) => [...(prev ?? []), id]);
  const unpin = (id: number) => setPinned((prev) => (prev ?? []).filter((x) => x !== id));

  const dropOn = (target: number | 'end') => {
    if (dragId == null) return;
    const list = pinnedIds.filter((x) => x !== dragId);
    const idx = target === 'end' ? list.length : list.indexOf(target);
    move(dragId, idx < 0 ? list.length : idx);
    setDragId(null);
    setOverId(null);
  };

  const save = async () => {
    setError('');
    try {
      await onSave({ kioskId, storyIds: pinnedIds });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, STORY_MESSAGES.orderFailed));
    }
  };

  const meta = (st: StoryDto) => {
    const expired = isPastKioskWindow(st);
    return (
      <span className={`${s.subText} ${expired ? s.expired : ''}`}>
        {st.displayName} · {STORY_TYPE_LABEL[st.type]} · 승인 {formatDateTime(st.approvedAt)}
        {expired ? ` · ${STORY_KIOSK_WINDOW_DAYS}일 지나 키오스크에서 내려감` : ''}
      </span>
    );
  };

  return (
    <ModalContainer onClose={onClose} modalClassName={s.wideModal}>
      <ModalHeader title={`사연 순서 — ${branchLabel}`} onClose={onClose} />
      {isPending || pinned == null ? (
        <div className={s.loading}>불러오는 중...</div>
      ) : isError ? (
        <div className={s.loading}>{STORY_MESSAGES.loadError}</div>
      ) : (
        <div className={s.body}>
          <p className={s.hint} style={{ margin: 0 }}>
            앞에 고정한 사연이 위에서부터 먼저 나오고, 나머지는 최근 승인 순으로 뒤에 붙습니다. 끌어서 순서를 바꾸세요.
          </p>

          <section>
            <h4 className={s.orderSectionTitle}>
              <span>앞에 고정 ({pinnedStories.length})</span>
              {pinnedStories.length > 0 ? (
                <button type='button' className={s.actionBtn} onClick={() => setPinned([])}>
                  모두 풀기
                </button>
              ) : null}
            </h4>
            {pinnedStories.length === 0 ? (
              <div
                className={`${s.orderEmpty} ${overId === 'end' ? s.orderItemOver : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverId('end');
                }}
                onDrop={() => dropOn('end')}
              >
                고정한 사연이 없습니다 — 모두 최근 승인 순으로 나옵니다.
              </div>
            ) : (
              <ol
                className={s.orderList}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (e.target === e.currentTarget) setOverId('end');
                }}
                onDrop={(e) => {
                  if (e.target === e.currentTarget) dropOn('end');
                }}
              >
                {pinnedStories.map((st, i) => (
                  <li
                    key={st.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(st.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverId(st.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dropOn(st.id);
                    }}
                    className={[
                      s.orderItem,
                      s.orderItemPinned,
                      dragId === st.id ? s.orderItemDragging : '',
                      overId === st.id && dragId !== st.id ? s.orderItemOver : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={s.dragHandle} aria-hidden>
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                        <circle cx='9' cy='6' r='1.6' />
                        <circle cx='15' cy='6' r='1.6' />
                        <circle cx='9' cy='12' r='1.6' />
                        <circle cx='15' cy='12' r='1.6' />
                        <circle cx='9' cy='18' r='1.6' />
                        <circle cx='15' cy='18' r='1.6' />
                      </svg>
                    </span>
                    <span className={s.orderNum}>{i + 1}</span>
                    <StoryPreviewThumb story={st} />
                    <span className={s.orderItemMain}>
                      <span className={s.titleText}>{st.title}</span>
                      {meta(st)}
                    </span>
                    <button
                      type='button'
                      className={s.iconBtn}
                      aria-label='위로'
                      disabled={i === 0}
                      onClick={() => move(st.id, i - 1)}
                    >
                      ▲
                    </button>
                    <button
                      type='button'
                      className={s.iconBtn}
                      aria-label='아래로'
                      disabled={i === pinnedStories.length - 1}
                      onClick={() => move(st.id, i + 1)}
                    >
                      ▼
                    </button>
                    <button type='button' className={s.actionBtn} onClick={() => unpin(st.id)}>
                      풀기
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h4 className={s.orderSectionTitle}>
              <span>최근 승인 순 ({autoStories.length})</span>
            </h4>
            {autoStories.length === 0 ? (
              <div className={s.orderEmpty}>
                {stories.length === 0 ? '이 지점에 승인된 사연이 없습니다.' : '모든 사연이 고정되어 있습니다.'}
              </div>
            ) : (
              <ul className={s.orderList}>
                {autoStories.map((st) => (
                  <li
                    key={st.id}
                    className={s.orderItem}
                    draggable
                    onDragStart={(e) => {
                      setDragId(st.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                  >
                    <StoryPreviewThumb story={st} />
                    <span className={s.orderItemMain}>
                      <span className={s.titleText}>{st.title}</span>
                      {meta(st)}
                    </span>
                    <button type='button' className={s.actionBtn} onClick={() => pin(st.id)}>
                      앞에 고정
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error ? <p className={s.apiError}>{error}</p> : null}
        </div>
      )}
      <ModalFooter
        onCancel={onClose}
        onSubmit={save}
        submitText='순서 저장'
        isLoading={saving}
        submitDisabled={!dirty || isPending || isError}
      />
    </ModalContainer>
  );
}
