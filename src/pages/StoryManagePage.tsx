// 사연 관리(롯데 키오스크 '오늘의 사연') — 앱에서 보낸 사연을 검수(승인·숨김)하고 지점별 표시 순서를 정한다.
import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import DateRangePicker from '@components/common/DateRangePicker';
import s from '../features/lotte/Lotte.module.css';
import { LotteBranchFilter } from '../features/lotte/LotteBranchFilter';
import { branchLabel } from '../features/lotte/lotteBranches';
import { StoriesTable } from '../features/stories/StoriesTable';
import { StoryOrderModal } from '../features/stories/StoryOrderModal';
import { StoryPreviewModal } from '../features/stories/StoryPreviewModal';
import { STORY_KIOSK_WINDOW_DAYS, STORY_MESSAGES, STORY_TABS } from '../features/stories/storyConfig';
import { useStoryManagePage } from '../features/stories/useStoryManagePage';

export default function StoryManagePage() {
  const p = useStoryManagePage();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>사연 관리</h1>
          <p className={shared.pageSubtitle}>
            Today&apos;s Stories · 승인한 사연만 키오스크에 나오며, 승인 후 {STORY_KIOSK_WINDOW_DAYS}일이 지나면 내려갑니다
          </p>
        </div>
        <button
          type='button'
          className={shared.btnOutline}
          onClick={p.openOrder}
          disabled={!p.canOrder}
          title={p.canOrder ? undefined : STORY_MESSAGES.orderNeedsBranch}
        >
          순서 정하기
        </button>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={s.toolbarLeft}>
            <LotteBranchFilter value={p.branch} onChange={p.setBranch} branches={p.branches} />
            <div className={s.segmentGroup}>
              <span className={s.segmentLabel}>올린 날짜</span>
              <DateRangePicker
                startDate={p.startDate}
                endDate={p.endDate}
                onStartChange={p.setStartDate}
                onEndChange={p.setEndDate}
              />
              {p.hasRange ? (
                <button type='button' className={shared.btnOutline} onClick={p.clearRange}>
                  전체 기간
                </button>
              ) : null}
            </div>
            <div className={s.segmentGroup}>
              <span className={s.segmentLabel}>상태</span>
              <div className={s.segment} role='tablist' aria-label='상태'>
                {STORY_TABS.map((t) => {
                  const count = p.counts[t.key];
                  return (
                    <button
                      key={t.key}
                      type='button'
                      role='tab'
                      aria-selected={p.tab === t.key}
                      className={`${s.segBtn} ${p.tab === t.key ? s.segActive : ''}`}
                      onClick={() => p.setTab(t.key)}
                    >
                      {t.label}
                      <span className={`${s.segCount} ${t.key === 'PENDING' && count ? s.segCountAlert : ''}`}>
                        {p.branchMissing ? 0 : (count ?? '·')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {p.rangeError ? (
            <span className={s.fieldError}>{p.rangeError}</span>
          ) : !p.canOrder ? (
            <span className={s.hint}>{STORY_MESSAGES.orderNeedsBranch}</span>
          ) : null}
        </div>

        {p.branchMissing ? <p className={s.notice}>{STORY_MESSAGES.branchMissing(p.branch)}</p> : null}

        <StoriesTable
          loading={p.loading}
          errorMessage={p.errorMessage}
          emptyMessage={p.emptyMessage}
          rows={p.rows}
          pendingStatusId={p.pendingStatusId}
          branchCodeOf={p.branchCodeOf}
          onView={p.openPreview}
          onChangeStatus={(row, next) => void p.changeStatus(row, next)}
        />

        <Pagination
          currentPage={p.page}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          totalCount={p.totalCount}
          unit='건'
        />
      </div>

      {p.preview ? (
        <StoryPreviewModal
          story={p.preview}
          branchCode={p.branchCodeOf(p.preview.kioskId)}
          busy={p.pendingStatusId === p.preview.id}
          onClose={p.closePreview}
          onChangeStatus={(story, next) => void p.changeStatus(story, next)}
        />
      ) : null}

      {p.showOrder && p.orderKioskId != null && p.selectedBranch ? (
        <StoryOrderModal
          kioskId={p.orderKioskId}
          branchLabel={branchLabel(p.selectedBranch)}
          saving={p.isSavingOrder}
          onSave={p.saveOrderAsync}
          onClose={p.closeOrder}
        />
      ) : null}
    </div>
  );
}
