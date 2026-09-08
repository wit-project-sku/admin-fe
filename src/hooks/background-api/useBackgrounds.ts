import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';
import { unwrapList } from '@/utils/unwrapApi';
import type { Background, BackgroundWriteBody } from './backgroundApiTypes';

const KEY = ['backgrounds'];

export const useGetBackgrounds = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: KEY,
    queryFn: async () => APIService.private.get('/admin/backgrounds'),
  });
  return { backgrounds: unwrapList(data) as Background[], isLoading, error, refetch };
};

/** 등록 — 파일명이 곧 코드다. 서버가 코드에서 의상을 찾아 연결한다. */
export const useAddBackgrounds = () => {
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ body, images }: { body: BackgroundWriteBody; images: File[] }) => {
      const form = new FormData();
      form.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
      images.forEach((file) => form.append('images', file));
      return APIService.private.post('/admin/backgrounds', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return { addBackgroundsAsync: mutateAsync, isPending };
};

export const useUpdateBackground = () => {
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ id, body, image }: { id: number; body: BackgroundWriteBody; image?: File }) => {
      const form = new FormData();
      form.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
      if (image) form.append('image', image);
      return APIService.private.put(`/admin/backgrounds/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return { updateBackgroundAsync: mutateAsync, isPending };
};

export const useDeleteBackground = () => {
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: number) => APIService.private.delete(`/admin/backgrounds/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return { deleteBackgroundAsync: mutateAsync, isPending };
};
