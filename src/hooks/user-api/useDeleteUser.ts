import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { USERS_BASE_KEY } from './useGetUsers';

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: deleteUserAsync, isPending } = useMutation({
    mutationFn: (userId: number) =>
      APIService.private.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_BASE_KEY });
    },
  });

  return { deleteUserAsync, isPending };
};
