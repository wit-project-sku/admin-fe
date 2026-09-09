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

/** 등록 — 사진 1장 + 고유 번호 + 이름. 번호가 겹치면 서버가 거절한다(BG4013). */
export const useAddBackground = () => {
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ body, image }: { body: BackgroundWriteBody; image: File }) => {
      const form = new FormData();
      form.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
      form.append('image', image);
      return APIService.private.post('/admin/backgrounds', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return { addBackgroundAsync: mutateAsync, isPending };
};

/** 수정 — 보낸 항목만 바뀐다(이미지는 넣었을 때만 교체). */
export const useUpdateBackground = () => {
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      id,
      body,
      image,
    }: {
      id: number;
      body: BackgroundWriteBody;
      image?: File;
    }) => {
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
