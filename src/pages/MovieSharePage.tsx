// 영화 나눔 현황(롯데 키오스크) — 인증·나눔 건수, 월별·지점별 표, 인증 내역(의심 건 취소), 나눔 내역(롯데 전달용 내려받기).
import shared from '@commons/shared.module.css';
import DateRangePicker from '@components/common/DateRangePicker';
import Pagination from '@components/common/Pagination';
import s from '../features/lotte/Lotte.module.css';
import { LotteBranchFilter } from '../features/lotte/LotteBranchFilter';
import { CancelVerificationModal } from '../features/movie-share/CancelVerificationModal';
import { MovieShareMonthlyTable, MovieShareSummary } from '../features/movie-share/MovieShareOverview';
import { SharesTable, VerificationsTable } from '../features/movie-share/MovieShareTables';
import { MOVIE_SHARE_MESSAGES, VERIFICATION_STATUS_FILTERS } from '../features/movie-share/movieShareConfig';
import { useMovieSharePage } from '../features/movie-share/useMovieSharePage';

export default function MovieSharePage() {
  const p = useMovieSharePage();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>영화 나눔 현황</h1>
          <p className={shared.pageSubtitle}>Movie Share · 롯데시네마 관람 인증과 나눔</p>
        </div>
      </div>

      <div className={`${shared.card} ${s.filterCard}`}>
        <div className={shared.cardHead}>
          <div className={s.toolbarLeft}>
            <div className={s.segmentGroup}>
              <span className={s.segmentLabel}>기간</span>
              <DateRangePicker
                startDate={p.startDate}
                endDate={p.endDate}
                onStartChange={p.setStartDate}
                onEndChange={p.setEndDate}
              />
            </div>
            <LotteBranchFilter value={p.branch} onChange={p.setBranch} branches={p.branches} />
          </div>
          {p.rangeError ? <span className={s.fieldError}>{p.rangeError}</span> : null}
        </div>
      </div>

      <MovieShareSummary
        branch={p.branch}
        verifications={p.summary.verifications}
        shares={p.summary.shares}
        totalShared={p.totalShared}
        loading={p.statsLoading}
      />

      <MovieShareMonthlyTable
        stats={p.stats}
        cinemas={p.cinemas}
        loading={p.statsLoading}
        error={p.statsError}
        branch={p.branch}
      />

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={s.tabs} role='tablist'>
            <button
              type='button'
              role='tab'
              aria-selected={p.tab === 'verifications'}
              className={`${s.tabBtn} ${p.tab === 'verifications' ? s.tabActive : ''}`}
              onClick={() => p.setTab('verifications')}
            >
              인증 내역
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={p.tab === 'shares'}
              className={`${s.tabBtn} ${p.tab === 'shares' ? s.tabActive : ''}`}
              onClick={() => p.setTab('shares')}
            >
              나눔 내역
            </button>
          </div>

          {p.tab === 'verifications' ? (
            <div className={s.toolbarLeft}>
              <div className={s.segmentGroup}>
                <span className={s.segmentLabel}>상태</span>
                <div className={s.segment} role='group' aria-label='상태'>
                  {VERIFICATION_STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key || 'all'}
                      type='button'
                      className={`${s.segBtn} ${p.statusFilter === f.key ? s.segActive : ''}`}
                      aria-pressed={p.statusFilter === f.key}
                      onClick={() => p.setStatusFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type='search'
                inputMode='numeric'
                className={`${s.searchInput} ${p.reservationError ? s.inputError : ''}`}
                placeholder='예매번호(뒤 4자리도 가능)'
                aria-label='예매번호 검색'
                value={p.reservation}
                maxLength={12}
                onChange={(e) => p.setReservation(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          ) : (
            <div className={s.toolbarLeft}>
              <span className={s.hint}>
                목록은 전체 최근 순 · 내려받기는 위 기간({p.startDate || '처음'} ~ {p.endDate || '오늘'})
              </span>
              <button type='button' className={shared.btnPrimary} onClick={() => void p.exportShares()} disabled={p.exporting}>
                {p.exporting ? '내려받는 중...' : '나눔 내역 내려받기(CSV)'}
              </button>
            </div>
          )}
        </div>

        {p.tab === 'verifications' ? (
          <>
            {p.reservationError ? <p className={s.notice}>{MOVIE_SHARE_MESSAGES.badReservation}</p> : null}
            <VerificationsTable
              rows={p.verRows}
              loading={p.verLoading}
              errorMessage={p.verError}
              emptyMessage={p.verEmpty}
              onCancel={p.openCancel}
            />
            <Pagination
              currentPage={p.verPage}
              totalPages={p.verTotalPages}
              onPageChange={p.setVerPage}
              totalCount={p.verTotal}
              unit='건'
            />
          </>
        ) : (
          <>
            {p.branch ? (
              <p className={s.notice}>나눔은 극장(지점)에 묶이지 않아 지점을 골라도 전체 나눔 내역이 나옵니다.</p>
            ) : null}
            <SharesTable
              rows={p.shareRows}
              loading={p.shareLoading}
              errorMessage={p.shareError}
              emptyMessage={MOVIE_SHARE_MESSAGES.emptyShares}
            />
            <Pagination
              currentPage={p.sharePage}
              totalPages={p.shareTotalPages}
              onPageChange={p.setSharePage}
              totalCount={p.shareTotal}
              unit='건'
            />
          </>
        )}
      </div>

      {p.cancelTarget ? <CancelVerificationModal verification={p.cancelTarget} onClose={p.closeCancel} /> : null}
    </div>
  );
}
