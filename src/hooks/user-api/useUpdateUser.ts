import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { USERS_BASE_KEY } from './useGetUsers';
import type { AdminUserRole } from './useGetUsers';

export type UpdateUserBody = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: AdminUserRole;
  password?: string;
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateUserAsync, isPending } = useMutation({
    mutationFn: ({ userId, body }: { userId: number; body: UpdateUserBody }) =>
      APIService.private.patch(`/users/${userId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_BASE_KEY });
    },
  });

  return { updateUserAsync, isPending };
};
