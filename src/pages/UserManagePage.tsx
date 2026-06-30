import { useState } from 'react';
import shared from '@commons/shared.module.css';
import RegisterBtn from '@components/common/RegisterBtn';
import Pagination from '@components/common/Pagination';
import DeleteModal from '@modals/DeleteModal';
import UserManageModal from '@modals/UserManageModal';
import DetailModal from '@modals/DetailModal';
import { UserManageTable } from '../features/users/UserManageTable';
import type { UserRow } from '../features/users/userListMappers';
import { USER_FILTER_TABS, USER_ROLE_LABELS } from '../features/users/userListConfig';
import { useUserManageList } from '../features/users/useUserManageList';

export default function UserManagePage() {
  const list = useUserManageList();
  const [detailRow, setDetailRow] = useState<UserRow | null>(null);

  return (
    <div className={shared.pageContainer}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>사용자 관리</h1>
          <p className={shared.pageSubtitle}>User Account Management</p>
        </div>
        <RegisterBtn title="사용자 등록" onClick={list.openCreate} />
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={shared.filterGroup}>
            {USER_FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${shared.filterBtn} ${list.filter === tab.key ? shared.filterBtnActive : ''}`}
                onClick={() => list.setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={shared.searchBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="아이디 또는 이름 검색..."
              value={list.search}
              onChange={(e) => list.setSearch(e.target.value)}
            />
          </div>
        </div>

        <UserManageTable
          loading={list.loading}
          error={list.hasError}
          rows={list.displayedUsers}
          onEdit={list.openEdit}
          onDelete={list.openDelete}
          onStatusChange={list.handleStatusChange}
          onRowClick={setDetailRow}
        />

        <Pagination
          currentPage={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          totalCount={list.totalCount}
          unit="명"
        />
      </div>

      {list.showManageModal ? (
        <UserManageModal
          open={list.showManageModal}
          mode={list.modalMode}
          user={list.selectedUser}
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
          title="사용자를 삭제하시겠습니까?"
          target={list.selectedUser?.name ?? list.selectedUser?.username}
          loading={list.isDeleting}
          onConfirm={list.confirmDelete}
          onClose={() => list.setShowDeleteModal(false)}
        />
      ) : null}

      <DetailModal
        open={!!detailRow}
        title={detailRow ? `사용자 상세 — ${detailRow.username}` : '사용자 상세'}
        onClose={() => setDetailRow(null)}
        fields={
          detailRow
            ? [
                { label: 'ID', value: detailRow.userId },
                { label: '아이디', value: detailRow.username },
                { label: '이름', value: detailRow.name },
                { label: '역할', value: USER_ROLE_LABELS[detailRow.role] ?? detailRow.role },
                { label: '상태', value: detailRow.isActive ? '활성' : '비활성' },
                { label: '이메일', value: detailRow.email },
                { label: '전화번호', value: detailRow.phoneNumber },
              ]
            : []
        }
      />
    </div>
  );
}
