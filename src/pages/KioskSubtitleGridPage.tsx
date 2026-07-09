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
  type SubtitleLang,
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

/** 저장 대상: 원본 대비 바뀐 셀이 있는 행만 upsert, 사라진 id 는 delete. */
function rowsEqual(a: Row, b: Row): boolean {
  const keys = Object.keys(a);
  return keys.every((k) => (a[k] ?? '') === (b[k] ?? ''));
}

export default function KioskSubtitleGridPage() {
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
  const [visibleLangs, setVisibleLangs] = useState<Set<SubtitleLang>>(new Set(SUBTITLE_LANGS));
  const [showRt, setShowRt] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // 자막 로드 → 행 초기화
  useEffect(() => {
    if (!subtitles) return;
    const mapped = subtitles.map((s) => dtoToRow(s, s.buttonId ? (buttonNameById.get(s.buttonId) ?? `#${s.buttonId}`) : '자동재생'));
    setRows(mapped);
    setOriginal(mapped.map((r) => ({ ...r })));
  }, [subtitles, buttonNameById]);

  const toggleLang = (lang: SubtitleLang) =>
    setVisibleLangs((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });

  const columns = useMemo<Column<Row>[]>(() => {
    // react-datasheet-grid 의 컬럼 제네릭 마찰을 피하려고 헬퍼로 캐스팅.
    const txt = (key: string, title: string, extra?: Partial<Column<Row>>): Column<Row> =>
      ({ ...keyColumn(key as keyof Row, textColumn), title, ...extra }) as unknown as Column<Row>;
    const num = (key: string, title: string, extra?: Partial<Column<Row>>): Column<Row> =>
      ({ ...keyColumn(key as keyof Row, intColumn), title, ...extra }) as unknown as Column<Row>;

    const cols: Column<Row>[] = [
      txt('buttonName', '버튼', { disabled: true, minWidth: 130 }),
      txt('playKey', 'Key', { minWidth: 130 }),
      num('sortOrder', '순서', { minWidth: 60, maxWidth: 70 }),
      txt('videoFileName', '영상', { minWidth: 150 }),
    ];
    SUBTITLE_LANGS.filter((l) => visibleLangs.has(l)).forEach((lang) => {
      cols.push(txt(`main_${lang}`, `본문·${lang}`, { minWidth: 220 }));
      if (showRt) cols.push(txt(`rt_${lang}`, `우측·${lang}`, { minWidth: 160 }));
    });
    cols.push(txt('playCondition', '재생조건', { minWidth: 180 }));
    cols.push(txt('description', '설명', { minWidth: 160 }));
    return cols;
  }, [visibleLangs, showRt]);

  const dirty = useMemo(() => {
    if (rows.length !== original.length) return true;
    const origById = new Map(original.filter((r) => r.id != null).map((r) => [r.id, r]));
    return rows.some((r) => {
      if (r.id == null) return Object.keys(r).some((k) => k !== 'buttonName' && (r[k] ?? '') !== '' && k !== 'sortOrder');
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
        // 신규: play_key 또는 본문 하나라도 채워진 행만
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
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>언어 텍스트 관리</h1>
          <p className={shared.pageSubtitle}>키오스크 자막을 엑셀처럼 편집 · 복사/붙여넣기 · 일괄 저장</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          margin: '4px 0 12px',
        }}
      >
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>언어:</span>
          {SUBTITLE_LANGS.map((lang) => (
            <label key={lang} style={{ fontSize: 12, display: 'inline-flex', gap: 3, alignItems: 'center' }}>
              <input type='checkbox' checked={visibleLangs.has(lang)} onChange={() => toggleLang(lang)} />
              {lang}
            </label>
          ))}
          <label style={{ fontSize: 12, display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 8 }}>
            <input type='checkbox' checked={showRt} onChange={(e) => setShowRt(e.target.checked)} />
            우측상단(rt) 표시
          </label>
        </div>

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
            rowHeight={40}
            height={640}
          />
        </div>
      )}
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
        · 엑셀에서 복사한 셀을 그대로 붙여넣을 수 있습니다(Ctrl/Cmd+V). · 맨 아래 빈 행에 입력하면 신규 자막이 추가됩니다(버튼 미지정 = 자동재생).
        · 행을 선택해 삭제하면 저장 시 반영됩니다.
      </p>
    </div>
  );
}
