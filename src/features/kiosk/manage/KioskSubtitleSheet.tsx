import { useEffect, useMemo, useRef, useState } from 'react';
import shared from '@commons/shared.module.css';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import type {
  KioskSubtitleDto,
  KioskSubtitlePayload,
  SubtitleLangText,
} from '@/hooks/kiosk-api/kioskSubtitleTypes';
import {
  useKioskSubtitleMutations,
  useKioskSubtitlesByKiosk,
} from '@/hooks/kiosk-api/useKioskButtonSubtitles';
import { useKioskButtonImage } from '@/hooks/kiosk-api/useKioskButtonImage';
import {
  useSubtitleLanguageMutations,
  useSubtitleLanguages,
} from '@/hooks/kiosk-api/useSubtitleLanguages';
import { positionLabel, sortByLinePosition } from './constants';
import styles from './KioskAppManagePage.module.css';

type Props = {
  kioskId?: number;
  buttons: KioskButtonDto[];
  onNotice?: (msg: string) => void;
  /** 미리보기 타일 클릭 → 해당 버튼 행으로 스크롤 */
  focusButtonId?: number | null;
};

/**
 * 하단 중앙 자막 2줄 제한 — 키오스크 실측(컨테이너 2096px / 폰트 68px ≈ 전각 30자/줄).
 * 반각(라틴·숫자·공백)=0.5자, \n 은 수동 줄바꿈. 백엔드 검증과 동일 규칙.
 */
const MAIN_CHARS_PER_LINE = 30;
const MAIN_MAX_LINES = 2;

export function subtitleLineCount(text: string): number {
  if (!text) return 0;
  let lines = 0;
  for (const seg of text.split('\n')) {
    let units = 0;
    for (const ch of seg) units += ch.codePointAt(0)! <= 0x2ff ? 0.5 : 1;
    lines += Math.max(1, Math.ceil(units / MAIN_CHARS_PER_LINE));
  }
  return lines;
}

/** 기본 4개 언어 코드 ↔ 고정 필드 매핑. 그 외 코드는 extraTexts 저장. */
const BASE_FIELD: Record<string, { main: keyof KioskSubtitleDto; rt: keyof KioskSubtitleDto }> = {
  KR: { main: 'mainKr', rt: 'rtKr' },
  EN: { main: 'mainEn', rt: 'rtEn' },
  JP: { main: 'mainJp', rt: 'rtJp' },
  CN: { main: 'mainCn', rt: 'rtCn' },
};

/** 드래프트 키: `s{subtitleId}` 기존 / `n{buttonId}-{seq}` 신규. 필드 키: videoFileName·playKey·main:{lang}·rt:{lang} */
type Drafts = Record<string, Record<string, string>>;

function fieldOf(s: KioskSubtitleDto | null, field: string): string {
  if (!s) return '';
  if (field === 'videoFileName') return s.videoKey ?? '';
  if (field === 'playKey') return s.playKey ?? '';
  const [kind, lang] = field.split(':');
  const base = BASE_FIELD[lang];
  if (base) return (s[kind === 'main' ? base.main : base.rt] as string | null | undefined) ?? '';
  const t = s.extraTexts?.[lang];
  return (kind === 'main' ? t?.main : t?.rt) ?? '';
}

/** 자막·영상 시트 — 모달 없이 셀 직접 편집, 언어 선택/추가, 하단 자막 2줄 제한. */
export function KioskSubtitleSheet({ kioskId, buttons, onNotice, focusButtonId }: Props) {
  const { data: subtitles, isLoading } = useKioskSubtitlesByKiosk(kioskId);
  const { createSubtitle, updateSubtitle, deleteSubtitle } = useKioskSubtitleMutations(kioskId);
  const { uploadImageAsync, deleteImageAsync } = useKioskButtonImage();
  const { data: languages } = useSubtitleLanguages();
  const { addLanguageAsync, deleteLanguageAsync } = useSubtitleLanguageMutations();

  const [lang, setLang] = useState('KR');
  const [addingLang, setAddingLang] = useState(false);
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [drafts, setDrafts] = useState<Drafts>({});
  const [newRows, setNewRows] = useState<Array<{ key: string; buttonId: number }>>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingUploadButton = useRef<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    setDrafts({});
    setNewRows([]);
  }, [kioskId]);

  useEffect(() => {
    if (focusButtonId == null) return;
    rowRefs.current.get(focusButtonId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusButtonId]);

  const langList = languages ?? [
    { code: 'KR', name: '한국어', sortOrder: 1, base: true },
    { code: 'EN', name: 'English', sortOrder: 2, base: true },
    { code: 'JP', name: '日本語', sortOrder: 3, base: true },
    { code: 'CN', name: '中文', sortOrder: 4, base: true },
  ];
  const currentLang = langList.find((l) => l.code === lang) ?? langList[0];

  // 모든 버튼을 자막 편집 대상으로 노출 — 화면 표시(line>=1) 먼저, 미표시(OFF_MAIN, line<1) 는 뒤로.
  const visibleButtons = useMemo(() => {
    const shown = sortByLinePosition(buttons.filter((b) => b.line >= 1));
    const hidden = buttons.filter((b) => b.line < 1).sort((a, b) => a.id - b.id);
    return [...shown, ...hidden];
  }, [buttons]);
  const byButton = useMemo(() => {
    const m = new Map<number, KioskSubtitleDto[]>();
    (subtitles ?? []).forEach((s) => {
      if (s.buttonId == null) return;
      const list = m.get(s.buttonId) ?? [];
      list.push(s);
      m.set(s.buttonId, list);
    });
    return m;
  }, [subtitles]);

  const setDraft = (key: string, field: string, value: string) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const valueOf = (key: string, field: string, s: KioskSubtitleDto | null) =>
    drafts[key]?.[field] ?? fieldOf(s, field);

  const isCellDirty = (key: string, field: string, s: KioskSubtitleDto | null) => {
    const d = drafts[key]?.[field];
    return d !== undefined && d !== fieldOf(s, field);
  };

  // 행 하나의 드래프트가 실제 변경/입력을 담고 있나
  const rowHasChange = (key: string, s: KioskSubtitleDto | null) => {
    const d = drafts[key];
    if (!d) return false;
    return Object.entries(d).some(([f, v]) => v !== fieldOf(s, f));
  };

  const dirtyCount = useMemo(() => {
    let updates = 0;
    let creates = 0;
    Object.keys(drafts).forEach((key) => {
      if (key.startsWith('s')) {
        const id = Number(key.slice(1));
        const s = (subtitles ?? []).find((x) => x.id === id) ?? null;
        if (s && rowHasChange(key, s)) updates += 1;
      } else if (Object.values(drafts[key]).some((v) => (v ?? '').trim() !== '')) {
        creates += 1;
      }
    });
    return { updates, creates, total: updates + creates };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, subtitles]);

  // 2줄 초과 셀 존재 여부 (모든 언어의 main 드래프트 검사)
  const overLimitExists = useMemo(
    () =>
      Object.values(drafts).some((d) =>
        Object.entries(d).some(
          ([f, v]) => f.startsWith('main:') && subtitleLineCount(v) > MAIN_MAX_LINES,
        ),
      ),
    [drafts],
  );

  const resetDrafts = () => {
    setDrafts({});
    setNewRows([]);
  };

  // 저장 payload: 원본 전체 필드 보존 + 모든 언어의 드래프트 병합
  const buildPayload = (key: string, s: KioskSubtitleDto | null, buttonId: number): KioskSubtitlePayload => {
    const d = drafts[key] ?? {};
    const baseText = (kind: 'main' | 'rt', code: string) => {
      const f = `${kind}:${code}`;
      return d[f] !== undefined ? d[f] || null : fieldOf(s, f) || null;
    };
    // extraTexts: 원본 + 드래프트(비기본 언어) 병합
    const extra: Record<string, SubtitleLangText> = { ...(s?.extraTexts ?? {}) };
    Object.entries(d).forEach(([f, v]) => {
      const [kind, code] = f.split(':');
      if ((kind !== 'main' && kind !== 'rt') || BASE_FIELD[code]) return;
      const cur = extra[code] ?? {};
      extra[code] = { ...cur, [kind]: v || null };
    });
    return {
      kioskId: kioskId!,
      buttonId,
      playKey: d.playKey !== undefined ? d.playKey || null : (s?.playKey ?? null),
      videoFileName:
        d.videoFileName !== undefined ? d.videoFileName || null : (s?.videoKey ?? null),
      autoTrigger: s?.autoTrigger ?? null,
      sortOrder: s?.sortOrder ?? null,
      mainKr: baseText('main', 'KR'),
      mainEn: baseText('main', 'EN'),
      mainJp: baseText('main', 'JP'),
      mainCn: baseText('main', 'CN'),
      rtKr: baseText('rt', 'KR'),
      rtEn: baseText('rt', 'EN'),
      rtJp: baseText('rt', 'JP'),
      rtCn: baseText('rt', 'CN'),
      playCondition: s?.playCondition ?? null,
      description: s?.description ?? null,
      extraTexts: Object.keys(extra).length > 0 ? extra : null,
    };
  };

  const saveAll = async () => {
    if (!kioskId || dirtyCount.total === 0) return;
    if (overLimitExists) {
      onNotice?.('하단 중앙 자막이 2줄을 넘는 셀이 있습니다. 빨간 셀을 줄여주세요.');
      return;
    }
    setSaving(true);
    let ok = 0;
    let fail = 0;
    for (const key of Object.keys(drafts)) {
      try {
        if (key.startsWith('s')) {
          const id = Number(key.slice(1));
          const s = (subtitles ?? []).find((x) => x.id === id) ?? null;
          if (!s || !rowHasChange(key, s)) continue;
          await updateSubtitle({ id, payload: buildPayload(key, s, s.buttonId!) });
          ok += 1;
        } else {
          if (!Object.values(drafts[key]).some((v) => (v ?? '').trim() !== '')) continue;
          const buttonId = Number(key.slice(1).split('-')[0]);
          if (!Number.isInteger(buttonId) || buttonId <= 0) continue;
          await createSubtitle(buildPayload(key, null, buttonId));
          ok += 1;
        }
      } catch {
        fail += 1;
      }
    }
    setSaving(false);
    resetDrafts();
    onNotice?.(fail === 0 ? `자막 ${ok}건이 저장되었습니다.` : `저장 ${ok}건 성공, ${fail}건 실패.`);
  };

  const removeSubtitle = async (s: KioskSubtitleDto) => {
    if (!window.confirm('이 자막 행을 삭제하시겠습니까?')) return;
    try {
      await deleteSubtitle(s.id);
      onNotice?.('자막이 삭제되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '자막을 삭제하지 못했습니다.');
    }
  };

  const submitNewLanguage = async () => {
    const code = newLangCode.trim().toUpperCase();
    if (!/^[A-Z]{2,8}$/.test(code)) {
      onNotice?.('언어 코드는 영문 2~8자여야 합니다. (예: FR)');
      return;
    }
    try {
      await addLanguageAsync({ code, name: newLangName.trim() || undefined });
      setAddingLang(false);
      setNewLangCode('');
      setNewLangName('');
      setLang(code);
      onNotice?.(`${code} 언어가 추가되었습니다. 기존 자막의 ${code} 텍스트는 빈 값으로 시작합니다.`);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '언어를 추가하지 못했습니다.');
    }
  };

  const removeLanguage = async () => {
    if (!currentLang || currentLang.base) return;
    if (!window.confirm(`${currentLang.code}(${currentLang.name}) 언어를 삭제할까요? 입력된 텍스트 데이터는 보존됩니다.`))
      return;
    try {
      await deleteLanguageAsync(currentLang.code);
      setLang('KR');
      onNotice?.('언어가 삭제되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '언어를 삭제하지 못했습니다.');
    }
  };

  const pickImage = (buttonId: number) => {
    pendingUploadButton.current = buttonId;
    fileInputRef.current?.click();
  };

  const onFilePicked = async (file: File | null) => {
    const buttonId = pendingUploadButton.current;
    pendingUploadButton.current = null;
    if (!file || buttonId == null) return;
    try {
      setUploadingId(buttonId);
      await uploadImageAsync({ buttonId, file });
      onNotice?.('버튼 이미지가 업로드되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '이미지를 업로드하지 못했습니다.');
    } finally {
      setUploadingId(null);
    }
  };

  const removeImage = async (b: KioskButtonDto) => {
    if (!window.confirm(`${b.buttonType} 버튼 이미지를 제거할까요? (프리셋 아이콘으로 복귀)`)) return;
    try {
      await deleteImageAsync(b.id);
      onNotice?.('버튼 이미지가 제거되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '이미지를 제거하지 못했습니다.');
    }
  };

  const textCell = (
    key: string,
    field: string,
    s: KioskSubtitleDto | null,
    opts?: { mono?: boolean; placeholder?: string; limit?: boolean },
  ) => {
    const value = valueOf(key, field, s);
    const over = opts?.limit && subtitleLineCount(value) > MAIN_MAX_LINES;
    return (
      <div>
        <input
          type='text'
          className={`${styles.sheetInput} ${opts?.mono ? styles.sheetMono : ''} ${
            isCellDirty(key, field, s) ? styles.sheetDirty : ''
          } ${over ? styles.sheetOverLimit : ''}`}
          value={value}
          placeholder={opts?.placeholder}
          onChange={(e) => setDraft(key, field, e.target.value)}
          disabled={saving}
          title={opts?.limit ? `키오스크 화면 기준 최대 ${MAIN_MAX_LINES}줄 (줄당 전각 ${MAIN_CHARS_PER_LINE}자)` : undefined}
        />
        {over ? <span className={styles.sheetLimitHint}>2줄 초과 — 줄여주세요</span> : null}
      </div>
    );
  };

  if (!kioskId) return null;

  return (
    <div className={`${shared.card} ${styles.sheetWrap}`}>
      <div className={shared.cardHead}>
        <span className={shared.cardTitle}>자막 · 영상 시트</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label className={styles.fieldLabel} htmlFor='sheet-lang' style={{ margin: 0 }}>
            언어
          </label>
          <select
            id='sheet-lang'
            className={styles.select}
            style={{ width: 'auto', minWidth: 130 }}
            value={currentLang?.code ?? 'KR'}
            onChange={(e) => setLang(e.target.value)}
          >
            {langList.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} · {l.name}
              </option>
            ))}
          </select>
          {!addingLang ? (
            <button type='button' className={shared.btnOutline} onClick={() => setAddingLang(true)}>
              + 언어 추가
            </button>
          ) : (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input
                type='text'
                className={styles.input}
                style={{ width: 72 }}
                placeholder='코드(FR)'
                value={newLangCode}
                onChange={(e) => setNewLangCode(e.target.value)}
                maxLength={8}
              />
              <input
                type='text'
                className={styles.input}
                style={{ width: 120 }}
                placeholder='표시명(선택)'
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
              />
              <button type='button' className={shared.btnPrimary} onClick={() => void submitNewLanguage()}>
                추가
              </button>
              <button type='button' className={shared.btnOutline} onClick={() => setAddingLang(false)}>
                취소
              </button>
            </span>
          )}
          {currentLang && !currentLang.base ? (
            <button type='button' className={shared.btnOutline} onClick={() => void removeLanguage()}>
              언어 삭제
            </button>
          ) : null}
        </div>
      </div>
      <p className={styles.formHint} style={{ margin: '4px 0 8px' }}>
        셀 클릭으로 바로 수정 · 노란 셀 = 저장 전 변경 · 하단 자막은 키오스크 화면 기준 최대 2줄(줄당 전각 30자) ·
        현재 편집 언어: <strong>{currentLang?.code}</strong>
        {currentLang && !currentLang.base ? ' (추가 언어 — 실기기 표시는 앱 업데이트 필요)' : ''}
      </p>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        onChange={(e) => {
          void onFilePicked(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      <div className={shared.tableResponsive}>
        <table className={styles.sheetTable}>
          <colgroup>
            <col style={{ width: 86 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 110 }} />
            <col />
            <col />
            <col />
            <col style={{ width: 36 }} />
          </colgroup>
          <thead>
            <tr>
              <th>위치</th>
              <th>이미지</th>
              <th>버튼</th>
              <th>재생키</th>
              <th>영상 파일명</th>
              <th>{`자막 · 하단 중앙 (${currentLang?.code})`}</th>
              <th>{`자막 · 우측상단 (${currentLang?.code})`}</th>
              <th aria-label='행 삭제' />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className={shared.tableStateCell}>
                  불러오는 중…
                </td>
              </tr>
            ) : (
              visibleButtons.map((b) => {
                const subs = byButton.get(b.id) ?? [];
                const btnNewRows = newRows.filter((r) => r.buttonId === b.id);
                const entries: Array<{ key: string; s: KioskSubtitleDto | null }> = [
                  ...subs.map((s) => ({ key: `s${s.id}`, s: s as KioskSubtitleDto | null })),
                  ...btnNewRows.map((r) => ({ key: r.key, s: null })),
                ];
                if (entries.length === 0) entries.push({ key: `n${b.id}-auto`, s: null });
                const rowSpan = entries.length + 1;
                const focused = focusButtonId === b.id;
                const code = currentLang?.code ?? 'KR';

                const rows: JSX.Element[] = entries.map(({ key, s }, idx) => (
                  <tr
                    key={key}
                    ref={(el) => {
                      if (idx === 0 && el) rowRefs.current.set(b.id, el);
                    }}
                    className={idx === 0 ? styles.sheetBtnRow : styles.sheetSubRow}
                  >
                    {idx === 0 ? (
                      <>
                        <td rowSpan={rowSpan} style={focused ? { background: '#eff6ff' } : undefined}>
                          <span className={styles.sheetPosBadge}>
                            {positionLabel(b.line, b.position, b.span)}
                          </span>
                          {b.span === 2 ? <span className={styles.sheetSpanBadge}>2칸</span> : null}
                          {b.placement === 'FIXED' ? (
                            <span className={styles.sheetSpanBadge}>고정</span>
                          ) : null}
                        </td>
                        <td rowSpan={rowSpan}>
                          <button
                            type='button'
                            className={styles.sheetThumbBtn}
                            title={b.imageUrl ? '이미지 교체 (더블클릭: 제거)' : '이미지 업로드'}
                            onClick={() => pickImage(b.id)}
                            onDoubleClick={() => b.imageUrl && void removeImage(b)}
                            disabled={uploadingId === b.id}
                          >
                            {uploadingId === b.id ? '…' : b.imageUrl ? <img src={b.imageUrl} alt='' /> : '+'}
                          </button>
                        </td>
                        <td rowSpan={rowSpan}>
                          <div className={shared.tdBold}>{b.buttonType}</div>
                        </td>
                      </>
                    ) : null}
                    <td>{textCell(key, 'playKey', s, { mono: true, placeholder: '자동 생성' })}</td>
                    <td>{textCell(key, 'videoFileName', s, { mono: true, placeholder: '영상 파일명' })}</td>
                    <td>{textCell(key, `main:${code}`, s, { placeholder: '하단 중앙 자막', limit: true })}</td>
                    <td>{textCell(key, `rt:${code}`, s, { placeholder: '우측 상단(선택)' })}</td>
                    <td>
                      {s ? (
                        <button
                          type='button'
                          className={styles.sheetDelBtn}
                          onClick={() => void removeSubtitle(s)}
                          aria-label={`${b.buttonType} 자막 삭제`}
                        >
                          ×
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ));

                rows.push(
                  <tr key={`ghost-${b.id}`} className={styles.sheetSubRow}>
                    <td colSpan={5}>
                      <span
                        className={styles.sheetGhostRow}
                        onClick={() =>
                          setNewRows((prev) => [
                            ...prev,
                            { key: `n${b.id}-${prev.length + 1}x`, buttonId: b.id },
                          ])
                        }
                        role='button'
                      >
                        + 자막 행 추가
                      </span>
                    </td>
                  </tr>,
                );
                return rows;
              })
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.sheetSaveBar}>
        <span className={styles.sheetDirtyCount}>
          {dirtyCount.total > 0
            ? `수정 ${dirtyCount.updates} · 추가 ${dirtyCount.creates} — 저장 전`
            : '변경 없음'}
          {overLimitExists ? ' · 2줄 초과 셀 있음' : ''}
        </span>
        <button type='button' className={shared.btnOutline} onClick={resetDrafts} disabled={saving || dirtyCount.total === 0}>
          되돌리기
        </button>
        <button
          type='button'
          className={shared.btnPrimary}
          onClick={() => void saveAll()}
          disabled={saving || dirtyCount.total === 0 || overLimitExists}
        >
          {saving ? '저장 중…' : `변경 저장${dirtyCount.total ? ` (${dirtyCount.total})` : ''}`}
        </button>
      </div>
    </div>
  );
}
