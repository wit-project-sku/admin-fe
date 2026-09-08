import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';

export type SubtitleLanguageDto = {
  code: string;
  name: string;
  sortOrder: number;
  /** true = 기본 4개(KR/EN/JP/CN, 고정 컬럼 저장·삭제 불가), false = 추가 언어(extraTexts 저장) */
  base: boolean;
};

type Envelope<T> = { success: boolean; code: number; message: string; data: T };

const KEY = ['subtitle-languages'];

/** 자막 언어 레지스트리 (GET /admin/kiosks/subtitles/languages). */
export function useSubtitleLanguages() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SubtitleLanguageDto[]> => {
      const body = await APIService.private.get<Envelope<SubtitleLanguageDto[]>>(
        '/admin/kiosks/subtitles/languages',
      );
      return body?.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useSubtitleLanguageMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: KEY });

  const add = useMutation({
    mutationFn: async (vars: { code: string; name?: string }) =>
      APIService.private.post<Envelope<SubtitleLanguageDto>>(
        '/admin/kiosks/subtitles/languages',
        vars,
      ),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (code: string) =>
      APIService.private.delete(`/admin/kiosks/subtitles/languages/${code}`),
    onSuccess: invalidate,
  });

  return {
    addLanguageAsync: add.mutateAsync,
    deleteLanguageAsync: remove.mutateAsync,
    isPending: add.isPending || remove.isPending,
  };
}
