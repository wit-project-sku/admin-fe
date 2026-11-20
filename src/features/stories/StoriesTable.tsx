import shared from '@commons/shared.module.css';
import type { StoryDto, StoryStatus } from '../../hooks/story-api/storyTypes';
import s from '../lotte/Lotte.module.css';
import { formatDateTime } from '../lotte/lotteFormat';
import { StoryPreviewThumb } from './StoryPreviewThumb';
import { STORY_STATUS_BADGE, STORY_STATUS_LABEL, STORY_TYPE_LABEL, isPastKioskWindow } from './storyConfig';

type Props = {
  loading: boolean;
  errorMessage: string;
  emptyMessage: string;
  rows: StoryDto[];
  pendingStatusId: number | null;
  branchCodeOf: (kioskId: number) => string;
  onView: (row: StoryDto) => void;
  onChangeStatus: (row: StoryDto, next: Exclude<StoryStatus, 'PENDING'>) => void;
};

const COL_COUNT = 9;

/** 사연 목록(최근에 올린 순). 행을 누르면 미리보기, 오른쪽 버튼으로 바로 승인·숨김. */
export function StoriesTable({
  loading,
  errorMessage,
  emptyMessage,
  rows,
  pendingStatusId,
  branchCodeOf,
  onView,
  onChangeStatus,
}: Props) {
  return (
    <div className={shared.tableResponsive}>
      <table className={`${shared.table} ${s.listTable}`}>
        <thead className={shared.thead}>
          <tr>
            <th className={shared.th} style={{ width: 80 }}>
              미리보기
            </th>
            <th className={shared.th} style={{ width: 92 }}>
              상태
            </th>
            <th className={shared.th}>제목</th>
            <th className={shared.th}>보낸 사람</th>
            <th className={shared.th} style={{ width: 72 }}>
              지점
            </th>
            <th className={shared.th} style={{ width: 64 }}>
              종류
            </th>
            <th className={shared.th} style={{ width: 140 }}>
              보낸 시각
            </th>
            <th className={`${shared.th} ${shared.thCenter}`} style={{ width: 64 }}>
              순서
            </th>
            <th className={`${shared.th} ${shared.thRight}`} style={{ width: 150 }}>
              검수
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`story-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={col} className={shared.td}>
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
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const busy = pendingStatusId === row.id;
              const expired = row.status === 'APPROVED' && isPastKioskWindow(row);
              return (
                <tr key={row.id} className={`${shared.tr} ${s.clickableRow}`} onClick={() => onView(row)}>
                  <td className={shared.td}>
                    <StoryPreviewThumb story={row} />
                  </td>
                  <td className={`${shared.td} ${s.nowrap}`}>
                    <span className={STORY_STATUS_BADGE[row.status]}>{STORY_STATUS_LABEL[row.status]}</span>
                    {expired ? <span className={s.subText}>노출 기간 지남</span> : null}
                  </td>
                  <td className={`${shared.td} ${s.titleCell}`}>
                    <span className={s.titleText} title={row.title}>
                      {row.title}
                    </span>
                    {row.body ? <span className={s.subText}>{row.body}</span> : null}
                  </td>
                  <td className={`${shared.td} ${s.nowrap}`}>{row.displayName}</td>
                  <td className={`${shared.td} ${shared.tdMono} ${s.nowrap}`}>{branchCodeOf(row.kioskId)}</td>
                  <td className={`${shared.td} ${s.nowrap}`}>{STORY_TYPE_LABEL[row.type]}</td>
                  <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>{formatDateTime(row.createdAt)}</td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    {row.displayOrder != null ? (
                      <span className={s.orderNum}>{row.displayOrder}</span>
                    ) : (
                      <span className={s.dash}>—</span>
                    )}
                  </td>
                  <td className={shared.td} onClick={(e) => e.stopPropagation()}>
                    <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                      {row.status !== 'APPROVED' ? (
                        <button
                          type='button'
                          className={`${s.actionBtn} ${s.approveBtn}`}
                          disabled={busy}
                          onClick={() => onChangeStatus(row, 'APPROVED')}
                        >
                          승인
                        </button>
                      ) : null}
                      {row.status !== 'HIDDEN' ? (
                        <button
                          type='button'
                          className={`${s.actionBtn} ${s.hideBtn}`}
                          disabled={busy}
                          onClick={() => onChangeStatus(row, 'HIDDEN')}
                        >
                          숨김
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
