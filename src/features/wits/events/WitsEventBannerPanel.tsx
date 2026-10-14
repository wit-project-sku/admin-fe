// 앱 배너 순서 탭 — 앱 홈 배너 노출을 켠 이벤트를 끌어서(또는 ↑↓) 순서를 바꾸고 저장한다.
// 순서는 화면에서 먼저 바꾸고 '순서 저장'으로 한 번에 보낸다(서버는 노출 목록과 같은 id 집합만 받는다).
import { useMemo, useRef, useState } from 'react';

import shared from '@commons/shared.module.css';
import ImageZoom from '@components/common/ImageZoom';
import { useWitsEventBanners, useWitsEventMutations } from '@/hooks/wits-api/useWitsEvents';
import { WITS_EVENT_STATUS_LABEL, type WitsEventBannerDto } from '@/hooks/wits-api/witsTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { formatDateTimeRange } from '../witsFormat';
import { WITS_EVENT_STATUS_BADGE } from '../witsBadges';
import s from '../Wits.module.css';

type Props = {
  onNotice: (text: string, ok?: boolean) => void;
};

export function WitsEventBannerPanel({ onNotice }: Props) {
  const { banners, isPending, isError } = useWitsEventBanners();
  const { reorderBannersAsync, isReordering } = useWitsEventMutations();

  // null = 서버 순서 그대로. 바꾸기 시작하면 화면 순서(id)를 따로 쥔다 — 행 내용은 늘 최신 목록에서 읽는다.
  const [draftIds, setDraftIds] = useState<number[] | null>(null);
  const items = useMemo(() => {
    if (!draftIds) return banners;
    const byId = new Map(banners.map((b) => [b.id, b]));
    const picked = draftIds.map((id) => byId.get(id)).filter((b): b is WitsEventBannerDto => b != null);
    const seen = new Set(draftIds);
    return [...picked, ...banners.filter((b) => !seen.has(b.id))];
  }, [banners, draftIds]);
  const dirty = draftIds != null;

  // 드래그 소스는 ref 로 유지한다(state 로 두면 stale-closure 로 드롭이 누락된다 — 배너 관리와 같은 규칙).
  const dragFrom = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraftIds(next.map((b) => b.id));
  };

  const clearDrag = () => {
    dragFrom.current = null;
    setDragIdx(null);
    setOverIdx(null);
  };

  const save = async () => {
    if (!dirty) return;
    try {
      await reorderBannersAsync(items.map((b) => b.id));
      setDraftIds(null);
      onNotice('배너 순서를 저장했습니다.');
    } catch (err) {
      onNotice(apiErrorMessage(err, '순서 저장에 실패했습니다. 새로고침 후 다시 시도해 주세요.'), false);
    }
  };

  return (
    <div className={s.body}>
      {items.length > 0 ? (
        <div className={`${s.orderBar} ${dirty ? s.orderBarDirty : ''}`}>
          <span>
            {dirty ? '순서를 바꿨습니다. 저장해야 앱에 반영됩니다.' : `배너 노출 이벤트 ${items.length}건 · 끌어서 순서를 바꿀 수 있습니다`}
          </span>
          <span className={s.orderBarSpacer} />
          {dirty ? (
            <>
              <button type='button' className={s.textBtn} onClick={() => setDraftIds(null)} disabled={isReordering}>
                되돌리기
              </button>
              <button type='button' className={shared.btnPrimary} onClick={save} disabled={isReordering}>
                {isReordering ? '저장 중...' : '순서 저장'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {isPending ? (
        <div className={s.empty}>배너를 불러오는 중…</div>
      ) : isError ? (
        <div className={s.empty}>배너를 불러오지 못했습니다.</div>
      ) : items.length === 0 ? (
        <div className={s.empty}>
          앱 홈 배너에 노출 중인 이벤트가 없습니다. 이벤트 수정에서 <b>앱 홈 배너 노출</b>을 켜세요.
        </div>
      ) : (
        <div className={s.bannerList}>
          {items.map((b, i) => {
            const dropCls =
              overIdx === i && dragIdx != null && dragIdx !== i ? (dragIdx < i ? s.rowDropAfter : s.rowDropBefore) : '';
            return (
              <div
                key={b.id}
                className={`${s.bannerRow} ${s.draggable} ${dragIdx === i ? s.dragging : ''} ${dropCls}`}
                draggable
                onDragStart={(e) => {
                  dragFrom.current = i;
                  setDragIdx(i);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault(); // 이걸 해야 drop 이 발생한다
                  e.dataTransfer.dropEffect = 'move';
                  if (overIdx !== i) setOverIdx(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragFrom.current;
                  clearDrag();
                  if (from != null) move(from, i);
                }}
                onDragEnd={clearDrag}
              >
                <span className={s.handle} title='끌어서 순서 변경'>
                  ⠿<span className={s.order}>{i + 1}</span>
                </span>
                <div className={s.bannerThumb}>
                  {b.bannerImageUrl ? (
                    <ImageZoom src={b.bannerImageUrl} alt={b.titleKo} title={b.titleKo} className={s.bannerThumbImg} />
                  ) : (
                    <span className={s.help} style={{ display: 'block', padding: 20, lineHeight: 1.4 }}>
                      이미지 없음
                    </span>
                  )}
                </div>
                <div className={s.bannerMeta}>
                  <span className={s.bannerTitle}>{b.titleKo}</span>
                  <span>
                    <span className={`${shared.badge} ${WITS_EVENT_STATUS_BADGE[b.status] ?? shared.badgeGray}`}>
                      {WITS_EVENT_STATUS_LABEL[b.status] ?? b.status}
                    </span>{' '}
                    {formatDateTimeRange(b.startAt, b.endAt)}
                  </span>
                </div>
                <div className={s.rowActions}>
                  <button type='button' className={s.textBtn} onClick={() => move(i, i - 1)} disabled={i === 0} title='위로'>
                    ↑
                  </button>
                  <button
                    type='button'
                    className={s.textBtn}
                    onClick={() => move(i, i + 1)}
                    disabled={i === items.length - 1}
                    title='아래로'
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={s.hint}>
        · 앱 홈 배너에는 <b>진행 중</b>이면서 배너 이미지가 있는 이벤트만 이 순서대로 보입니다. 예정·마감 이벤트는 순서만 유지됩니다.
        <br />· 배너 노출을 켜고 끄는 것은 <b>이벤트 목록</b>에서 이벤트를 수정해 바꿉니다.
      </div>
    </div>
  );
}
