import type { UserListItem } from '../../hooks/user-api/useGetUsers';

export type UserRow = {
  userId: number;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  role: string;
};

export const mapUserListItemToRow = (item: UserListItem): UserRow => ({
  userId: Number(item.userId),
  username: String(item.username ?? ''),
  name: String(item.name ?? ''),
  email: String(item.email ?? ''),
  phoneNumber: String(item.phoneNumber ?? ''),
  isActive: Boolean(item.isActive),
  role: String(item.role ?? ''),
});
