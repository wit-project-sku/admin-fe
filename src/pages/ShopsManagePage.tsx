import shared from '@commons/shared.module.css';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import ShopsManageModal from '@modals/ShopsManageModal';
import DeleteModal from '@modals/DeleteModal';
import RegisterBtn from '@components/common/RegisterBtn';
import { ShopsManageTable } from '../features/shops/ShopsManageTable';
import { useShopsManageList } from '../features/shops/useShopsManageList';

export default function ShopsManagePage() {
  const list = useShopsManageList();

  return (
    <div className={shared.pageContainer}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>상점 관리</h1>
          <p className={shared.pageSubtitle}>Kiosk Shop Management</p>
        </div>
        <RegisterBtn title="상점 등록" onClick={list.openCreate} />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
        >
          <FilterGroup
            filters={list.kioskOptions}
            current={list.selectedKioskId != null ? String(list.selectedKioskId) : ''}
            onFilterChange={list.setKiosk}
          />
        </div>

        <ShopsManageTable
          loading={list.loading}
          error={list.hasError}
          rows={list.displayedShops}
          onEdit={list.openEdit}
          onDelete={list.openDelete}
        />

        <Pagination
          currentPage={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          totalCount={list.totalCount}
          unit="개"
        />
      </div>

      {list.showManageModal ? (
        <ShopsManageModal
          open={list.showManageModal}
          mode={list.modalMode}
          shop={list.selectedShop}
          defaultKioskId={list.selectedKioskId}
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
          title="상점을 삭제하시겠습니까?"
          target={list.selectedShop?.name}
          loading={list.isDeleting}
          onConfirm={list.confirmDelete}
          onClose={() => list.setShowDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
