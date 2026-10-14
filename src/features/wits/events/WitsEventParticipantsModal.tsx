// 이벤트 참여자 창 — 닉네임·참여 일시만(서버가 이메일·이름을 내보내지 않는다). 참여 최신순.
import { useState } from 'react';

import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import { ModalContainer, ModalHeader } from '@modals/ModalElements';
import { useWitsEventParticipants } from '@/hooks/wits-api/useWitsEvents';
import { formatDateTime } from '../witsFormat';
import s from '../Wits.module.css';

const PAGE_SIZE = 20;

type Props = {
  eventId: number;
  title: string;
  onClose: () => void;
};

export function WitsEventParticipantsModal({ eventId, title, onClose }: Props) {
  const [page, setPage] = useState(1);
  const { rows, totalElements, totalPages, isPending, isError } = useWitsEventParticipants(eventId, page, PAGE_SIZE);

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title='참여자' onClose={onClose} />
      <div className={s.participantHead}>
        <b>{title}</b> · 총 <b>{totalElements.toLocaleString('ko-KR')}</b>명
      </div>
      <div className={`${shared.tableResponsive} ${s.participantTable}`}>
        <table className={shared.table}>
          <thead className={shared.thead}>
            <tr>
              <th className={`${shared.th} ${shared.thCenter}`} style={{ width: 64 }}>
                No
              </th>
              <th className={shared.th}>닉네임</th>
              <th className={`${shared.th} ${shared.thRight}`}>참여 일시</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={3} className={shared.tableStateCell}>
                  불러오는 중...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={3} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                  참여자를 불러오지 못했습니다.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className={shared.tableStateCell}>
                  아직 참여자가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.mobileUserId}-${r.participatedAt}`} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                    {totalElements - ((page - 1) * PAGE_SIZE + i)}
                  </td>
                  <td className={shared.td}>
                    {r.nickname?.trim() ? r.nickname : <span className={s.dash}>(닉네임 없음)</span>}
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted} ${shared.tdRight} ${s.nowrap}`}>
                    {formatDateTime(r.participatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalCount={totalElements} unit='명' />
    </ModalContainer>
  );
}
