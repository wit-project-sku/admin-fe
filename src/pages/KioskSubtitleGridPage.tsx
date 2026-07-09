import { useEffect, useMemo, useState } from 'react';
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
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!subtitles) return;
    const mapped = subtitles.map((s) =>
      dtoToRow(s, s.buttonId ? (buttonNameById.get(s.buttonId) ?? `#${s.buttonId}`) : '자동재생'),
    );
    setRows(mapped);
    setOriginal(mapped.map((r) => ({ ...r })));
  }, [subtitles, buttonNameById]);

  const toggleCol = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const columns = useMemo<Column<Row>[]>(() => {
    // 컬럼 헤더: 더블클릭으로 접기/펼치기.
    const header = (key: string, label: string) => (
      <div
        onDoubleClick={() => toggleCol(key)}
        title={`${label} — 더블클릭으로 접기/펼치기`}
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          userSelect: 'none',
        }}
      >
        {collapsed.has(key) ? '⋯' : label}
      </div>
    );
    const mk = (
      key: string,
      label: string,
      width: number,
      kind: 'text' | 'int' = 'text',
      extra?: Partial<Column<Row>>,
    ): Column<Row> => {
      const base = kind === 'int' ? intColumn : textColumn;
      const isCol = collapsed.has(key);
      const widthProps = isCol
        ? { minWidth: 34, maxWidth: 34, grow: 0, basis: 34 }
        : { minWidth: width, grow: 0 };
      return {
        ...keyColumn(key as keyof Row, base),
        title: header(key, label),
        ...widthProps,
        ...extra,
      } as unknown as Column<Row>;
    };

    const cols: Column<Row>[] = [
      mk('buttonName', '버튼', 130, 'text', { disabled: true }),
      mk('playKey', 'Key', 130),
      mk('sortOrder', '순서', 64, 'int'),
      mk('videoFileName', '영상', 160),
    ];
    SUBTITLE_LANGS.forEach((lang) => {
      cols.push(mk(`main_${lang}`, `본문·${lang}`, 340));
      cols.push(mk(`rt_${lang}`, `우측·${lang}`, 200));
    });
    cols.push(mk('playCondition', '재생조건', 200));
    cols.push(mk('description', '설명', 180));
    return cols;
  }, [collapsed]);

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

  return (
    // 좌우 여백 축소 — 레이아웃(.main)의 30px 패딩을 상쇄해 그리드 폭 확보
    <div style={{ margin: '0 -30px' }}>
      <div style={{ padding: '0 14px' }}>
        <div className={shared.pageHeader}>
          <div>
            <h1 className={shared.pageTitle}>언어 텍스트 관리</h1>
            <p className={shared.pageSubtitle}>키오스크 텍스트 데이터를 엑셀처럼 편집 · 복사/붙여넣기 · 일괄 저장</p>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, margin: '0 0 10px' }}>
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
              <span style={{ fontSize: 12, color: '#94a3b8' }}>열 머리글을 더블클릭하면 해당 열을 접거나 펼칠 수 있습니다.</span>

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
                  onChange={setRows}
                  columns={columns}
                  createRow={emptyRow}
                  rowHeight={44}
                  height={680}
                />
              </div>
            )}
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
              · 엑셀에서 복사한 셀을 그대로 붙여넣을 수 있습니다(Ctrl/Cmd+V). · 맨 아래 빈 행에 입력하면 신규 자막이 추가됩니다(버튼 미지정 = 자동재생).
              · 행을 선택해 삭제하면 저장 시 반영됩니다.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
