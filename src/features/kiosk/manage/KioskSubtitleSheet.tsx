import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
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
import {
  useSubtitleLanguageMutations,
  useSubtitleLanguages,
} from '@/hooks/kiosk-api/useSubtitleLanguages';
import styles from './KioskAppManagePage.module.css';

type Props = {
  kioskId?: number;
  /** 미리보기에서 선택된 버튼 — 이 버튼의 자막/영상만 편집. null이면 시트 미표시. */
  button: KioskButtonDto | null;
  onNotice?: (msg: string) => void;
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

/** 자막·영상 시트 — 선택 버튼 1개 스코프 · 전 언어 열 · 언어 그룹 접기/펼치기. */
export function KioskSubtitleSheet({ kioskId, button, onNotice }: Props) {
  const { data: subtitles, isLoading } = useKioskSubtitlesByKiosk(kioskId);
  const { createSubtitle, updateSubtitle, deleteSubtitle } = useKioskSubtitleMutations(kioskId);
  const { data: languages } = useSubtitleLanguages();
  const { addLanguageAsync, deleteLanguageAsync } = useSubtitleLanguageMutations();

  const [addingLang, setAddingLang] = useState(false);
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [showRt, setShowRt] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Drafts>({});
  const [newRows, setNewRows] = useState<Array<{ key: string; buttonId: number }>>([]);
  const [saving, setSaving] = useState(false);
  const prevButtonId = useRef<number | null>(null);

  const buttonId = button?.id ?? null;

  // 선택 버튼이 바뀌면 편집 드래프트 초기화
  useEffect(() => {
    if (prevButtonId.current !== buttonId) {
      prevButtonId.current = buttonId;
      setDrafts({});
      setNewRows([]);
    }
  }, [buttonId]);

  const langList = languages ?? [
    { code: 'KR', name: '한국어', sortOrder: 1, base: true },
    { code: 'EN', name: 'English', sortOrder: 2, base: true },
    { code: 'JP', name: '日本語', sortOrder: 3, base: true },
    { code: 'CN', name: '中文', sortOrder: 4, base: true },
  ];

  const buttonSubs = useMemo(
    () => (subtitles ?? []).filter((s) => s.buttonId === buttonId),
    [subtitles, buttonId],
  );

  const setDraft = (key: string, field: string, value: string) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const valueOf = (key: string, field: string, s: KioskSubtitleDto | null) =>
    drafts[key]?.[field] ?? fieldOf(s, field);

  const isCellDirty = (key: string, field: string, s: KioskSubtitleDto | null) => {
    const d = drafts[key]?.[field];
    return d !== undefined && d !== fieldOf(s, field);
  };

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

  const buildPayload = (key: string, s: KioskSubtitleDto | null, bId: number): KioskSubtitlePayload => {
    const d = drafts[key] ?? {};
    const baseText = (kind: 'main' | 'rt', code: string) => {
      const f = `${kind}:${code}`;
      return d[f] !== undefined ? d[f] || null : fieldOf(s, f) || null;
    };
    const extra: Record<string, SubtitleLangText> = { ...(s?.extraTexts ?? {}) };
    Object.entries(d).forEach(([f, v]) => {
      const [kind, code] = f.split(':');
      if ((kind !== 'main' && kind !== 'rt') || BASE_FIELD[code]) return;
      const cur = extra[code] ?? {};
      extra[code] = { ...cur, [kind]: v || null };
    });
    return {
      kioskId: kioskId!,
      buttonId: bId,
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
    if (!kioskId || !buttonId || dirtyCount.total === 0) return;
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
      onNotice?.(`${code} 언어 열이 추가되었습니다. 기존 자막의 ${code} 텍스트는 빈 값으로 시작합니다.`);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '언어를 추가하지 못했습니다.');
    }
  };

  const removeLanguage = async (code: string) => {
    if (!window.confirm(`${code} 언어 열을 삭제할까요? 입력된 텍스트 데이터는 보존됩니다.`)) return;
    try {
      await deleteLanguageAsync(code);
      onNotice?.('언어가 삭제되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '언어를 삭제하지 못했습니다.');
    }
  };

  const toggleCollapse = (code: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  const allCollapsed = langList.length > 0 && langList.every((l) => collapsed.has(l.code));
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(langList.map((l) => l.code)));

  const textCell = (
    key: string,
    field: string,
    s: KioskSubtitleDto | null,
    opts?: { mono?: boolean; placeholder?: string; limit?: boolean },
  ) => {
    const value = valueOf(key, field, s);
    const over = opts?.limit && subtitleLineCount(value) > MAIN_MAX_LINES;
    return (
      <>
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
        {over ? <span className={styles.sheetLimitHint}>2줄 초과</span> : null}
      </>
    );
  };

  if (!kioskId || !button) return null;

  const entries: Array<{ key: string; s: KioskSubtitleDto | null }> = [
    ...buttonSubs.map((s) => ({ key: `s${s.id}`, s: s as KioskSubtitleDto | null })),
    ...newRows.map((r) => ({ key: r.key, s: null })),
  ];
  if (entries.length === 0) entries.push({ key: `n${button.id}-auto`, s: null });

  const langColsCount = langList.reduce(
    (acc, l) => acc + (collapsed.has(l.code) ? 1 : showRt ? 2 : 1),
    0,
  );
  const totalCols = 2 + langColsCount + 1;

  const langBodyCells = (key: string, s: KioskSubtitleDto | null): ReactElement[] =>
    langList.flatMap((l) => {
      if (collapsed.has(l.code)) {
        const has = !!valueOf(key, `main:${l.code}`, s) || !!valueOf(key, `rt:${l.code}`, s);
        return [
          <td
            key={`${l.code}c`}
            className={styles.sheetCollapsedCell}
            title={`${l.code} 펼치기`}
            onClick={() => toggleCollapse(l.code)}
          >
            {has ? '●' : '·'}
          </td>,
        ];
      }
      const cells = [
        <td key={`${l.code}m`}>{textCell(key, `main:${l.code}`, s, { placeholder: '하단중앙', limit: true })}</td>,
      ];
      if (showRt) {
        cells.push(
          <td key={`${l.code}r`}>{textCell(key, `rt:${l.code}`, s, { placeholder: '우측상단' })}</td>,
        );
      }
      return cells;
    });

  return (
    <div className={`${shared.card} ${styles.sheetWrap}`}>
      <div className={shared.cardHead}>
        <span className={shared.cardTitle}>자막 · 영상 — {button.buttonType}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type='button' className={shared.btnOutline} onClick={toggleAll}>
            {allCollapsed ? '언어 모두 펼치기' : '언어 모두 접기'}
          </button>
          <label className={styles.fieldLabel} style={{ margin: 0, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <input type='checkbox' checked={showRt} onChange={(e) => setShowRt(e.target.checked)} />
            우측상단 자막 열
          </label>
          {!addingLang ? (
            <button type='button' className={shared.btnOutline} onClick={() => setAddingLang(true)}>
              + 언어 열 추가
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
        </div>
      </div>
      <p className={styles.formHint} style={{ margin: '4px 0 8px' }}>
        선택한 버튼의 자막/영상만 편집 · 셀 클릭으로 바로 수정 · 노란 셀 = 저장 전 변경 · 언어 헤더(▾)를 눌러 열을 접거나
        펼칠 수 있습니다 · 하단 자막은 최대 2줄(줄당 전각 30자).
      </p>
      <div className={styles.sheetScroll}>
        <table className={`${styles.sheetTable} ${styles.sheetExcel}`}>
          <thead>
            <tr>
              <th rowSpan={2}>재생키</th>
              <th rowSpan={2}>영상 파일명</th>
              {langList.map((l) => {
                const isCol = collapsed.has(l.code);
                return (
                  <th
                    key={l.code}
                    colSpan={isCol ? 1 : showRt ? 2 : 1}
                    className={styles.sheetLangHead}
                  >
                    <span className={styles.sheetLangHeadInner}>
                      <button
                        type='button'
                        className={styles.sheetCollapseBtn}
                        title={isCol ? `${l.code} 펼치기` : `${l.code} 접기`}
                        onClick={() => toggleCollapse(l.code)}
                      >
                        {isCol ? '▸' : '▾'}
                      </button>
                      {l.code}
                      {!isCol ? <span className={styles.sheetLangName}> · {l.name}</span> : null}
                      {!l.base ? (
                        <button
                          type='button'
                          className={styles.sheetLangDel}
                          title={`${l.code} 언어 열 삭제`}
                          onClick={() => void removeLanguage(l.code)}
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  </th>
                );
              })}
              <th rowSpan={2} aria-label='행 삭제' />
            </tr>
            <tr>
              {langList.flatMap((l) => {
                if (collapsed.has(l.code)) return [<th key={`${l.code}c`} className={styles.sheetSubHead} />];
                const heads = [<th key={`${l.code}m`} className={styles.sheetSubHead}>하단중앙</th>];
                if (showRt) heads.push(<th key={`${l.code}r`} className={styles.sheetSubHead}>우측상단</th>);
                return heads;
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={totalCols} className={shared.tableStateCell}>
                  불러오는 중…
                </td>
              </tr>
            ) : (
              <>
                {entries.map(({ key, s }) => (
                  <tr key={key} className={styles.sheetBtnRow}>
                    <td>{textCell(key, 'playKey', s, { mono: true, placeholder: '자동' })}</td>
                    <td>{textCell(key, 'videoFileName', s, { mono: true, placeholder: '영상 파일명' })}</td>
                    {langBodyCells(key, s)}
                    <td>
                      {s ? (
                        <button
                          type='button'
                          className={styles.sheetDelBtn}
                          onClick={() => void removeSubtitle(s)}
                          aria-label='자막 삭제'
                        >
                          ×
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                <tr className={styles.sheetSubRow}>
                  <td colSpan={totalCols}>
                    <span
                      className={styles.sheetGhostRow}
                      role='button'
                      onClick={() =>
                        setNewRows((prev) => [
                          ...prev,
                          { key: `n${button.id}-${prev.length + 1}x`, buttonId: button.id },
                        ])
                      }
                    >
                      + 자막 행 추가
                    </span>
                  </td>
                </tr>
              </>
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
