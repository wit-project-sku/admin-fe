import { Fragment } from 'react';
import shared from '@commons/shared.module.css';
import s from './KioskOutfitCategoryTable.module.css';
import {
  OUTFIT_LABEL_FIELDS,
  effectiveLabel,
  hasOverride,
  type KioskOutfitCategorySetting,
} from '@/hooks/inventory-api/kioskOutfitCategoryTypes';
import type { LabelDraft } from './useKioskOutfitCategoryPage';
import type { OutfitCategoryLabelKey } from '@/hooks/inventory-api/kioskOutfitCategoryTypes';

const COL_COUNT = 5;

/** `labelKr` → `KR`. 표에서는 언어 이름을 다 쓸 자리가 없어 두 글자로 줄인다. */
const langShort = (key: OutfitCategoryLabelKey) => key.replace('label', '').toUpperCase();

/** 이 키오스크가 덮어쓴 언어들. 8칸 전부를 본다 — 한국어만 보면 "영어만 바꾼" 행이 기본값처럼 보인다. */
const overriddenFields = (row: KioskOutfitCategorySetting) =>
  OUTFIT_LABEL_FIELDS.filter((f) => (row[f.key] ?? '') !== '');

/**
 * 노출 상태 배지.
 *
 * 숨기지 않았는데도 안 보이는 경우(배정 의상 0벌)를 따로 표시한다 — 이게 안 보이면 관리자가
 * 숨김 설정을 계속 눌러 보게 된다. 숨김과 의상 없음은 동시에 성립하므로 둘 다 보여 준다.
 */
function StatusBadge({ row }: { row: KioskOutfitCategorySetting }) {
  const empty = row.assignedOutfitCount === 0;
  return (
    <div className={s.badgeStack}>
      {row.hidden ? (
        <span className={`${shared.badge} ${shared.badgeRed}`}>숨김</span>
      ) : empty ? null : (
        <span className={`${shared.badge} ${shared.badgeGreen}`}>노출</span>
      )}
      {empty ? <span className={`${shared.badge} ${shared.badgeGray}`}>의상 없음</span> : null}
    </div>
  );
}

/** 이 키오스크에서 실제로 보이는 이름 + 어떤 언어를 덮어썼는지. */
function LabelCell({ row }: { row: KioskOutfitCategorySetting }) {
  const overridden = overriddenFields(row);
  const krOverridden = (row.labelKr ?? '') !== '';

  return (
    <div className={s.labelCell}>
      <span className={krOverridden ? s.labelOverridden : s.labelPlain}>
        {effectiveLabel(row, 'labelKr') || '—'}
      </span>
      {overridden.length === 0 ? (
        <span className={s.labelNote}>기본값 그대로</span>
      ) : (
        <span className={s.labelMeta}>
          <span className={s.langTags}>
            {overridden.map((f) => (
              <span key={f.key} className={s.langTag} title={f.label}>
                {langShort(f.key)}
              </span>
            ))}
          </span>
          <span className={s.labelNote}>
            덮어씀{krOverridden ? ` · 기본 ${row.base?.labelKr ?? '—'}` : ''}
          </span>
        </span>
      )}
    </div>
  );
}

type EditorProps = {
  row: KioskOutfitCategorySetting;
  draft: LabelDraft;
  busy: boolean;
  onChange: (key: OutfitCategoryLabelKey, value: string) => void;
  onSave: (row: KioskOutfitCategorySetting) => void;
  onCancel: () => void;
};

function LabelEditor({ row, draft, busy, onChange, onSave, onCancel }: EditorProps) {
  return (
    <div className={s.editor}>
      <div className={s.editorHead}>
        <span className={s.editorTitle}>표시 이름 — {row.base?.labelKr ?? row.categoryName}</span>
        <span className={s.editorNote}>
          비워 두면 카테고리 기본값을 따릅니다(옅은 글씨가 기본값). 언어별로 독립입니다.
        </span>
      </div>

      <div className={s.grid}>
        {OUTFIT_LABEL_FIELDS.map((f) => {
          const changed = (draft[f.key] ?? '') !== '';
          return (
            <label key={f.key} className={s.field}>
              <span className={s.fieldLabel}>
                <span className={s.langTag}>{langShort(f.key)}</span>
                {f.label}
              </span>
              <input
                className={`${s.input} ${changed ? s.inputChanged : ''}`}
                type='text'
                maxLength={50}
                value={draft[f.key] ?? ''}
                placeholder={row.base?.[f.key] || '기본값 없음'}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            </label>
          );
        })}
      </div>

      <div className={s.editorActions}>
        <button type='button' className={s.btnSmall} onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button
          type='button'
          className={shared.btnPrimary}
          onClick={() => onSave(row)}
          disabled={busy}
        >
          저장
        </button>
      </div>
    </div>
  );
}

type TableProps = {
  loading: boolean;
  errorMessage: string;
  rows: KioskOutfitCategorySetting[];
  kioskSelected: boolean;
  editingCategoryId: number | null;
  draft: LabelDraft;
  busy: boolean;
  onEdit: (row: KioskOutfitCategorySetting) => void;
  onCancelEdit: () => void;
  onChangeDraft: (key: OutfitCategoryLabelKey, value: string) => void;
  onSaveLabels: (row: KioskOutfitCategorySetting) => void;
  onToggleHidden: (row: KioskOutfitCategorySetting) => void;
  onReset: (row: KioskOutfitCategorySetting) => void;
};

export function KioskOutfitCategoryTable({
  loading,
  errorMessage,
  rows,
  kioskSelected,
  editingCategoryId,
  draft,
  busy,
  onEdit,
  onCancelEdit,
  onChangeDraft,
  onSaveLabels,
  onToggleHidden,
  onReset,
}: TableProps) {
  const stateMessage = !kioskSelected
    ? '키오스크를 선택하세요.'
    : loading
      ? '불러오는 중...'
      : errorMessage
        ? errorMessage
        : rows.length === 0
          ? '표시할 카테고리가 없습니다.'
          : null;

  return (
    <div className={shared.tableResponsive}>
      <table className={shared.table}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${s.colCategory}`}>카테고리</th>
            <th className={`${shared.th} ${s.colLabel}`}>
              이 키오스크의 표시 이름
            </th>
            <th
              className={`${shared.th} ${shared.thCenter} ${s.colCount}`}
              title='이 키오스크에 배정된 유효 의상 수. 0벌이면 탭이 나오지 않습니다.'
            >
              배정 의상
            </th>
            <th className={`${shared.th} ${shared.thCenter} ${s.colStatus}`}>노출 상태</th>
            <th className={`${shared.th} ${shared.thRight} ${s.colActions}`}>관리</th>
          </tr>
        </thead>
        <tbody>
          {stateMessage ? (
            <tr>
              <td
                colSpan={COL_COUNT}
                className={`${shared.tableStateCell} ${errorMessage ? shared.tableStateError : ''}`}
              >
                {stateMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const editing = editingCategoryId === row.categoryId;
              const empty = row.assignedOutfitCount === 0;
              return (
                <Fragment key={row.categoryId}>
                  <tr
                    className={`${shared.tr} ${empty ? s.rowMuted : ''} ${editing ? s.rowEditing : ''}`}
                  >
                    <td className={`${shared.td} ${s.colCategory}`}>
                      <div className={s.categoryCell}>
                        <span className={s.categoryLabel}>{row.base?.labelKr ?? '—'}</span>
                        <span className={s.categoryCode}>{row.categoryName}</span>
                      </div>
                    </td>
                    <td className={`${shared.td} ${s.colLabel}`}>
                      <LabelCell row={row} />
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter} ${s.colCount}`}>
                      <span className={`${s.count} ${empty ? s.countZero : ''}`}>
                        {row.assignedOutfitCount}
                        <span className={s.countUnit}>벌</span>
                      </span>
                    </td>
                    <td className={`${shared.td} ${shared.tdCenter} ${s.colStatus}`}>
                      <StatusBadge row={row} />
                    </td>
                    <td className={`${shared.td} ${shared.tdRight} ${s.colActions}`}>
                      <div className={s.rowActions}>
                        <button
                          type='button'
                          className={s.btnSmall}
                          onClick={() => onToggleHidden(row)}
                          disabled={busy}
                        >
                          {row.hidden ? '숨김 해제' : '숨기기'}
                        </button>
                        <button
                          type='button'
                          className={`${s.btnSmall} ${editing ? s.btnActive : ''}`}
                          onClick={() => (editing ? onCancelEdit() : onEdit(row))}
                          disabled={busy}
                        >
                          {editing ? '편집 닫기' : '이름 편집'}
                        </button>
                        <button
                          type='button'
                          className={`${s.btnSmall} ${s.btnDanger}`}
                          onClick={() => onReset(row)}
                          disabled={busy || !hasOverride(row)}
                          title={hasOverride(row) ? undefined : '덮어쓴 설정이 없습니다'}
                        >
                          되돌리기
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editing ? (
                    <tr className={s.editorRow}>
                      <td colSpan={COL_COUNT}>
                        <LabelEditor
                          row={row}
                          draft={draft}
                          busy={busy}
                          onChange={onChangeDraft}
                          onSave={onSaveLabels}
                          onCancel={onCancelEdit}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
