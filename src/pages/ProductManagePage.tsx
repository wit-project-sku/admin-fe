import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import ProductManageModal from '@modals/ProductManageModal';
import DeleteModal from '@modals/DeleteModal';
import RegisterBtn from '@components/common/RegisterBtn';
import { ProductManageTable } from '../features/products/ProductManageTable';
import { PRODUCT_STATUS_FILTERS } from '../features/products/productListConfig';
import { useProductManageList, type ProductFilterTab } from '../features/products/useProductManageList';

export default function ProductManagePage() {
  const list = useProductManageList();

  return (
    <div className={shared.pageContainer}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>상품 관리</h1>
          <p className={shared.pageSubtitle}>Product Inventory Management</p>
        </div>
        <RegisterBtn title="상품 등록" onClick={list.openCreate} />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
        >
          <FilterGroup
            filters={[...PRODUCT_STATUS_FILTERS]}
            current={list.filter}
            onFilterChange={(key) => list.setFilter(key as ProductFilterTab)}
          />
          <div style={{ flexShrink: 0 }}>
            <SearchBar value={list.search} onChange={list.setSearch} placeholder="상품명 검색..." minWidth="280px" />
          </div>
        </div>

        <ProductManageTable
          loading={list.loading}
          error={list.hasError}
          rows={list.displayedProducts}
          onEdit={list.openEdit}
          onDelete={list.openDelete}
        />

        <Pagination
          currentPage={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          totalCount={list.totalCount}
          unit="종"
        />
      </div>

      {list.showManageModal ? (
        <ProductManageModal
          open={list.showManageModal}
          mode={list.modalMode}
          product={list.selectedProduct}
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
          title="상품을 삭제하시겠습니까?"
          target={list.selectedProduct?.name}
          loading={list.isDeleting}
          onConfirm={list.confirmDelete}
          onClose={() => list.setShowDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
