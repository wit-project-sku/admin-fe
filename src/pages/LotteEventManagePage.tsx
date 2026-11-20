// 건물 이벤트(롯데 키오스크 '건물 안내 › 이벤트') — 지점·건물별 이벤트를 등록·수정·삭제한다. 기능 가이드 5절 '건물 구분 칸'.
import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import s from '../features/lotte/Lotte.module.css';
import { LotteBranchFilter } from '../features/lotte/LotteBranchFilter';
import { LotteEventDeleteModal } from '../features/lotte-events/LotteEventDeleteModal';
import { LotteEventFormModal } from '../features/lotte-events/LotteEventFormModal';
import { LotteEventsTable } from '../features/lotte-events/LotteEventsTable';
import { LOTTE_EVENT_MESSAGES, LOTTE_EVENT_TABS } from '../features/lotte-events/lotteEventConfig';
import { useLotteEventPage } from '../features/lotte-events/useLotteEventPage';

export default function LotteEventManagePage() {
  const p = useLotteEventPage();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>건물 이벤트</h1>
          <p className={shared.pageSubtitle}>
            Building Events · 키오스크 건물 안내에 건물별로 나오며, 종료일이 지나면 내려갑니다
          </p>
        </div>
        <button type='button' className={shared.btnPrimary} onClick={p.openCreate}>
          이벤트 등록
        </button>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={s.toolbarLeft}>
            <LotteBranchFilter value={p.branch} onChange={p.setBranch} branches={p.branches} />
            {p.showBuildingFilter ? (
              <div className={s.segmentGroup}>
                <span className={s.segmentLabel}>건물</span>
                <div className={s.segment} role='group' aria-label='건물'>
                  {['', ...p.buildingOptions].map((b) => (
                    <button
                      key={b || 'all'}
                      type='button'
                      className={`${s.segBtn} ${p.building === b ? s.segActive : ''}`}
                      aria-pressed={p.building === b}
                      onClick={() => p.setBuilding(b)}
                    >
                      {b || '전체'}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={s.segmentGroup}>
              <span className={s.segmentLabel}>상태</span>
              <div className={s.segment} role='tablist' aria-label='상태'>
                {LOTTE_EVENT_TABS.map((t) => (
                  <button
                    key={t.key}
                    type='button'
                    role='tab'
                    aria-selected={p.tab === t.key}
                    className={`${s.segBtn} ${p.tab === t.key ? s.segActive : ''}`}
                    onClick={() => p.setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {p.branchMissing ? <p className={s.notice}>{LOTTE_EVENT_MESSAGES.branchMissing(p.branch)}</p> : null}

        <LotteEventsTable
          loading={p.loading}
          errorMessage={p.errorMessage}
          emptyMessage={p.emptyMessage}
          rows={p.rows}
          branchCodeOf={p.branchCodeOf}
          onEdit={p.openEdit}
          onDelete={p.openDelete}
        />

        <Pagination
          currentPage={p.page}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          totalCount={p.totalCount}
          unit='건'
        />
      </div>

      {p.editing ? (
        <LotteEventFormModal
          event={p.editing === 'new' ? null : p.editing}
          branches={p.branches}
          defaultBranch={p.defaultBranch}
          onClose={p.closeEdit}
        />
      ) : null}

      {p.deleting ? (
        <LotteEventDeleteModal event={p.deleting} branchCode={p.branchCodeOf(p.deleting.kioskId)} onClose={p.closeDelete} />
      ) : null}
    </div>
  );
}
