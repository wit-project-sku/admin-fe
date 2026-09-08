// 배경 사진 관리 — 배경은 의상에 딸린다(한 배경을 여러 의상이 공용할 수 있다).
//
// 등록은 파일명이 곧 코드다: `14.1.1-2-CB.png` → 의상 14.1 의 2번 배경.
// 서버가 코드에서 의상을 찾아 연결하므로 이 화면에서 의상을 고를 필요가 없다.
// 코드에 없는 의상이면 서버가 거절한다 — 잘못된 연결이 조용히 저장되지 않게 하는 게 목적이라
// 여기서는 실패 사유를 그대로 보여 준다.
import { useMemo, useRef, useState } from 'react';
import shared from '@commons/shared.module.css';

import ImageZoom from '@components/common/ImageZoom';
import {
  useAddBackgrounds,
  useDeleteBackground,
  useGetBackgrounds,
  useUpdateBackground,
} from '@/hooks/background-api/useBackgrounds';
import type { Background } from '@/hooks/background-api/backgroundApiTypes';
import s from './BackgroundManagePage.module.css';

/** 서버 에러 메시지를 그대로 꺼낸다 — 코드 형식·의상 없음·인덱스 중복이 전부 여기로 온다. */
function errorText(e: unknown): string {
  const res = (e as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message ?? '요청을 처리하지 못했습니다.';
}

export default function BackgroundManagePage() {
  const { backgrounds, isLoading, error, refetch } = useGetBackgrounds();
  const { addBackgroundsAsync, isPending: uploading } = useAddBackgrounds();
  const { updateBackgroundAsync } = useUpdateBackground();
  const { deleteBackgroundAsync } = useDeleteBackground();

  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [outfitFilter, setOutfitFilter] = useState('');

  // 의상 코드로 거르기 — 배경이 늘어나면 "이 의상에 뭐가 걸려 있나"를 가장 자주 본다.
  const rows = useMemo(() => {
    const q = outfitFilter.trim().toLowerCase();
    if (!q) return backgrounds;
    return backgrounds.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        (b.outfits ?? []).some((o) => o.outfitCode.toLowerCase().includes(q)),
    );
  }, [backgrounds, outfitFilter]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      await addBackgroundsAsync({ body: { status: 'ACTIVE' }, images: Array.from(files) });
      setNotice({ text: `${files.length}장을 등록했습니다.`, ok: true });
      refetch();
    } catch (e) {
      setNotice({ text: errorText(e), ok: false });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleStatus = async (b: Background) => {
    try {
      await updateBackgroundAsync({
        id: b.id,
        body: {
          status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
          // 연결은 통째 교체라 현재 값을 그대로 되돌려 보낸다(빈 목록이면 서버가 거절한다).
          outfits: (b.outfits ?? []).map((o) => ({
            outfitId: o.outfitId,
            backgroundIndex: o.backgroundIndex,
          })),
        },
      });
      setNotice({ text: `${b.code} 상태를 바꿨습니다.`, ok: true });
    } catch (e) {
      setNotice({ text: errorText(e), ok: false });
    }
  };

  const remove = async (b: Background) => {
    if (!window.confirm(`${b.code} 배경을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    try {
      await deleteBackgroundAsync(b.id);
      setNotice({ text: `${b.code} 을(를) 삭제했습니다.`, ok: true });
    } catch (e) {
      setNotice({ text: errorText(e), ok: false });
    }
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>배경 사진 관리</h1>
          <p className={shared.pageSubtitle}>
            촬영 배경을 등록하고 어느 의상에 걸릴지 확인합니다. 파일명이 곧 배경 코드입니다.
          </p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={s.toolbar}>
          <input
            className={s.search}
            placeholder="의상 코드 · 배경 코드로 검색 (예: 14.1)"
            value={outfitFilter}
            onChange={(e) => setOutfitFilter(e.target.value)}
          />
          <div className={s.spacer} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            type="button"
            className={s.primaryBtn}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? '등록 중…' : '배경 등록'}
          </button>
        </div>

        <p className={s.hint}>
          파일명을 <code>{'{의상코드}.{식별번호}-{인덱스}-CB'}</code> 로 맞춰 주세요 — 예{' '}
          <code>14.1.1-2-CB.png</code> 은 의상 <b>14.1</b> 의 <b>2번</b> 배경이 됩니다. 인덱스는 한
          의상 안에서 1~5 로 겹칠 수 없고, 세로 사진만 등록됩니다.
        </p>

        {notice && (
          <p className={notice.ok ? s.noticeOk : s.noticeErr} role="alert">
            {notice.text}
          </p>
        )}

        {isLoading ? (
          <p className={s.empty}>불러오는 중…</p>
        ) : error ? (
          <p className={s.noticeErr}>목록을 불러오지 못했습니다.</p>
        ) : rows.length === 0 ? (
          <p className={s.empty}>등록된 배경이 없습니다.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.thumbCol}>이미지</th>
                <th>배경 코드</th>
                <th>연결된 의상</th>
                <th>이름</th>
                <th>상태</th>
                <th className={s.actionCol}>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <ImageZoom src={b.imageUrl} alt={b.code} className={s.thumb} />
                  </td>
                  <td>
                    <code className={s.code}>{b.code}</code>
                  </td>
                  <td>
                    {(b.outfits ?? []).length === 0 ? (
                      <span className={s.muted}>연결 없음</span>
                    ) : (
                      <div className={s.badges}>
                        {(b.outfits ?? []).map((o) => (
                          <span key={o.outfitId} className={s.badge}>
                            {o.outfitCode}
                            <em className={s.index}>#{o.backgroundIndex}</em>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{b.nameKr ?? <span className={s.muted}>—</span>}</td>
                  <td>
                    <span className={b.status === 'ACTIVE' ? s.active : s.inactive}>
                      {b.status === 'ACTIVE' ? '노출' : '숨김'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className={s.ghostBtn} onClick={() => toggleStatus(b)}>
                      {b.status === 'ACTIVE' ? '숨기기' : '노출'}
                    </button>
                    <button type="button" className={s.dangerBtn} onClick={() => remove(b)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
