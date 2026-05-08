import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { USERS_BASE_KEY } from './useGetUsers';

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: setUserActiveAsync, isPending } = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      APIService.private.patch(`/users/${userId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_BASE_KEY });
    },
  });

  return { setUserActiveAsync, isPending };
};
