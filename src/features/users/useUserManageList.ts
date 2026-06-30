import { useState, useMemo, useCallback } from 'react';
import { useGetUsers } from '../../hooks/user-api/useGetUsers';
import { useDeleteUser } from '../../hooks/user-api/useDeleteUser';
import { useBlockUser } from '../../hooks/user-api/useBlockUser';
import { mapUserListItemToRow, type UserRow } from './userListMappers';
import { USER_PAGE_SIZE, USER_TABLE_MESSAGES, type UserFilterTab } from './userListConfig';
import type { UserFilterParam } from '../../hooks/user-api/useGetUsers';

export function useUserManageList() {
  const [search, setSearchRaw] = useState('');
  const [filter, setFilterRaw] = useState<UserFilterTab>('ALL');
  const [page, setPageRaw] = useState(1);

  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filterParam: UserFilterParam | undefined =
    filter === 'ALL' ? undefined : filter;

  const { data, isLoading: loading, error, refetch } = useGetUsers({
    pageNum: page,
    pageSize: USER_PAGE_SIZE,
    keyword: search.trim() || undefined,
    filter: filterParam,
  });

  const { deleteUserAsync } = useDeleteUser();
  const { setUserActiveAsync } = useBlockUser();

  const displayedUsers = useMemo(
    () => (data?.content ?? []).map(mapUserListItemToRow),
    [data],
  );

  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalElements ?? 0;

  const setSearch = useCallback((v: string) => { setSearchRaw(v); setPageRaw(1); }, []);
  const setFilter = useCallback((v: UserFilterTab) => { setFilterRaw(v); setPageRaw(1); }, []);
  const setPage = useCallback((v: number) => setPageRaw(v), []);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setSelectedUser(null);
    setShowManageModal(true);
  }, []);

  const openEdit = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setModalMode('edit');
    setShowManageModal(true);
  }, []);

  const openDelete = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedUser?.userId == null) return;
    setIsDeleting(true);
    try {
      await deleteUserAsync(selectedUser.userId);
      setShowDeleteModal(false);
    } catch {
      alert(USER_TABLE_MESSAGES.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedUser, deleteUserAsync]);

  const handleStatusChange = useCallback(async (user: UserRow, isActive: boolean) => {
    try {
      await setUserActiveAsync({ userId: user.userId, isActive });
    } catch {
      alert(USER_TABLE_MESSAGES.blockFailed);
    }
  }, [setUserActiveAsync]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    loading,
    hasError: Boolean(error),
    displayedUsers,
    totalPages,
    totalCount,
    showManageModal,
    setShowManageModal,
    showDeleteModal,
    setShowDeleteModal,
    modalMode,
    selectedUser,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
    handleStatusChange,
    refetch,
  };
}
