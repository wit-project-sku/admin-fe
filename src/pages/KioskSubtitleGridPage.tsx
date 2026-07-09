import { useCallback, useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  DataSheetGrid,
  keyColumn,
  textColumn,
  intColumn,
  type Column,
} from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import shared from '@commons/shared.module.css';
import { useGetKiosks } from '@/hooks/useGetKiosks';
import { useKioskButtons } from '@/hooks/kiosk-api/useKioskButtons';
import { useKioskSubtitlesByKiosk } from '@/hooks/kiosk-api/useKioskButtonSubtitles';
import { useKioskSubtitleBulkSave } from '@/hooks/kiosk-api/useKioskSubtitleBulk';
import {
  SUBTITLE_LANGS,
  LANG_FIELD,
  type KioskSubtitleDto,
  type KioskSubtitlePayload,
} from '@/hooks/kiosk-api/kioskSubtitleTypes';

/** 그리드 한 행 = 자막 1개. 모든 텍스트 셀은 문자열, id/buttonId 는 내부 식별용. */
type Row = {
  id: number | null;
  buttonId: number | null;
  buttonName: string;
  playKey: string;
  sortOrder: number | null;
  videoFileName: string;
  playCondition: string;
  description: string;
} & Record<string, string | number | null>;

const COLLAPSED_W = 48;

function dtoToRow(s: KioskSubtitleDto, buttonName: string): Row {
  const row: Row = {
    id: s.id,
    buttonId: s.buttonId ?? null,
    buttonName,
    playKey: s.playKey ?? '',
    sortOrder: s.sortOrder ?? 0,
    videoFileName: s.videoKey ?? '',
    playCondition: s.playCondition ?? '',
    description: s.description ?? '',
  };
  SUBTITLE_LANGS.forEach((lang) => {
    row[`main_${lang}`] = (s[LANG_FIELD[lang].main] as string | null) ?? '';
    row[`rt_${lang}`] = (s[LANG_FIELD[lang].rt] as string | null) ?? '';
  });
  return row;
}

function emptyRow(): Row {
  const row: Row = {
    id: null,
    buttonId: null,
    buttonName: '',
    playKey: '',
    sortOrder: 0,
    videoFileName: '',
    playCondition: '',
    description: '',
  };
  SUBTITLE_LANGS.forEach((lang) => {
    row[`main_${lang}`] = '';
    row[`rt_${lang}`] = '';
  });
  return row;
}

function rowToPayload(row: Row, kioskId: number): KioskSubtitlePayload {
  const p: KioskSubtitlePayload = {
    kioskId,
    buttonId: row.buttonId ?? null,
    playKey: (row.playKey || '').trim() || null,
    sortOrder: row.sortOrder == null ? 0 : Number(row.sortOrder),
    videoFileName: (row.videoFileName || '').trim() || null,
    playCondition: (row.playCondition || '').trim() || null,
    description: (row.description || '').trim() || null,
  };
  if (row.id != null) p.id = row.id;
  SUBTITLE_LANGS.forEach((lang) => {
    const main = (row[`main_${lang}`] as string) || '';
    const rt = (row[`rt_${lang}`] as string) || '';
    (p as unknown as Record<string, string | null>)[LANG_FIELD[lang].main] = main.trim() ? main : null;
    (p as unknown as Record<string, string | null>)[LANG_FIELD[lang].rt] = rt.trim() ? rt : null;
  });
  return p;
}

function rowsEqual(a: Row, b: Row): boolean {
  return Object.keys(a).every((k) => (a[k] ?? '') === (b[k] ?? ''));
}

/** 시트 탭. 앞으로 다른 데이터 영역(행/열 테이블)이 여기에 추가된다. */
type TabKey = 'subtitle';
const TABS: { key: TabKey; label: string }[] = [{ key: 'subtitle', label: '영상 자막' }];

/** 컬럼 헤더: ◂/▸ 캐럿 클릭으로 접기/펼치기, 우측 모서리 드래그로 너비 조절. 그리드가 mousedown 을 선점하므로 stopPropagation 필수. */
function ColHeader({
  label,
  collapsed,
  onToggle,
  onResizeStart,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  onResizeStart: (e: ReactPointerEvent) => void;
}) {
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 3 }}>
      <button
        type='button'
        onMouseDown={stop}
        onPointerDown={stop}
        onDoubleClick={stop}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={collapsed ? '펼치기' : '접기'}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 11,
          color: '#94a3b8',
          padding: 0,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {collapsed ? '▸' : '◂'}
      </button>
      {collapsed ? null : (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
          {label}
        </span>
      )}
      {collapsed ? null : (
        <div
          onMouseDown={stop}
          onDoubleClick={stop}
          onPointerDown={onResizeStart}
          title='드래그하여 열 너비 조절'
          style={{ position: 'absolute', right: -8, top: 0, height: '100%', width: 14, cursor: 'col-resize' }}
        />
      )}
    </div>
  );
}

export default function KioskSubtitleGridPage() {
  const [tab, setTab] = useState<TabKey>('subtitle');

  const { data: kiosksRaw } = useGetKiosks();
  const kiosks = useMemo(() => (Array.isArray(kiosksRaw) ? kiosksRaw : []), [kiosksRaw]);
  const [kioskId, setKioskId] = useState<number | null>(null);
  useEffect(() => {
    if (kioskId == null && kiosks.length) setKioskId(kiosks[0].id);
  }, [kiosks, kioskId]);

  const { data: subtitles, isLoading } = useKioskSubtitlesByKiosk(kioskId ?? undefined);
  const { data: buttons } = useKioskButtons({ kioskId: kioskId ?? undefined, enabled: kioskId != null });
  const bulkSave = useKioskSubtitleBulkSave(kioskId ?? undefined);

  const buttonNameById = useMemo(() => {
    const m = new Map<number, string>();
    (buttons ?? []).forEach((b) => m.set(b.id, b.buttonType || b.buttonName || `#${b.id}`));
    return m;
  }, [buttons]);

  const [rows, setRows] = useState<Row[]>([]);
  const [original, setOriginal] = useState<Row[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);
  // 실행취소/다시실행 스택 (rows 스냅샷)
  const [undoStack, setUndoStack] = useState<Row[][]>([]);
  const [redoStack, setRedoStack] = useState<Row[][]>([]);

  useEffect(() => {
    if (!subtitles) return;
    const mapped = subtitles.map((s) =>
      dtoToRow(s, s.buttonId ? (buttonNameById.get(s.buttonId) ?? `#${s.buttonId}`) : '자동재생'),
    );
    setRows(mapped);
    setOriginal(mapped.map((r) => ({ ...r })));
    setUndoStack([]);
    setRedoStack([]);
  }, [subtitles, buttonNameById]);

  // 그리드 편집 → 이전 상태를 undo 스택에 push
  const handleChange = (next: Row[]) => {
    setUndoStack((u) => (u[u.length - 1] === rows ? u : [...u.slice(-199), rows]));
    setRedoStack([]);
    setRows(next);
  };

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (!u.length) return u;
      const prev = u[u.length - 1];
      setRedoStack((r) => [...r, rows]);
      setRows(prev);
      return u.slice(0, -1);
    });
  }, [rows]);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const next = r[r.length - 1];
      setUndoStack((u) => [...u, rows]);
      setRows(next);
      return r.slice(0, -1);
    });
  }, [rows]);

  // Ctrl/Cmd+Z 실행취소, Ctrl/Cmd+Shift+Z (또는 Ctrl+Y) 다시실행
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const toggleCol = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const setWidth = useCallback((key: string, w: number) => {
    setColWidths((prev) => ({ ...prev, [key]: Math.max(48, Math.round(w)) }));
  }, []);

  // 헤더 우측 모서리 드래그 → 해당 열 너비 조절(rAF 스로틀).
  const startResize = useCallback(
    (key: string, startW: number) => (e: ReactPointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      let lastX = startX;
      let raf = 0;
      const onMove = (ev: globalThis.PointerEvent) => {
        lastX = ev.clientX;
        if (!raf) {
          raf = requestAnimationFrame(() => {
            raf = 0;
            setWidth(key, startW + (lastX - startX));
          });
        }
      };
      const onUp = () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [setWidth],
  );

  const columns = useMemo<Column<Row>[]>(() => {
    const mk = (
      key: string,
      label: string,
      defW: number,
      kind: 'text' | 'int' = 'text',
      extra?: Partial<Column<Row>>,
    ): Column<Row> => {
      const base = kind === 'int' ? intColumn : textColumn;
      const isCol = collapsed.has(key);
      const w = isCol ? COLLAPSED_W : (colWidths[key] ?? defW);
      return {
        ...keyColumn(key as keyof Row, base),
        title: (
          <ColHeader
            label={label}
            collapsed={isCol}
            onToggle={() => toggleCol(key)}
            onResizeStart={startResize(key, w)}
          />
        ),
        basis: w,
        grow: 0,
        shrink: 0,
        minWidth: 48,
        maxWidth: w,
        ...extra,
      } as unknown as Column<Row>;
    };

    const cols: Column<Row>[] = [
      mk('buttonName', '버튼', 130, 'text', { disabled: true }),
      mk('playKey', 'Key', 130),
      mk('sortOrder', '순서', 64, 'int'),
      mk('videoFileName', '영상', 170),
    ];
    SUBTITLE_LANGS.forEach((lang) => {
      cols.push(mk(`main_${lang}`, `본문·${lang}`, 340));
      cols.push(mk(`rt_${lang}`, `우측·${lang}`, 200));
    });
    cols.push(mk('playCondition', '재생조건', 200));
    cols.push(mk('description', '설명', 180));
    return cols;
  }, [collapsed, colWidths, toggleCol, startResize]);

  const dirty = useMemo(() => {
    if (rows.length !== original.length) return true;
    const origById = new Map(original.filter((r) => r.id != null).map((r) => [r.id, r]));
    return rows.some((r) => {
      if (r.id == null)
        return Object.keys(r).some(
          (k) => k !== 'buttonName' && k !== 'sortOrder' && (r[k] ?? '') !== '',
        );
      const o = origById.get(r.id);
      return !o || !rowsEqual(r, o);
    });
  }, [rows, original]);

  const handleSave = async () => {
    if (kioskId == null) return;
    const origIds = new Set(original.filter((r) => r.id != null).map((r) => r.id));
    const curIds = new Set(rows.filter((r) => r.id != null).map((r) => r.id));
    const deleteIds = [...origIds].filter((id) => !curIds.has(id!)) as number[];

    const origById = new Map(original.filter((r) => r.id != null).map((r) => [r.id, r]));
    const items: KioskSubtitlePayload[] = [];
    rows.forEach((r) => {
      if (r.id != null) {
        const o = origById.get(r.id);
        if (!o || !rowsEqual(r, o)) items.push(rowToPayload(r, kioskId));
      } else {
        const hasContent =
          (r.playKey || '').trim() !== '' ||
          SUBTITLE_LANGS.some((l) => ((r[`main_${l}`] as string) || '').trim() !== '');
        if (hasContent) items.push(rowToPayload(r, kioskId));
      }
    });

    if (items.length === 0 && deleteIds.length === 0) {
      setNotice('변경사항이 없습니다.');
      return;
    }
    try {
      await bulkSave.mutateAsync({ kioskId, items, deleteIds });
      setNotice(`저장 완료 (수정/추가 ${items.length}건, 삭제 ${deleteIds.length}건)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.';
      setNotice(`저장 실패: ${msg}`);
    }
  };

  const btnSmall: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    // 좌우 여백 축소 — 레이아웃(.main)의 30px 패딩을 상쇄해 그리드 폭 확보
    <div style={{ margin: '0 -30px' }}>
      <div style={{ padding: '0 14px' }}>
        <div className={shared.pageHeader}>
          <div>
            <h1 className={shared.pageTitle}>언어 텍스트 관리</h1>
            <p className={shared.pageSubtitle}>키오스크 텍스트 데이터를 엑셀처럼 편집 · 복사/붙여넣기 · 실행취소 · 일괄 저장</p>
          </div>
        </div>

        {/* 시트 탭 (엑셀 시트 선택처럼) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, borderBottom: '1px solid #e2e8f0', margin: '2px 0 12px' }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type='button'
                onClick={() => setTab(t.key)}
                style={{
                  padding: '7px 16px',
                  border: '1px solid #e2e8f0',
                  borderBottom: active ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  borderRadius: '8px 8px 0 0',
                  background: active ? '#fff' : '#f8fafc',
                  color: active ? '#0f172a' : '#64748b',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            );
          })}
          <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center', marginLeft: 8 }}>
            앞으로 다른 데이터 영역이 탭으로 추가됩니다
          </span>
        </div>

        {tab === 'subtitle' ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, margin: '0 0 10px' }}>
              <select
                value={kioskId ?? ''}
                onChange={(e) => setKioskId(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              >
                {kiosks.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
              <button type='button' onClick={undo} disabled={!undoStack.length} style={{ ...btnSmall, opacity: undoStack.length ? 1 : 0.45 }} title='Ctrl/Cmd+Z'>
                ↶ 실행취소
              </button>
              <button type='button' onClick={redo} disabled={!redoStack.length} style={{ ...btnSmall, opacity: redoStack.length ? 1 : 0.45 }} title='Ctrl/Cmd+Shift+Z'>
                ↷ 다시실행
              </button>
              {collapsed.size > 0 ? (
                <button type='button' onClick={() => setCollapsed(new Set())} style={btnSmall}>
                  접힌 열 모두 펼치기 ({collapsed.size})
                </button>
              ) : null}
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                헤더 ◂/▸ = 접기/펼치기 · 헤더 우측 모서리 드래그 = 너비 조절
              </span>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                {notice ? <span style={{ fontSize: 12, color: '#475569' }}>{notice}</span> : null}
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={!dirty || bulkSave.isPending || kioskId == null}
                  className={shared.btnPrimary}
                  style={{ opacity: !dirty || bulkSave.isPending ? 0.5 : 1 }}
                >
                  {bulkSave.isPending ? '저장 중…' : '저장'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>불러오는 중…</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <DataSheetGrid<Row>
                  value={rows}
                  onChange={handleChange}
                  columns={columns}
                  createRow={emptyRow}
                  rowHeight={44}
                  height={680}
                />
              </div>
            )}
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
              · 엑셀 복사/붙여넣기(Ctrl/Cmd+C·V), 실행취소(Ctrl/Cmd+Z)·다시실행(Ctrl/Cmd+Shift+Z) 지원. · 맨 아래 빈 행에 입력 = 신규 자막(버튼 미지정=자동재생). · 행 선택 후 삭제는 저장 시 반영.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
