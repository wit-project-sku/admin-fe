// 이벤트 목록 탭 — 제목 검색·상태 필터·페이지. 행의 수정/삭제, 참여자 수를 누르면 참여자 창.
import { useEffect, useState } from 'react';

import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import DeleteModal from '@modals/DeleteModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useWitsEventList, useWitsEventMutations } from '@/hooks/wits-api/useWitsEvents';
import {
  WITS_EVENT_STATUS_LABEL,
  WITS_PARTICIPATION_LABEL,
  type WitsEventStatus,
  type WitsEventSummaryDto,
} from '@/hooks/wits-api/witsTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { formatDateTimeRange } from '../witsFormat';
import { WITS_EVENT_STATUS_BADGE } from '../witsBadges';
import s from '../Wits.module.css';

const PAGE_SIZE = 20;
const COL_COUNT = 8;

const STATUS_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'SCHEDULED', label: '예정' },
  { key: 'ONGOING', label: '진행 중' },
  { key: 'ENDED', label: '마감' },
];

type Props = {
  onEdit: (row: WitsEventSummaryDto) => void;
  onParticipants: (row: WitsEventSummaryDto) => void;
  onNotice: (text: string, ok?: boolean) => void;
};

export function WitsEventListPanel({ onEdit, onParticipants, onNotice }: Props) {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<WitsEventSummaryDto | null>(null);

  const list = useWitsEventList({
    pageNum: page,
    pageSize: PAGE_SIZE,
    status: status === 'ALL' ? undefined : (status as WitsEventStatus),
    keyword: debounced.trim() || undefined,
  });
  const { deleteAsync, isDeleting } = useWitsEventMutations();

  useEffect(() => {
    setPage(1);
  }, [status, debounced]);

  // 마지막 장의 마지막 행을 지우면 빈 장이 남지 않게 당긴다.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), list.totalPages));
  }, [list.totalPages]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAsync(deleting.id);
      setDeleting(null);
      onNotice('이벤트를 삭제했습니다.');
    } catch (err) {
      setDeleting(null);
      onNotice(apiErrorMessage(err, '삭제에 실패했습니다.'), false);
    }
  };

  return (
    <>
      <div className={s.cardHead}>
        <FilterGroup label='상태' filters={STATUS_FILTERS} current={status} onFilterChange={setStatus} />
        <SearchBar value={search} onChange={setSearch} placeholder='제목 검색' minWidth='260px' />
      </div>

      <div className={shared.tableResponsive}>
        <table className={`${shared.table} ${s.listTable}`}>
          <thead className={shared.thead}>
            <tr>
              <th className={shared.th}>제목</th>
              <th className={shared.th}>기간</th>
              <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
              <th className={`${shared.th} ${shared.thCenter}`}>공개</th>
              <th className={`${shared.th} ${shared.thCenter}`}>배너 노출</th>
              <th className={shared.th}>참여 방식</th>
              <th className={`${shared.th} ${shared.thRight}`}>참여자</th>
              <th className={`${shared.th} ${shared.thRight}`} style={{ width: 100 }}>
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {list.isPending ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`wits-event-skeleton-${idx}`} className={shared.skeletonRow}>
                  {Array.from({ length: COL_COUNT }).map((__, col) => (
                    <td key={col} className={shared.td}>
                      <span className={shared.skeletonLine} />
                    </td>
                  ))}
                </tr>
              ))
            ) : list.isError ? (
              <tr>
                <td colSpan={COL_COUNT} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                  이벤트 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </td>
              </tr>
            ) : list.rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                  {debounced.trim() || status !== 'ALL' ? '조건에 맞는 이벤트가 없습니다.' : '등록된 이벤트가 없습니다.'}
                </td>
              </tr>
            ) : (
              list.rows.map((row) => (
                <tr key={row.id} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdBold}`}>
                    <div className={s.ellipsis} title={row.titleKo}>
                      {row.titleKo}
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>
                    {formatDateTimeRange(row.startAt, row.endAt)}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span className={`${shared.badge} ${WITS_EVENT_STATUS_BADGE[row.status] ?? shared.badgeGray}`}>
                      {WITS_EVENT_STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    {row.published ? (
                      <span className={`${shared.badge} ${shared.badgeGreen}`}>공개</span>
                    ) : (
                      <span className={`${shared.badge} ${shared.badgeGray}`}>숨김</span>
                    )}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    {row.bannerVisible ? (
                      <span className={`${shared.badge} ${shared.badgePurple}`}>노출</span>
                    ) : (
                      <span className={s.dash}>—</span>
                    )}
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>
                    {WITS_PARTICIPATION_LABEL[row.participationType] ?? row.participationType}
                  </td>
                  <td className={`${shared.td} ${shared.tdRight}`}>
                    <button
                      type='button'
                      className={s.linkBtn}
                      title='참여자 보기'
                      onClick={() => onParticipants(row)}
                    >
                      {Number(row.participantCount || 0).toLocaleString('ko-KR')}명
                    </button>
                  </td>
                  <td className={shared.td}>
                    <div className={shared.actionGroup}>
                      <EditBtn onClick={() => onEdit(row)} />
                      <DeleteBtn onClick={() => setDeleting(row)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={list.totalPages}
        onPageChange={setPage}
        totalCount={list.totalElements}
        unit='건'
      />

      {deleting ? (
        <DeleteModal
          open
          title='이벤트를 삭제하시겠습니까?'
          target={deleting.titleKo}
          description='앱에서 바로 내려갑니다. 참여 기록은 남습니다.'
          loading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
