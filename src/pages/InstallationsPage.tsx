// 설치 등록 관리 — 행사 등록 관리(OnsiteEventsPage)와 같은 구성.
import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import SearchableSelect from '@components/common/SearchableSelect';
import Pagination from '@components/common/Pagination';
import RegisterBtn from '@components/common/RegisterBtn';
import DeleteModal from '@modals/DeleteModal';
import InstallationDetailModal from '@modals/InstallationDetailModal';
import InstallationManageModal from '@modals/InstallationManageModal';
import { InstallationsTable } from '../features/installations/InstallationsTable';
import { INSTALLATION_MESSAGES, INSTALLATION_PAGE_SIZE } from '../features/installations/installationConfig';
import { useInstallationManageList } from '../features/installations/useInstallationManageList';

export default function InstallationsPage() {
  const list = useInstallationManageList();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>설치 등록 관리</h1>
          <p className={shared.pageSubtitle}>Installation Management</p>
        </div>
        <RegisterBtn title='설치 등록' onClick={list.openCreate} />
      </div>

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
        >
          <SearchableSelect
            aria-label='키오스크 선택'
            placeholder='전체 키오스크'
            emptyLabel='일치하는 키오스크가 없습니다.'
            options={list.kioskOptions}
            value={list.kioskFilter}
            onChange={list.setKioskFilter}
            minWidth='280px'
          />
          <div style={{ flexShrink: 0 }}>
            <SearchBar
              value={list.search}
              onChange={list.setSearch}
              placeholder='주소·설치 지점·클라이언트·담당자 검색'
              minWidth='280px'
            />
          </div>
        </div>

        <InstallationsTable
          loading={list.loading}
          errorMessage={list.errorMessage}
          emptyMessage={list.emptyMessage}
          rows={list.rows}
          page={list.page}
          pageSize={INSTALLATION_PAGE_SIZE}
          totalCount={list.totalCount}
          onView={list.openDetail}
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

      {list.showDetailModal && list.selectedId != null ? (
        <InstallationDetailModal
          installationId={list.selectedId}
          onClose={() => list.setShowDetailModal(false)}
          onEdit={list.openEdit}
          onDelete={list.openDelete}
        />
      ) : null}

      {list.showManageModal ? (
        <InstallationManageModal
          open={list.showManageModal}
          mode={list.modalMode}
          installationId={list.selectedId}
          onClose={() => list.setShowManageModal(false)}
          onSuccess={() => list.setShowManageModal(false)}
        />
      ) : null}

      {list.showDeleteModal ? (
        <DeleteModal
          open={list.showDeleteModal}
          title='설치 정보를 삭제하시겠습니까?'
          target={list.selectedName}
          description={INSTALLATION_MESSAGES.deleteWarning}
          loading={list.isDeleting}
          onConfirm={list.confirmDelete}
          onClose={() => list.setShowDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
