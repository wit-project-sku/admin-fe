// 행사 등록 관리 — 의상 등록 관리(OutfitsPage)와 같은 구성. 보관 기능은 두지 않는다(기획 확정).
import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import RegisterBtn from '@components/common/RegisterBtn';
import DeleteModal from '@modals/DeleteModal';
import OnsiteEventManageModal from '@modals/OnsiteEventManageModal';
import { OnsiteEventsTable } from '../features/onsite-events/OnsiteEventsTable';
import { ONSITE_EVENT_PAGE_SIZE } from '../features/onsite-events/onsiteEventConfig';
import { useOnsiteEventManageList } from '../features/onsite-events/useOnsiteEventManageList';

export default function OnsiteEventsPage() {
  const list = useOnsiteEventManageList();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>행사 등록 관리</h1>
          <p className={shared.pageSubtitle}>Event Management</p>
        </div>
        <RegisterBtn title='행사 등록' onClick={list.openCreate} />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
        >
          <FilterGroup
            label='연도'
            filters={list.yearFilters}
            current={list.yearFilter}
            onFilterChange={list.setYearFilter}
          />
          <div style={{ flexShrink: 0 }}>
            <SearchBar
              value={list.search}
              onChange={list.setSearch}
              placeholder='행사명·행사 지점 검색'
              minWidth='280px'
            />
          </div>
        </div>

        <OnsiteEventsTable
          loading={list.loading}
          errorMessage={list.errorMessage}
          rows={list.rows}
          page={list.page}
          pageSize={ONSITE_EVENT_PAGE_SIZE}
          totalCount={list.totalCount}
          onEdit={list.openEdit}
          onDelete={list.openDelete}
        />

        <Pagination
          currentPage={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          totalCount={list.totalCount}
          unit='건'
        />
      </div>

      {list.showManageModal ? (
        <OnsiteEventManageModal
          open={list.showManageModal}
          mode={list.modalMode}
          eventId={list.selectedId}
          onClose={() => list.setShowManageModal(false)}
          onSuccess={() => list.setShowManageModal(false)}
        />
      ) : null}

      {list.showDeleteModal ? (
        <DeleteModal
          open={list.showDeleteModal}
          title='행사를 삭제하시겠습니까?'
          target={list.selectedName}
          loading={list.isDeleting}
          onConfirm={list.confirmDelete}
          onClose={() => list.setShowDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
