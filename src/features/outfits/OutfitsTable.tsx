import { useEffect, useState } from 'react';
import shared from '@commons/shared.module.css';
import s from '@pages/OutfitsPage.module.css';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import { ModalContainer, ModalHeader } from '@modals/ModalElements';
import type { OutfitRow } from './outfitListMappers';
import { OUTFIT_TABLE_MESSAGES } from './outfitListConfig';

type OutfitsTableProps = {
  loading: boolean;
  errorMessage: string;
  rows: OutfitRow[];
  page: number;
  pageSize: number;
  kioskNameById: Record<string, string>;
  onEdit: (row: OutfitRow) => void;
  onDelete: (row: OutfitRow) => void;
  onRowClick?: (row: OutfitRow) => void;
};

const COL_COUNT = 7;
/** Up to this many kiosks stay in-cell only; above → summary + modal. */
const KIOSK_MODAL_THRESHOLD = 3;

function resolveKioskNames(ids: unknown, nameById: Record<string, string>): string[] {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return ids.map((id) => {
    const label = nameById[String(id)];
    return label && label.trim() ? label.trim() : `지점 #${id}`;
  });
}

function thumbSrc(row: OutfitRow): string | undefined {
  return row.imageUrl || row.images?.[0]?.imageUrl;
}

function ScheduleCell({ row }: { row: OutfitRow }) {
  const { operationStartYmd: start, operationEndYmd: end } = row;
  if (!start && !end) {
    return <span className={s.scheduleEmpty}>—</span>;
  }
  return (
    <div className={s.outfitScheduleStack}>
      <span className={s.scheduleStart}>
        {start || '—'} <span className={s.scheduleTilde}>~</span>
      </span>
      <span className={s.scheduleEnd}>{end ? end : '무기한'}</span>
    </div>
  );
}

function kioskCellSummary(names: string[]): string {
  const total = names.length;
  if (total === 0) return '';
  if (total <= KIOSK_MODAL_THRESHOLD) return names.join(' · ');
  return `${names.slice(0, 2).join(' · ')} · 외 ${total - 2}`;
}

function KioskCell({
  names,
  onShowAll,
}: {
  names: string[];
  onShowAll: () => void;
}) {
  if (names.length === 0) {
    return <span className={shared.tdMuted}>—</span>;
  }

  const total = names.length;
  const fullTitle = names.join(', ');
  const summary = kioskCellSummary(names);
  const openModal = total > KIOSK_MODAL_THRESHOLD;

  const inner = (
    <>
      <span className={s.kioskNamesEllipsis} title={fullTitle}>
        {summary}
      </span>
      {openModal ? (
        <span className={s.kioskOpenHint} aria-hidden>
          전체
        </span>
      ) : null}
    </>
  );

  if (openModal) {
    return (
      <button
        type="button"
        className={s.kioskCellCompactBtn}
        aria-label={`설치 키오스크 ${total}곳 전체 보기`}
        title={fullTitle}
        onClick={onShowAll}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={s.kioskCellPlain} title={fullTitle}>
      {inner}
    </div>
  );
}

type ImagePreviewState = { src: string; title: string } | null;
type KioskListState = { names: string[] } | null;

export function OutfitsTable({
  loading,
  errorMessage,
  rows,
  page,
  pageSize,
  kioskNameById,
  onEdit,
  onDelete,
  onRowClick,
}: OutfitsTableProps) {
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>(null);
  const [kioskListModal, setKioskListModal] = useState<KioskListState>(null);

  useEffect(() => {
    if (!imagePreview && !kioskListModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setImagePreview(null);
        setKioskListModal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imagePreview, kioskListModal]);

  return (
    <div className={s.tableResponsive}>
      <table className={shared.table}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${shared.thCenter}`}>No</th>
            <th className={`${shared.th} ${shared.thCenter}`}>미리보기</th>
            <th className={`${shared.th} ${shared.thLeft}`}>정보</th>
            <th className={`${shared.th} ${shared.thCenter}`}>운영 일정</th>
            <th className={`${shared.th} ${shared.thCenter} ${s.kioskTh}`}>설치 키오스크</th>
            <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
            <th className={`${shared.th} ${shared.thRight}`}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`outfit-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={`outfit-skeleton-${idx}-${col}`} className={shared.td}>
                    <span className={shared.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))
          ) : errorMessage ? (
            <tr>
              <td colSpan={COL_COUNT} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                {errorMessage}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                {OUTFIT_TABLE_MESSAGES.empty}
              </td>
            </tr>
          ) : (
            rows.map((o, i) => {
              const src = thumbSrc(o);
              const kioskNames = resolveKioskNames(o.kioskIds, kioskNameById);
              const previewTitle = [o.name, o.outfitCode].filter(Boolean).join(' · ') || '의상 미리보기';
              return (
                <tr
                  key={String(o.id)}
                  className={shared.tr}
                  onClick={() => onRowClick?.(o)}
                  style={{ cursor: onRowClick ? 'pointer' : undefined }}
                >
                  <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                    #{String((page - 1) * pageSize + i + 1).padStart(3, '0')}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <div className={s.previewWrapper}>
                      {src ? (
                        <button
                          type="button"
                          className={s.thumbButton}
                          aria-label={`${previewTitle} 이미지 크게 보기`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview({ src, title: previewTitle });
                          }}
                        >
                          <img src={src} alt="" className={s.tableThumb} />
                        </button>
                      ) : (
                        <div className={s.tableThumbPlaceholder} aria-hidden />
                      )}
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdLeft}`}>
                    <div className={s.outfitInfoStack}>
                      <span className={s.outfitInfoName}>{o.name || '—'}</span>
                      <span className={s.outfitInfoCode}>{o.outfitCode}</span>
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <ScheduleCell row={o} />
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter} ${s.kioskTd}`} onClick={(e) => e.stopPropagation()}>
                    <KioskCell names={kioskNames} onShowAll={() => setKioskListModal({ names: kioskNames })} />
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span
                      className={`${shared.badge} ${o.status === 'ACTIVE' ? shared.badgeGreen : shared.badgeGray}`}
                    >
                      {o.status === 'ACTIVE' ? '활성화' : '비활성화'}
                    </span>
                  </td>
                  <td className={shared.td}>
                    <div
                      className={shared.actionGroup}
                      style={{ justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EditBtn onClick={() => onEdit(o)} />
                      <DeleteBtn onClick={() => onDelete(o)} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {imagePreview ? (
        <ModalContainer onClose={() => setImagePreview(null)} modalClassName={s.imagePreviewModal}>
          <ModalHeader title={imagePreview.title} onClose={() => setImagePreview(null)} />
          <div className={s.imagePreviewBody}>
            <img src={imagePreview.src} alt="" className={s.imagePreviewImg} />
          </div>
        </ModalContainer>
      ) : null}

      {kioskListModal ? (
        <ModalContainer onClose={() => setKioskListModal(null)} modalClassName={s.kioskListModal}>
          <ModalHeader
            title="설치 키오스크"
            onClose={() => setKioskListModal(null)}
          />
          <div className={s.kioskListBody}>
            <p className={s.kioskListLead}>
              총 <strong>{kioskListModal.names.length}</strong>곳에 설치되어 있습니다.
            </p>
            <ul className={s.kioskList} role="list">
              {kioskListModal.names.map((name, idx) => (
                <li key={`${name}-${idx}`} className={s.kioskListItem}>
                  <span className={s.kioskListIndex}>{idx + 1}</span>
                  <span className={s.kioskListName}>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </ModalContainer>
      ) : null}
    </div>
  );
}
