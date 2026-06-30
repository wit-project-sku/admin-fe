import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { USERS_BASE_KEY } from './useGetUsers';
import type { AdminUserRole } from './useGetUsers';

export type CreateUserBody = {
  username: string;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: AdminUserRole;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: createUserAsync, isPending } = useMutation({
    mutationFn: (body: CreateUserBody) =>
      APIService.private.post('/users/sign-up', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_BASE_KEY });
    },
  });

  return { createUserAsync, isPending };
};
