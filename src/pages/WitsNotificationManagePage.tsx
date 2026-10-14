// WITS 앱 알림 관리 — 1단계는 앱 알림함만(푸시 없음). 예약 상태에서만 수정·예약 취소, 내리기는 언제나.
import { useCallback, useEffect, useState } from 'react';

import shared from '@commons/shared.module.css';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import RegisterBtn from '@components/common/RegisterBtn';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import DeleteModal from '@modals/DeleteModal';
import { useWitsNotificationList, useWitsNotificationMutations } from '@/hooks/wits-api/useWitsNotifications';
import {
  WITS_NOTIFICATION_STATUS_LABEL,
  type WitsNotificationDto,
  type WitsNotificationStatus,
} from '@/hooks/wits-api/witsTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { WitsNotificationFormModal } from '@/features/wits/notifications/WitsNotificationFormModal';
import { WITS_NOTIFICATION_STATUS_BADGE } from '@/features/wits/witsBadges';
import { formatDateTime } from '@/features/wits/witsFormat';
import s from '@/features/wits/Wits.module.css';

const PAGE_SIZE = 20;
const COL_COUNT = 6;

const STATUS_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'SCHEDULED', label: '예약' },
  { key: 'SENT', label: '발송됨' },
  { key: 'CANCELED', label: '취소' },
];

type FormState = { editing: WitsNotificationDto | null } | null;

export default function WitsNotificationManagePage() {
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<WitsNotificationDto | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const list = useWitsNotificationList({
    pageNum: page,
    pageSize: PAGE_SIZE,
    status: status === 'ALL' ? undefined : (status as WitsNotificationStatus),
  });
  const { cancelAsync, deleteAsync, isCanceling, isDeleting } = useWitsNotificationMutations();

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), list.totalPages));
  }, [list.totalPages]);

  const flash = useCallback((text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const cancel = async (row: WitsNotificationDto) => {
    if (!window.confirm(`"${row.titleKo}" 예약을 취소합니다. 앱 알림함에 보이지 않게 됩니다. 계속할까요?`)) return;
    try {
      await cancelAsync(row.id);
      flash('예약을 취소했습니다.');
    } catch (err) {
      flash(apiErrorMessage(err, '예약 취소에 실패했습니다.'), false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAsync(deleting.id);
      setDeleting(null);
      flash('알림을 내렸습니다.');
    } catch (err) {
      setDeleting(null);
      flash(apiErrorMessage(err, '내리기에 실패했습니다.'), false);
    }
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>알림 관리</h1>
          <p className={shared.pageSubtitle}>WITS 앱 알림함에 보일 알림을 보내거나 예약합니다.</p>
        </div>
        <RegisterBtn title='알림 등록' onClick={() => setForm({ editing: null })} />
      </div>

      {notice ? <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div> : null}

      <div className={shared.card}>
        <div className={s.cardHead}>
          <FilterGroup label='상태' filters={STATUS_FILTERS} current={status} onFilterChange={setStatus} />
        </div>

        <div className={shared.tableResponsive}>
          <table className={`${shared.table} ${s.listTable}`}>
            <thead className={shared.thead}>
              <tr>
                <th className={`${shared.th} ${shared.thCenter}`} style={{ width: 90 }}>
                  상태
                </th>
                <th className={shared.th}>제목</th>
                <th className={shared.th}>연결 이벤트</th>
                <th className={shared.th}>발송 시각</th>
                <th className={`${shared.th} ${shared.thCenter}`}>광고성</th>
                <th className={`${shared.th} ${shared.thRight}`} style={{ width: 170 }}>
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {list.isPending ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`wits-noti-skeleton-${idx}`} className={shared.skeletonRow}>
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
                    알림 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </td>
                </tr>
              ) : list.rows.length === 0 ? (
                <tr>
                  <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                    {status === 'ALL' ? '등록된 알림이 없습니다.' : '조건에 맞는 알림이 없습니다.'}
                  </td>
                </tr>
              ) : (
                list.rows.map((row) => {
                  const scheduled = row.status === 'SCHEDULED';
                  return (
                    <tr key={row.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span
                          className={`${shared.badge} ${WITS_NOTIFICATION_STATUS_BADGE[row.status] ?? shared.badgeGray}`}
                        >
                          {WITS_NOTIFICATION_STATUS_LABEL[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className={shared.td}>
                        <div className={`${shared.tdBold} ${s.ellipsis}`} title={row.titleKo}>
                          {row.titleKo}
                        </div>
                        <div className={s.subText} title={row.bodyKo}>
                          {row.bodyKo}
                        </div>
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted}`}>
                        {row.eventId != null ? (
                          <div className={s.ellipsis} title={row.eventTitleKo ?? undefined}>
                            {row.eventTitleKo ?? `이벤트 #${row.eventId}`}
                          </div>
                        ) : (
                          <span className={s.dash}>—</span>
                        )}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>{formatDateTime(row.sendAt)}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {row.isAd ? (
                          <span className={`${shared.badge} ${shared.badgeOrange}`}>광고</span>
                        ) : (
                          <span className={s.dash}>—</span>
                        )}
                      </td>
                      <td className={shared.td}>
                        <div className={shared.actionGroup}>
                          {scheduled ? (
                            <>
                              <button
                                type='button'
                                className={s.textBtn}
                                onClick={() => cancel(row)}
                                disabled={isCanceling}
                              >
                                예약 취소
                              </button>
                              <EditBtn onClick={() => setForm({ editing: row })} />
                            </>
                          ) : null}
                          <DeleteBtn onClick={() => setDeleting(row)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
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
      </div>

      <div className={s.hint}>
        · 지금은 <b>앱 알림함에만</b> 보입니다(푸시 알림은 아직 없습니다). 앱에는 최근 30일 알림이 보입니다.
        <br />· <b>예약</b> 상태일 때만 수정·예약 취소할 수 있습니다. <b>내리기</b>는 이미 보낸 알림도 앱 알림함에서 지웁니다.
      </div>

      {form ? (
        <WitsNotificationFormModal
          editing={form.editing}
          onClose={() => setForm(null)}
          onSuccess={(msg) => {
            setForm(null);
            flash(msg);
          }}
        />
      ) : null}

      {deleting ? (
        <DeleteModal
          open
          title='알림을 내리시겠습니까?'
          target={deleting.titleKo}
          description='앱 알림함에서 바로 사라지고 되돌릴 수 없습니다.'
          loading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
