import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import OutfitManageModal from '@modals/OutfitManageModal';
import DeleteModal from '@modals/DeleteModal';
import RegisterBtn from '@components/common/RegisterBtn';
import { OutfitsTable } from '../features/outfits/OutfitsTable';
import { OUTFIT_PAGE_SIZE, OUTFIT_STATUS_FILTERS } from '../features/outfits/outfitListConfig';
import { useOutfitManageList } from '../features/outfits/useOutfitManageList';

export default function OutfitsPage() {
  const list = useOutfitManageList();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>의상 관리 시스템</h1>
          <p className={shared.pageSubtitle}>Inventory & Management</p>
        </div>
        <RegisterBtn title="의상 등록" onClick={list.openCreate} />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
        >
          <FilterGroup filters={[...OUTFIT_STATUS_FILTERS]} current={list.filter} onFilterChange={list.setFilter} />
          <div style={{ flexShrink: 0 }}>
            <SearchBar
              value={list.search}
              onChange={list.setSearch}
              placeholder="의상 코드, 이름, 카테고리 검색..."
              minWidth="280px"
            />
          </div>
        </div>

        <OutfitsTable
          loading={list.loading}
          errorMessage={list.errorMessage}
          rows={list.displayed}
          page={list.page}
          pageSize={OUTFIT_PAGE_SIZE}
          kioskNameById={list.kioskNameById}
          onEdit={list.openEdit}
          onDelete={list.openDelete}
        />

        <Pagination
          currentPage={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          totalCount={list.totalCount}
          unit="건"
        />
      </div>

      {list.showManageModal ? (
        <OutfitManageModal
          open={list.showManageModal}
          mode={list.modalMode}
          outfitId={list.selectedId}
          onClose={() => list.setShowManageModal(false)}
          onSuccess={() => {
            list.setShowManageModal(false);
            list.refetch();
          }}
        />
      ) : null}

      {list.showDeleteModal ? (
        <DeleteModal
          open={list.showDeleteModal}
          title="의상을 삭제하시겠습니까?"
          target={list.selectedName}
          loading={list.isDeleting}
          onConfirm={list.confirmDelete}
          onClose={() => list.setShowDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
