// 배너 중심 관리(주 탭) — 소재를 만들고 "어디에 띄울지"를 정한다.
// 행은 클릭하면 상세 모달(노출 키오스크 전체·액션)을 연다. 키오스크가 100대로 늘어도 목록이 복잡해지지 않는다.
// 순서 변경은 키오스크별 속성이라 '키오스크별 노출' 탭에서 다룬다.
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import ImageZoom from '@components/common/ImageZoom';
import { useGetKiosks } from '@/hooks/useGetKiosks';
import { useBanners, bannersKey } from '@/hooks/kiosk-api/useBanners';
import {
  useCreateBanners,
  useUpdateBanner,
  useDeleteBanners,
  type BannerTargetPayload,
} from '@/hooks/kiosk-api/useBannerMutations';
import {
  BANNER_STATUS_LABEL,
  formatPeriod,
  type BannerDto,
} from '@/hooks/kiosk-api/bannerTypes';
import { parseKiosk, summarizeKiosks } from './bannerKiosk';
import { BannerFormModal } from './BannerFormModal';
import { BannerDetailModal } from './BannerDetailModal';
import s from './BannerManage.module.css';

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: s.bActive,
  SCHEDULED: s.bScheduled,
  EXPIRED: s.bExpired,
};

export function BannerListPanel() {
  const [modal, setModal] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<BannerDto | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  const { data: kiosksRaw } = useGetKiosks();
  const kiosks = useMemo(
    () => (Array.isArray(kiosksRaw) ? kiosksRaw : []).map(parseKiosk),
    [kiosksRaw],
  );
  const byId = useMemo(() => new Map(kiosks.map((k) => [k.id, k])), [kiosks]);

  const { banners, isPending, isError } = useBanners();

  // 목록이 갱신되면 이미 사라진 배너의 선택은 버린다(유령 선택 방지).
  useEffect(() => {
    setSelected((prev) => {
      const alive = new Set(banners.map((b) => b.id));
      const next = new Set([...prev].filter((id) => alive.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [banners]);
  const { createBannersAsync, isPending: creating } = useCreateBanners();
  const { updateBannerAsync, isPending: updating } = useUpdateBanner();
  const { deleteBannersAsync } = useDeleteBanners();

  const refresh = () => qc.invalidateQueries({ queryKey: bannersKey });
  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  };
  const close = () => {
    setModal(null);
    setSelectedBanner(null);
  };

  const submit = async (payload: BannerTargetPayload, images: File[]) => {
    try {
      if (modal === 'edit' && selectedBanner) {
        await updateBannerAsync({ bannerId: selectedBanner.id, payload, image: images[0] ?? null });
        flash(images.length > 0 ? '이미지와 노출 정보를 수정했습니다.' : '노출 정보를 수정했습니다.');
      } else {
        await createBannersAsync({ payload, images });
        flash(`배너 ${images.length}장을 등록했습니다.`);
      }
      close();
      await refresh();
    } catch {
      flash('저장에 실패했습니다. 키오스크당 최대 10장을 넘지 않았는지 확인해 주세요.', false);
    }
  };

  /** 단건·일괄 공용 삭제. 서버가 한 번의 요청으로 처리하므로 일부만 지워지는 중간 상태가 없다. */
  const removeMany = async (targets: BannerDto[]) => {
    if (targets.length === 0) return;
    const kioskCount = new Set(targets.flatMap((b) => b.kioskIds)).size;
    const what =
      targets.length === 1
        ? '이 배너를 완전히 삭제합니다.'
        : `선택한 배너 ${targets.length}건을 완전히 삭제합니다.`;
    if (!window.confirm(`${what} 현재 ${kioskCount}개 키오스크에 노출 중이며 모두 내려갑니다. 계속할까요?`))
      return;
    try {
      await deleteBannersAsync(targets.map((b) => b.id));
      setSelected(new Set());
      close();
      await refresh();
      flash(`배너 ${targets.length}건을 삭제했습니다.`);
    } catch {
      flash('삭제에 실패했습니다.', false);
    }
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const allChecked = banners.length > 0 && selected.size === banners.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(banners.map((b) => b.id)));

  return (
    <div>
      <div className={s.toolbar}>
        <span className={s.selectLabel}>배너 소재</span>
        <span className={s.count}>{banners.length}건</span>
        <button
          type="button"
          className={s.primaryBtn}
          onClick={() => {
            setSelectedBanner(null);
            setModal('create');
          }}
        >
          + 배너 등록
        </button>
      </div>

      <div className={s.body}>
        {notice ? (
          <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div>
        ) : null}

        {banners.length > 0 ? (
          <div className={`${s.selectBar} ${selected.size > 0 ? s.selectBarActive : ''}`}>
            <label className={s.selectAll}>
              <input
                type="checkbox"
                className={s.checkbox}
                checked={allChecked}
                // 일부만 선택된 상태를 체크박스에 표시한다
                ref={(el) => {
                  if (el) el.indeterminate = selected.size > 0 && !allChecked;
                }}
                onChange={toggleAll}
              />
              전체 선택
            </label>
            {selected.size > 0 ? (
              <>
                <span className={s.selectCount}>{selected.size}건 선택됨</span>
                <button
                  type="button"
                  className={`${s.iconBtn} ${s.deleteBtn}`}
                  onClick={() => removeMany(banners.filter((b) => selected.has(b.id)))}
                >
                  선택 삭제
                </button>
                <button type="button" className={s.iconBtn} onClick={() => setSelected(new Set())}>
                  선택 해제
                </button>
              </>
            ) : (
              <span className={s.selectCount}>여러 건을 골라 한 번에 삭제할 수 있습니다</span>
            )}
          </div>
        ) : null}

        {isPending ? (
          <div className={s.empty}>배너를 불러오는 중…</div>
        ) : isError ? (
          <div className={s.empty}>배너를 불러오지 못했습니다.</div>
        ) : banners.length === 0 ? (
          <div className={s.empty}>등록된 배너가 없습니다. 우측 상단에서 추가하세요.</div>
        ) : (
          <div className={s.list}>
            {banners.map((b) => (
              <div
                className={`${s.row} ${s.rowClickable} ${selected.has(b.id) ? s.rowSelected : ''}`}
                key={b.id}
                onClick={() => {
                  setSelectedBanner(b);
                  setModal('detail');
                }}
              >
                {/* 체크박스 클릭은 선택만 — 행 클릭(상세)과 분리한다 */}
                <label className={s.rowCheck} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className={s.checkbox}
                    checked={selected.has(b.id)}
                    onChange={() => toggle(b.id)}
                    aria-label={`배너 ${b.id} 선택`}
                  />
                </label>
                <div className={s.thumbWrap}>
                  {/* 이미지 클릭은 확대만(행 클릭 상세와 분리 — ImageZoom 이 전파를 막는다) */}
                  <ImageZoom
                    src={b.imageUrl}
                    alt={`배너 ${b.id}`}
                    title={`배너 #${b.id}`}
                    className={s.thumb}
                  />
                </div>
                <div className={s.meta}>
                  <div className={s.metaRow}>
                    <span className={`${s.badge} ${STATUS_CLASS[b.status] ?? ''}`}>
                      {BANNER_STATUS_LABEL[b.status]}
                    </span>
                    {b.targetType === 'ALL' ? (
                      <span className={`${s.badge} ${s.bAll}`}>전체 키오스크</span>
                    ) : null}
                  </div>
                  <div className={s.metaRow}>
                    <span className={s.metaLabel}>노출</span>
                    <b>{b.kioskCount}곳</b>
                    <span className={s.checkCode}>{summarizeKiosks(b.kioskIds, byId)}</span>
                  </div>
                  <div className={s.metaRow}>
                    <span className={s.metaLabel}>기간</span>
                    {formatPeriod(b.startDate, b.endDate)}
                  </div>
                </div>
                <span className={s.chev}>›</span>
              </div>
            ))}
          </div>
        )}

        <div className={s.hint}>
          · <b>행을 클릭</b>하면 상세가 열리고, <b>수정</b>에서 이미지·노출 대상·기간을 한 번에 고칠 수 있습니다. <b>이미지를 클릭</b>하면 원본이
          확대됩니다.
          <br />· 배너 하나를 <b>여러 키오스크에 동시에</b> 걸 수 있습니다. <b>전체 키오스크</b>로 지정하면 앞으로
          추가되는 키오스크에도 자동으로 노출됩니다.
          <br />· <b>여러 건 삭제</b>는 왼쪽 체크박스로 고른 뒤 <b>선택 삭제</b>를 누르세요(전체 선택 가능). 한 번의 요청으로 처리되어 일부만 지워지는 일이 없습니다.
          <br />· <b>노출 순서는 키오스크마다 다릅니다</b> — 순서 변경은 <b>키오스크별 노출</b> 탭에서 합니다.
        </div>
      </div>

      {modal === 'detail' && selectedBanner ? (
        <BannerDetailModal
          banner={selectedBanner}
          byId={byId}
          onClose={close}
          onEdit={() => setModal('edit')}
          onDelete={() => removeMany([selectedBanner])}
        />
      ) : null}

      {modal === 'create' || modal === 'edit' ? (
        <BannerFormModal
          kiosks={kiosks}
          editing={modal === 'edit' ? selectedBanner : null}
          submitting={creating || updating}
          onClose={close}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}
