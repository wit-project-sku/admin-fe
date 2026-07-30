// 키오스크 중심(보조 화면) — "이 키오스크에 지금 뭐가 뜨는지" 확인하고 순서를 바꾼다.
// 등록·이미지 교체는 배너 중심 화면에서만 한다(두 곳에서 CRUD 하면 어디서 지운 건지 헷갈린다).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useGetKiosks } from '@/hooks/useGetKiosks';
import { useKioskBanners, kioskBannersKey } from '@/hooks/kiosk-api/useKioskBanners';
import { useReorderKioskBanners } from '@/hooks/kiosk-api/useReorderKioskBanners';
import { useUnassignKioskBanner } from '@/hooks/kiosk-api/useBannerMutations';
import { formatPeriod, MAX_BANNERS_PER_KIOSK } from '@/hooks/kiosk-api/bannerTypes';
import { parseKiosk } from './bannerKiosk';
import s from './BannerManage.module.css';

export function KioskBannerPanel() {
  const [kioskId, setKioskId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  // 드래그 소스는 ref 로 유지한다(state 로 두면 stale-closure 로 드롭이 누락된다 — 실사 mirror 와 동일 규칙).
  const dragFrom = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: kiosksRaw } = useGetKiosks();
  const kiosks = useMemo(
    () => (Array.isArray(kiosksRaw) ? kiosksRaw : []).map(parseKiosk),
    [kiosksRaw],
  );

  useEffect(() => {
    if (kioskId == null && kiosks.length > 0) setKioskId(kiosks[0].id);
  }, [kiosks, kioskId]);

  const { banners, isPending, isError } = useKioskBanners(kioskId ?? undefined);
  const { reorderKioskBannersAsync } = useReorderKioskBanners();
  const { unassignAsync } = useUnassignKioskBanner();

  const refresh = () => qc.invalidateQueries({ queryKey: kioskBannersKey(kioskId ?? undefined) });
  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const applyOrder = async (from: number, to: number) => {
    if (kioskId == null || from === to) return;
    const next = [...banners];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    try {
      await reorderKioskBannersAsync({ kioskId, bannerIds: next.map((b) => b.bannerId) });
      await refresh();
    } catch {
      flash('순서 변경에 실패했습니다.', false);
    }
  };

  const unassign = async (bannerId: number) => {
    if (kioskId == null) return;
    if (!window.confirm('이 키오스크에서만 내립니다. 배너 자체와 다른 키오스크 노출은 유지됩니다.')) return;
    try {
      await unassignAsync({ kioskId, bannerId });
      await refresh();
      flash('이 키오스크에서 배너를 내렸습니다.');
    } catch {
      flash('내리기에 실패했습니다.', false);
    }
  };

  const clearDrag = () => {
    dragFrom.current = null;
    setDragIdx(null);
    setOverIdx(null);
  };

  const isFull = banners.length >= MAX_BANNERS_PER_KIOSK;

  return (
    <div>
      <div className={s.toolbar}>
        <span className={s.selectLabel}>키오스크</span>
        <select
          className={s.select}
          value={kioskId ?? ''}
          onChange={(e) => setKioskId(Number(e.target.value) || null)}
        >
          {kiosks.map((k) => (
            <option key={k.id} value={k.id}>
              {k.raw}
            </option>
          ))}
        </select>
        <span className={`${s.count} ${isFull ? s.countFull : ''}`}>
          {banners.length} / {MAX_BANNERS_PER_KIOSK}장
        </span>
      </div>

      <div className={s.body}>
        {notice ? (
          <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div>
        ) : null}

        {isPending ? (
          <div className={s.empty}>배너를 불러오는 중…</div>
        ) : isError ? (
          <div className={s.empty}>배너를 불러오지 못했습니다.</div>
        ) : banners.length === 0 ? (
          <div className={s.empty}>
            이 키오스크에 노출되는 배너가 없습니다. <Link to="/admin/banners">배너 등록 관리</Link>에서 추가하세요.
          </div>
        ) : (
          <div className={s.list}>
            {banners.map((b, i) => {
              const dropCls =
                overIdx === i && dragIdx != null && dragIdx !== i
                  ? dragIdx < i
                    ? s.dropAfter
                    : s.dropBefore
                  : '';
              return (
                <div
                  key={b.bannerId}
                  className={`${s.row} ${s.draggable} ${dragIdx === i ? s.dragging : ''} ${dropCls}`}
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
                    if (from != null) void applyOrder(from, i);
                  }}
                  onDragEnd={clearDrag}
                >
                  <span className={s.handle} title="드래그해서 순서 변경">
                    ⠿<span className={s.order}>{i + 1}</span>
                  </span>
                  <div className={`${s.thumbWrap} ${s.wide}`}>
                    <img className={s.thumb} src={b.imageUrl} alt={`배너 ${i + 1}`} draggable={false} />
                  </div>
                  <div className={s.meta} style={{ flex: 'none', width: 150 }}>
                    <div className={s.metaRow}>
                      <span className={s.metaLabel}>기간</span>
                      {formatPeriod(b.startDate, b.endDate)}
                    </div>
                  </div>
                  <div className={s.actions}>
                    <button
                      type="button"
                      className={s.iconBtn}
                      onClick={() => applyOrder(i, i - 1)}
                      disabled={i === 0}
                      title="위로"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={s.iconBtn}
                      onClick={() => applyOrder(i, i + 1)}
                      disabled={i === banners.length - 1}
                      title="아래로"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`${s.iconBtn} ${s.deleteBtn}`}
                      onClick={() => unassign(b.bannerId)}
                    >
                      내리기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={s.hint}>
          · 이 화면은 <b>이 키오스크에 뜨는 배너를 확인하고 순서를 바꾸는</b> 곳입니다. 등록·이미지 교체·삭제는{' '}
          <Link to="/admin/banners">배너 등록 관리</Link>에서 합니다.
          <br />· <b>순서는 키오스크마다 독립</b>입니다. 여기서 바꿔도 다른 키오스크 순서는 그대로입니다.
          <br />· <b>내리기</b>는 이 키오스크에서만 제외하는 것이며, 배너 자체와 다른 키오스크 노출은 유지됩니다.
          <br />· 노출 기간이 지난 배너도 목록에는 보이지만 <b>키오스크 화면에는 표시되지 않습니다</b>.
        </div>
      </div>
    </div>
  );
}
