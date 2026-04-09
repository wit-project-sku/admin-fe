import { useQuery } from '@tanstack/react-query';
import { APIService } from '../utils/axios';

type UseGetKiosksOptions = {
  enabled?: boolean;
};

export const useGetKiosks = (options?: UseGetKiosksOptions) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['kiosks-get-all'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return await APIService.private.get('/admin/kiosks');
    },
  });

  return { data, isLoading, error };
};
