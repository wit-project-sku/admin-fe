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

/**
 * 노출 상태 배지.
 *
 * 숨기지 않았는데도 안 보이는 경우(배정 의상 0벌)를 따로 표시한다 — 이게 안 보이면 관리자가
 * 숨김 설정을 계속 눌러 보게 된다.
 */
function StatusBadge({ row }: { row: KioskOutfitCategorySetting }) {
  if (row.hidden) {
    return <span className={`${shared.badge} ${shared.badgeRed}`}>숨김</span>;
  }
  if (row.assignedOutfitCount === 0) {
    return <span className={`${shared.badge} ${shared.badgeGray}`}>의상 없음</span>;
  }
  return <span className={`${shared.badge} ${shared.badgeGreen}`}>노출</span>;
}

function LabelCell({ row }: { row: KioskOutfitCategorySetting }) {
  const overridden = (row.labelKr ?? '') !== '';
  return (
    <div className={s.labelCell}>
      <span className={overridden ? s.labelOverridden : s.labelDefault}>
        {effectiveLabel(row, 'labelKr') || '—'}
      </span>
      {overridden ? <span className={s.labelDefault}>기본: {row.base?.labelKr ?? '—'}</span> : null}
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
          비워 두면 카테고리 기본값을 따릅니다(회색 글씨가 기본값). 언어별로 독립입니다.
        </span>
      </div>

      <div className={s.grid}>
        {OUTFIT_LABEL_FIELDS.map((f) => (
          <label key={f.key} className={s.field}>
            <span className={s.fieldLabel}>{f.label}</span>
            <input
              className={s.input}
              type='text'
              maxLength={50}
              value={draft[f.key] ?? ''}
              placeholder={row.base?.[f.key] || '기본값 없음'}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          </label>
        ))}
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
        <thead>
          <tr>
            <th>카테고리</th>
            <th>이 키오스크의 표시 이름</th>
            <th style={{ width: 110 }}>배정 의상</th>
            <th style={{ width: 110 }}>노출 상태</th>
            <th style={{ width: 260, textAlign: 'right' }}>설정</th>
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
            rows.map((row) => (
              <Fragment key={row.categoryId}>
                <tr>
                  <td>
                    <div className={s.categoryCell}>
                      <span className={s.categoryLabel}>{row.base?.labelKr ?? '—'}</span>
                      <span className={s.categoryCode}>{row.categoryName}</span>
                    </div>
                  </td>
                  <td>
                    <LabelCell row={row} />
                  </td>
                  <td>
                    <span
                      className={`${s.count} ${row.assignedOutfitCount === 0 ? s.countZero : ''}`}
                    >
                      {row.assignedOutfitCount}벌
                    </span>
                  </td>
                  <td>
                    <StatusBadge row={row} />
                  </td>
                  <td>
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
                        className={s.btnSmall}
                        onClick={() =>
                          editingCategoryId === row.categoryId ? onCancelEdit() : onEdit(row)
                        }
                        disabled={busy}
                      >
                        {editingCategoryId === row.categoryId ? '편집 닫기' : '표시 이름'}
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

                {editingCategoryId === row.categoryId ? (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
