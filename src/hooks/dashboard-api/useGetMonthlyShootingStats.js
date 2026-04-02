import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetMonthlyShootingStats = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['monthlyShootingStats'],
        queryFn: async () => {
            return await APIService.private.get('/admin/stats/monthly');
        }
    });

    return { data, isLoading, error };
}