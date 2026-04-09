import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export interface OutfitByIdData {
  id: number;
  categoryName: string;
  name: string;
  status: string;
  imageUrl: string;
  kioskIds: number[];
  outfitCode: string;
  startDate: string | null;
  endDate: string | null;
}

export interface OutfitByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: OutfitByIdData;
}

export const useGetOutfitById = (outfitId: number | string | null | undefined) => {
  const { data, isLoading, error } = useQuery<OutfitByIdResponse, Error>({
    queryKey: ['outfit-by-id', outfitId],
    enabled: Boolean(outfitId),
    queryFn: async () => {
      return await APIService.private.get(`/admin/outfits/${outfitId}`);
    },
  });
  return { data, isLoading, error };
};
