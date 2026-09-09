// 배경 사진 관리 — 배경은 의상·키오스크와 무관한 독립 소재다(2026-09-09 개편).
//
// 등록에 필요한 것은 셋뿐이다: 사진 · 고유 번호 · 이름(8개 언어).
// 고유 번호는 노출 순서이자 앱이 AR 합성에 넘기는 값이라 전체에서 유일해야 한다 —
// 겹치면 서버가 거절하므로(BG4013) 여기서는 실패 사유를 그대로 보여 준다.
import { useMemo, useRef, useState } from 'react';
import shared from '@commons/shared.module.css';

import ImageZoom from '@components/common/ImageZoom';
import {
  useAddBackground,
  useDeleteBackground,
  useGetBackgrounds,
  useUpdateBackground,
} from '@/hooks/background-api/useBackgrounds';
import {
  NAME_FIELDS,
  type Background,
  type BackgroundNames,
  type BackgroundWriteBody,
} from '@/hooks/background-api/backgroundApiTypes';
import s from './BackgroundManagePage.module.css';

/** 서버 에러 메시지를 그대로 꺼낸다 — 번호 중복·가로 사진·필수값 누락이 전부 여기로 온다. */
function errorText(e: unknown): string {
  const res = (e as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message ?? '요청을 처리하지 못했습니다.';
}

/** 편집 중인 배경. id 가 없으면 신규 등록이다. */
type Draft = { id?: number; no: string; names: BackgroundNames };

const EMPTY_DRAFT: Draft = { no: '', names: {} };

export default function BackgroundManagePage() {
  const { backgrounds, isLoading, error, refetch } = useGetBackgrounds();
  const { addBackgroundAsync, isPending: adding } = useAddBackground();
  const { updateBackgroundAsync, isPending: updating } = useUpdateBackground();
  const { deleteBackgroundAsync } = useDeleteBackground();

  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const saving = adding || updating;

  // 번호·이름으로 거른다 — 배경이 늘어나면 "몇 번이 뭐였더라"를 가장 자주 본다.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return backgrounds;
    return backgrounds.filter(
      (b) =>
        String(b.backgroundNo).includes(q) ||
        NAME_FIELDS.some((f) => (b[f.key] ?? '').toLowerCase().includes(q)),
    );
  }, [backgrounds, query]);

  /** 등록 폼을 연다. 번호는 쓰지 않은 다음 번호를 미리 채워 준다. */
  const openCreate = () => {
    const nextNo = backgrounds.reduce((max, b) => Math.max(max, b.backgroundNo), 0) + 1;
    setDraft({ no: String(nextNo), names: {} });
    setFile(null);
    setNotice(null);
  };

  const openEdit = (b: Background) => {
    const names: BackgroundNames = {};
    NAME_FIELDS.forEach((f) => {
      names[f.key] = b[f.key] ?? '';
    });
    setDraft({ id: b.id, no: String(b.backgroundNo), names });
    setFile(null);
    setNotice(null);
  };

  const closeForm = () => {
    setDraft(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    if (!draft) return;
    const no = Number(draft.no);
    if (!Number.isInteger(no) || no < 1) {
      setNotice({ text: '배경 번호는 1 이상의 정수여야 합니다.', ok: false });
      return;
    }
    if (draft.id === undefined && !file) {
      setNotice({ text: '배경 사진을 첨부해 주세요.', ok: false });
      return;
    }
    // 빈 칸은 아예 보내지 않는다 — 서버가 "보낸 언어만" 덮어쓰므로, "" 를 보내면 지우는 게 된다.
    const body: BackgroundWriteBody = { backgroundNo: no };
    NAME_FIELDS.forEach((f) => {
      const v = (draft.names[f.key] ?? '').trim();
      if (v) body[f.key] = v;
    });

    try {
      if (draft.id === undefined) {
        await addBackgroundAsync({ body, image: file as File });
        setNotice({ text: `${no}번 배경을 등록했습니다.`, ok: true });
      } else {
        await updateBackgroundAsync({ id: draft.id, body, image: file ?? undefined });
        setNotice({ text: `${no}번 배경을 수정했습니다.`, ok: true });
      }
      closeForm();
      refetch();
    } catch (e) {
      setNotice({ text: errorText(e), ok: false });
    }
  };

  const toggleStatus = async (b: Background) => {
    try {
      await updateBackgroundAsync({
        id: b.id,
        body: { status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
      });
      setNotice({ text: `${b.backgroundNo}번 상태를 바꿨습니다.`, ok: true });
    } catch (e) {
      setNotice({ text: errorText(e), ok: false });
    }
  };

  const remove = async (b: Background) => {
    if (!window.confirm(`${b.backgroundNo}번 배경을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    try {
      await deleteBackgroundAsync(b.id);
      setNotice({ text: `${b.backgroundNo}번을 삭제했습니다.`, ok: true });
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
            촬영 배경을 등록합니다. 사진 · 고유 번호 · 이름만 입력하면 됩니다.
          </p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={s.toolbar}>
          <input
            className={s.search}
            placeholder="번호 · 이름으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={s.spacer} />
          <button type="button" className={s.primaryBtn} disabled={saving} onClick={openCreate}>
            배경 등록
          </button>
        </div>

        <p className={s.hint}>
          <b>배경 번호</b>는 1부터 매기는 고유 번호입니다 — 노출 순서이자 합성에 넘어가는 값이라
          다른 배경과 겹칠 수 없습니다. 사진은 <b>세로</b>이기만 하면 되고, 서버가 9:16 으로 잘라
          저장합니다. 이름은 한국어만 넣어도 되며 번역이 없는 언어는 한국어로 표시됩니다.
        </p>

        {draft && (
          <div className={s.form}>
            <div className={s.formTitle}>
              {draft.id === undefined ? '배경 등록' : `${draft.no}번 배경 수정`}
            </div>

            <div className={s.formRow}>
              <label className={s.field}>
                <span className={s.label}>배경 번호</span>
                <input
                  className={s.input}
                  type="number"
                  min={1}
                  value={draft.no}
                  onChange={(e) => setDraft({ ...draft, no: e.target.value })}
                />
              </label>
              <label className={s.field}>
                <span className={s.label}>
                  배경 사진{draft.id === undefined ? '' : ' (비워 두면 기존 사진 유지)'}
                </span>
                <input
                  ref={fileRef}
                  className={s.input}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className={s.nameGrid}>
              {NAME_FIELDS.map((f) => (
                <label key={f.key} className={s.field}>
                  <span className={s.label}>{f.label}</span>
                  <input
                    className={s.input}
                    value={draft.names[f.key] ?? ''}
                    placeholder={f.key === 'nameKr' ? '한라산' : ''}
                    onChange={(e) =>
                      setDraft({ ...draft, names: { ...draft.names, [f.key]: e.target.value } })
                    }
                  />
                </label>
              ))}
            </div>

            <div className={s.formActions}>
              <button type="button" className={s.ghostBtn} onClick={closeForm} disabled={saving}>
                취소
              </button>
              <button type="button" className={s.primaryBtn} onClick={save} disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        )}

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
                <th className={s.noCol}>번호</th>
                <th>이름</th>
                <th>상태</th>
                <th className={s.actionCol}>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <ImageZoom
                      src={b.imageUrl}
                      alt={b.nameKr ?? `배경 ${b.backgroundNo}`}
                      className={s.thumb}
                    />
                  </td>
                  <td>
                    <span className={s.no}>{b.backgroundNo}</span>
                  </td>
                  <td>
                    {b.nameKr ? (
                      <>
                        <div>{b.nameKr}</div>
                        <div className={s.subNames}>
                          {NAME_FIELDS.filter((f) => f.key !== 'nameKr' && b[f.key])
                            .map((f) => b[f.key])
                            .join(' · ') || <span className={s.muted}>번역 없음</span>}
                        </div>
                      </>
                    ) : (
                      <span className={s.muted}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={b.status === 'ACTIVE' ? s.active : s.inactive}>
                      {b.status === 'ACTIVE' ? '노출' : '숨김'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className={s.ghostBtn} onClick={() => openEdit(b)}>
                      수정
                    </button>
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
