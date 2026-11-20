import shared from '@commons/shared.module.css';
import type { MovieShareShare, MovieShareVerification } from '../../hooks/movie-share-api/movieShareTypes';
import s from '../lotte/Lotte.module.css';
import { formatDateTime, formatShowtime } from '../lotte/lotteFormat';
import { VERIFICATION_STATUS_BADGE, VERIFICATION_STATUS_LABEL } from './movieShareConfig';

type StateProps = {
  loading: boolean;
  errorMessage: string;
  emptyMessage: string;
};

function StateRows({ loading, errorMessage, emptyMessage, colCount, hasRows }: StateProps & { colCount: number; hasRows: boolean }) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className={shared.skeletonRow}>
            {Array.from({ length: colCount }).map((__, j) => (
              <td key={j} className={shared.td}>
                <span className={shared.skeletonLine} />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }
  if (errorMessage) {
    return (
      <tr>
        <td colSpan={colCount} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
          {errorMessage}
        </td>
      </tr>
    );
  }
  if (!hasRows) {
    return (
      <tr>
        <td colSpan={colCount} className={shared.tableStateCell}>
          {emptyMessage}
        </td>
      </tr>
    );
  }
  return null;
}

/** 인증 내역 — 인증 시각, 사용자(가림), 영화, 극장, 상영 일시, 예매번호 뒤 4자리, 상태, 취소. */
export function VerificationsTable({
  rows,
  onCancel,
  ...state
}: StateProps & { rows: MovieShareVerification[]; onCancel: (row: MovieShareVerification) => void }) {
  const COLS = 8;
  const showRows = !state.loading && !state.errorMessage && rows.length > 0;
  return (
    <div className={shared.tableResponsive}>
      <table className={`${shared.table} ${s.listTable}`}>
        <thead className={shared.thead}>
          <tr>
            <th className={shared.th} style={{ width: 140 }}>
              인증 시각
            </th>
            <th className={shared.th}>사용자</th>
            <th className={shared.th}>영화</th>
            <th className={shared.th}>극장</th>
            <th className={shared.th} style={{ width: 130 }}>
              상영 일시
            </th>
            <th className={shared.th} style={{ width: 120 }}>
              예매번호
            </th>
            <th className={shared.th} style={{ width: 110 }}>
              상태
            </th>
            <th className={`${shared.th} ${shared.thRight}`} style={{ width: 80 }}>
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          <StateRows {...state} colCount={COLS} hasRows={rows.length > 0} />
          {showRows
            ? rows.map((r) => (
                <tr key={r.verificationId} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>{formatDateTime(r.verifiedAt)}</td>
                  <td className={`${shared.td} ${s.nowrap}`}>{r.maskedUser}</td>
                  <td className={`${shared.td} ${s.titleCell}`}>
                    <span className={s.titleText} title={r.movieTitle}>
                      {r.movieTitle}
                    </span>
                  </td>
                  <td className={`${shared.td} ${s.nowrap}`}>
                    {r.cinemaName}
                    {r.screenName ? <span className={s.subText}>{r.screenName}</span> : null}
                  </td>
                  <td className={`${shared.td} ${s.nowrap}`}>{formatShowtime(r.showStartAt, r.showEndAt)}</td>
                  <td className={`${shared.td} ${shared.tdMono} ${s.nowrap}`}>{r.maskedReservationNo}</td>
                  <td className={`${shared.td} ${s.nowrap}`}>
                    <span className={VERIFICATION_STATUS_BADGE[r.status]}>{VERIFICATION_STATUS_LABEL[r.status]}</span>
                    {r.used ? <span className={s.subText}>나눔에 사용됨</span> : null}
                    {r.status === 'CANCELLED' ? (
                      <span className={s.subText} title={r.cancelReason ?? undefined}>
                        {formatDateTime(r.cancelledAt)} · {r.cancelReason ?? '사유 없음'}
                      </span>
                    ) : null}
                  </td>
                  <td className={`${shared.td} ${shared.tdRight}`}>
                    {r.status === 'ACTIVE' ? (
                      <button type='button' className={`${s.actionBtn} ${s.dangerBtn}`} onClick={() => onCancel(r)}>
                        취소
                      </button>
                    ) : (
                      <span className={s.dash}>—</span>
                    )}
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}

/** 나눔 내역 — 증서 번호, 나눈 시각, 사용자(가림), 응원 한마디. */
export function SharesTable({ rows, ...state }: StateProps & { rows: MovieShareShare[] }) {
  const COLS = 4;
  const showRows = !state.loading && !state.errorMessage && rows.length > 0;
  return (
    <div className={shared.tableResponsive}>
      <table className={shared.table} style={{ minWidth: 760 }}>
        <thead className={shared.thead}>
          <tr>
            <th className={shared.th} style={{ width: 200 }}>
              증서 번호
            </th>
            <th className={shared.th} style={{ width: 150 }}>
              나눈 시각
            </th>
            <th className={shared.th} style={{ width: 160 }}>
              사용자
            </th>
            <th className={shared.th}>응원 한마디</th>
          </tr>
        </thead>
        <tbody>
          <StateRows {...state} colCount={COLS} hasRows={rows.length > 0} />
          {showRows
            ? rows.map((r) => (
                <tr key={r.shareId} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMono} ${s.nowrap}`}>{r.certificateNo}</td>
                  <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>{formatDateTime(r.sharedAt)}</td>
                  <td className={`${shared.td} ${s.nowrap}`}>{r.maskedUser}</td>
                  <td className={shared.td}>{r.message?.trim() || <span className={s.dash}>—</span>}</td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}
