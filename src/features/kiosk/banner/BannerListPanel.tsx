// 배너 중심 관리(주 화면) — 소재를 만들고 "어디에 띄울지"를 정한다.
// 순서 변경은 키오스크별 속성이라 여기서 하지 않고 '키오스크별 노출' 화면에서 다룬다.
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useGetKiosks } from '@/hooks/useGetKiosks';
import { useBanners, bannersKey } from '@/hooks/kiosk-api/useBanners';
import {
  useCreateBanners,
  useUpdateBanner,
  useReplaceBannerImage,
  useDeleteBanner,
  type BannerTargetPayload,
} from '@/hooks/kiosk-api/useBannerMutations';
import {
  BANNER_STATUS_LABEL,
  formatPeriod,
  MAX_BANNER_FILE_BYTES,
  type BannerDto,
} from '@/hooks/kiosk-api/bannerTypes';
import { parseKiosk, summarizeKiosks } from './bannerKiosk';
import { BannerFormModal } from './BannerFormModal';
import s from './BannerManage.module.css';

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: s.bActive,
  SCHEDULED: s.bScheduled,
  EXPIRED: s.bExpired,
};

export function BannerListPanel() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<BannerDto | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const replaceTargetId = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: kiosksRaw } = useGetKiosks();
  const kiosks = useMemo(
    () => (Array.isArray(kiosksRaw) ? kiosksRaw : []).map(parseKiosk),
    [kiosksRaw],
  );
  const byId = useMemo(() => new Map(kiosks.map((k) => [k.id, k])), [kiosks]);

  const { banners, isPending, isError } = useBanners();
  const { createBannersAsync, isPending: creating } = useCreateBanners();
  const { updateBannerAsync, isPending: updating } = useUpdateBanner();
  const { replaceImageAsync } = useReplaceBannerImage();
  const { deleteBannerAsync } = useDeleteBanner();

  const refresh = () => qc.invalidateQueries({ queryKey: bannersKey });
  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const submit = async (payload: BannerTargetPayload, images: File[]) => {
    try {
      if (modal === 'edit' && editing) {
        await updateBannerAsync({ bannerId: editing.id, payload });
        flash('노출 대상·기간을 수정했습니다.');
      } else {
        await createBannersAsync({ payload, images });
        flash(`배너 ${images.length}장을 등록했습니다.`);
      }
      setModal(null);
      setEditing(null);
      await refresh();
    } catch {
      flash('저장에 실패했습니다. 키오스크당 최대 10장을 넘지 않았는지 확인해 주세요.', false);
    }
  };

  const askReplaceImage = (b: BannerDto) => {
    if (
      !window.confirm(
        `이미지를 교체하면 이 배너가 걸린 ${b.kioskCount}개 키오스크에 즉시 반영됩니다. 계속할까요?`,
      )
    )
      return;
    replaceTargetId.current = b.id;
    imageInputRef.current?.click();
  };

  const onImagePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imageInputRef.current) imageInputRef.current.value = '';
    const bannerId = replaceTargetId.current;
    if (!file || bannerId == null) return;
    if (file.size > MAX_BANNER_FILE_BYTES) return flash('파일이 너무 큽니다(최대 20MB).', false);
    try {
      await replaceImageAsync({ bannerId, image: file });
      await refresh();
      flash('이미지를 교체했습니다.');
    } catch {
      flash('이미지 교체에 실패했습니다.', false);
    }
  };

  const remove = async (b: BannerDto) => {
    if (
      !window.confirm(
        `이 배너를 완전히 삭제합니다. 현재 ${b.kioskCount}개 키오스크에 노출 중이며 모두 내려갑니다. 계속할까요?`,
      )
    )
      return;
    try {
      await deleteBannerAsync(b.id);
      await refresh();
      flash('배너를 삭제했습니다.');
    } catch {
      flash('삭제에 실패했습니다.', false);
    }
  };

  return (
    <div>
      <div className={s.toolbar}>
        <span className={s.selectLabel}>배너 소재</span>
        <span className={s.count}>{banners.length}건</span>
        <button
          type="button"
          className={s.primaryBtn}
          onClick={() => {
            setEditing(null);
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

        {isPending ? (
          <div className={s.empty}>배너를 불러오는 중…</div>
        ) : isError ? (
          <div className={s.empty}>배너를 불러오지 못했습니다.</div>
        ) : banners.length === 0 ? (
          <div className={s.empty}>등록된 배너가 없습니다. 우측 상단에서 추가하세요.</div>
        ) : (
          <div className={s.list}>
            {banners.map((b) => (
              <div className={s.row} key={b.id}>
                <div className={s.thumbWrap}>
                  <img className={s.thumb} src={b.imageUrl} alt={`배너 ${b.id}`} />
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
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => {
                      setEditing(b);
                      setModal('edit');
                    }}
                  >
                    대상·기간
                  </button>
                  <button type="button" className={s.iconBtn} onClick={() => askReplaceImage(b)}>
                    이미지 교체
                  </button>
                  <button
                    type="button"
                    className={`${s.iconBtn} ${s.deleteBtn}`}
                    onClick={() => remove(b)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={s.hint}>
          · 배너 하나를 <b>여러 키오스크에 동시에</b> 걸 수 있습니다. <b>전체 키오스크</b>로 지정하면 앞으로 추가되는
          키오스크에도 자동으로 노출됩니다.
          <br />· <b>노출 순서는 키오스크마다 다릅니다</b> — 순서 변경은 <b>키오스크별 노출</b> 화면에서 합니다.
          <br />· 이미지 교체는 <b>이 배너가 걸린 모든 키오스크에 즉시 반영</b>됩니다.
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        className={s.fileInput}
        accept="image/*"
        onChange={onImagePicked}
      />

      {modal ? (
        <BannerFormModal
          kiosks={kiosks}
          editing={modal === 'edit' ? editing : null}
          submitting={creating || updating}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}
