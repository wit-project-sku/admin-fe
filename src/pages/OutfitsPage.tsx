import { useState } from 'react';
import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import Pagination from '@components/common/Pagination';
import OutfitManageModal from '@modals/OutfitManageModal';
import DeleteModal from '@modals/DeleteModal';
import DetailModal from '@modals/DetailModal';
import RegisterBtn from '@components/common/RegisterBtn';
import { OutfitsTable } from '../features/outfits/OutfitsTable';
import type { OutfitRow } from '../features/outfits/outfitListMappers';
import { OUTFIT_PAGE_SIZE, OUTFIT_STATUS_FILTERS } from '../features/outfits/outfitListConfig';
import { useOutfitManageList } from '../features/outfits/useOutfitManageList';

export default function OutfitsPage() {
  const list = useOutfitManageList();
  const [detailRow, setDetailRow] = useState<OutfitRow | null>(null);

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
              placeholder="의상명 검색..."
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
          onRowClick={setDetailRow}
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

      <DetailModal
        open={!!detailRow}
        title={detailRow ? `의상 상세 — ${detailRow.name || detailRow.outfitCode}` : '의상 상세'}
        onClose={() => setDetailRow(null)}
        fields={
          detailRow
            ? [
                { label: '의상코드', value: detailRow.outfitCode },
                { label: '의상명', value: detailRow.name },
                { label: '표시명', value: detailRow.displayName },
                {
                  label: '의상 유형',
                  value:
                    detailRow.type === 'SCHOOL_UNIFORM'
                      ? '교복 (SCHOOL_UNIFORM)'
                      : detailRow.type === 'PREMIUM'
                        ? '프리미엄 (PREMIUM)'
                        : '일반 (NORMAL)',
                },
                detailRow.type === 'SCHOOL_UNIFORM'
                  ? { label: '학교', value: detailRow.schoolName || '—' }
                  : { label: '카테고리', value: detailRow.categoryName },
                { label: '상태', value: detailRow.status === 'ACTIVE' ? '활성화' : '비활성화' },
                { label: '설치 키오스크', value: detailRow.kioskIds?.length ? `${detailRow.kioskIds.length}곳` : '없음' },
                {
                  label: '운영 일정',
                  value:
                    detailRow.operationStartYmd || detailRow.operationEndYmd
                      ? `${detailRow.operationStartYmd || '—'} ~ ${detailRow.operationEndYmd || '—'}`
                      : '상시',
                  full: true,
                },
              ]
            : []
        }
        images={(() => {
          if (!detailRow) return [];
          const urls = [detailRow.imageUrl, ...(detailRow.images ?? []).map((im) => im.imageUrl)].filter(
            (u): u is string => !!u,
          );
          return [...new Set(urls)].map((src) => ({ src, title: detailRow.name }));
        })()}
      />
    </div>
  );
}
