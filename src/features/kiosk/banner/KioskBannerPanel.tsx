// 키오스크 하단 배너 관리 패널 — 키오스크를 고르고 그 키오스크의 배너만 다룬다(키오스크 중심).
// 업로드는 1장씩(서버가 멀티파트 `image` 단건만 받는다). 순서 변경은 위/아래 이동으로 처리.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useGetKiosks } from '@/hooks/useGetKiosks';
import { useKioskBanners, kioskBannersKey } from '@/hooks/kiosk-api/useKioskBanners';
import { useAddKioskBanner } from '@/hooks/kiosk-api/useAddKioskBanner';
import { useDeleteKioskBanner } from '@/hooks/kiosk-api/useDeleteKioskBanner';
import { useReorderKioskBanners } from '@/hooks/kiosk-api/useReorderKioskBanners';
import { MAX_KIOSK_BANNERS, MAX_BANNER_FILE_BYTES } from '@/hooks/kiosk-api/kioskBannerTypes';
import s from './KioskBannerManage.module.css';

const MB = 1024 * 1024;

export function KioskBannerPanel() {
  const [kioskId, setKioskId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: kiosksRaw } = useGetKiosks();
  const kiosks = useMemo(() => (Array.isArray(kiosksRaw) ? kiosksRaw : []), [kiosksRaw]);

  // 첫 진입 시 첫 키오스크 자동 선택(버튼 관리 페이지와 동일한 동작)
  useEffect(() => {
    if (kioskId == null && kiosks.length > 0) setKioskId(kiosks[0].id);
  }, [kiosks, kioskId]);

  const { banners, isPending, isError } = useKioskBanners(kioskId ?? undefined);
  const { addKioskBannerAsync, isPending: adding } = useAddKioskBanner();
  const { deleteKioskBannerAsync } = useDeleteKioskBanner();
  const { reorderKioskBannersAsync } = useReorderKioskBanners();

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const refresh = () => qc.invalidateQueries({ queryKey: kioskBannersKey(kioskId ?? undefined) });
  const isFull = banners.length >= MAX_KIOSK_BANNERS;

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = ''; // 같은 파일 재선택 허용
    if (!file || kioskId == null) return;

    if (file.size > MAX_BANNER_FILE_BYTES) {
      setNotice({ text: `파일이 너무 큽니다(${(file.size / MB).toFixed(1)}MB). 최대 20MB까지 등록됩니다.`, ok: false });
      return;
    }
    try {
      await addKioskBannerAsync({ kioskId, image: file });
      await refresh();
      setNotice({ text: '배너를 등록했습니다.', ok: true });
    } catch {
      setNotice({ text: '배너 등록에 실패했습니다.', ok: false });
    }
  };

  const onDelete = async (bannerId: number) => {
    if (kioskId == null) return;
    if (!window.confirm('이 배너를 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      await deleteKioskBannerAsync({ kioskId, bannerId });
      await refresh();
      setNotice({ text: '배너를 삭제했습니다.', ok: true });
    } catch {
      setNotice({ text: '배너 삭제에 실패했습니다.', ok: false });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (kioskId == null) return;
    const next = [...banners];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await reorderKioskBannersAsync({ kioskId, bannerIds: next.map((b) => b.id) });
      await refresh();
    } catch {
      setNotice({ text: '순서 변경에 실패했습니다.', ok: false });
    }
  };

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
              {k.name}
            </option>
          ))}
        </select>
        <span className={`${s.count} ${isFull ? s.countFull : ''}`}>
          {banners.length} / {MAX_KIOSK_BANNERS}장
          {isFull ? ' — 더 등록하려면 기존 배너를 삭제하세요' : ''}
        </span>
      </div>

      {notice ? (
        <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div>
      ) : null}

      {isPending ? (
        <div className={s.empty}>배너를 불러오는 중…</div>
      ) : isError ? (
        <div className={s.empty}>배너를 불러오지 못했습니다.</div>
      ) : (
        <div className={s.grid}>
          {banners.map((b, i) => (
            <div className={s.item} key={b.id}>
              <span className={s.order}>{i + 1}</span>
              <div className={s.thumbWrap}>
                <img className={s.thumb} src={b.imageUrl} alt={`배너 ${i + 1}`} />
              </div>
              <div className={s.actions}>
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="위로"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => move(i, 1)}
                  disabled={i === banners.length - 1}
                  title="아래로"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${s.iconBtn} ${s.deleteBtn}`}
                  onClick={() => onDelete(b.id)}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {banners.length === 0 ? (
            <div className={s.empty}>등록된 배너가 없습니다. 아래에서 이미지를 추가하세요.</div>
          ) : null}

          <label className={`${s.uploadArea} ${isFull || adding ? s.uploadDisabled : ''}`}>
            {adding ? '업로드 중…' : isFull ? `최대 ${MAX_KIOSK_BANNERS}장까지 등록할 수 있습니다` : '+ 배너 이미지 추가 (1장씩)'}
            <input
              ref={fileRef}
              type="file"
              className={s.fileInput}
              accept="image/*"
              onChange={onUpload}
              disabled={isFull || adding || kioskId == null}
            />
          </label>
        </div>
      )}

      <div className={s.hint}>
        · 배너는 <b>키오스크마다 독립</b>입니다. 같은 이미지를 다른 지점에도 쓰려면 그 키오스크를 선택해 다시 등록하세요
        (한쪽을 지워도 다른 지점에는 영향이 없습니다).
        <br />· 권장 규격 <b>2160 × 573px</b>(키오스크 하단 배너 영역), 파일 1장당 <b>최대 20MB</b>.
        <br />· 표시 순서는 위 목록 순서와 같으며, ↑↓ 로 바꿀 수 있습니다.
      </div>
    </div>
  );
}
