import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { AdDetailDto, AdPayload, AdSummaryDto } from './adTypes';

const BASE = '/admin/ads';

export const adKeys = {
  all: ['ads'] as const,
  list: ['ads', 'list'] as const,
  detail: (id: number) => ['ads', 'detail', id] as const,
};

const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

const jsonPart = (payload: unknown): Blob => new Blob([JSON.stringify(payload)], { type: 'application/json' });

/**
 * GET `/admin/ads` — sortOrder 순 전체.
 * 순서 저장(PUT /order)은 "삭제 안 된 광고 전체"와 같은 집합이어야 해서, 상태·검색 필터는 서버에 넘기지 않고 화면에서 거른다.
 */
export const useAdList = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: adKeys.list,
    queryFn: async () => dataOf<AdSummaryDto[]>(await APIService.private.get(BASE)) ?? [],
  });
  return { ads: data ?? [], isPending, isError };
};

/** GET `/admin/ads/{id}` — 수정 창 채우기(연락처 원문·메모). */
export const useAd = (id: number | null) => {
  const { data, isPending, isError } = useQuery({
    queryKey: adKeys.detail(id ?? 0),
    enabled: id != null,
    // 연락처 원문이 들어 있어 창을 닫으면 바로 버린다.
    gcTime: 0,
    queryFn: async () => dataOf<AdDetailDto>(await APIService.private.get(`${BASE}/${id}`)),
  });
  return { ad: data ?? null, isPending: id != null && isPending, isError };
};

type SaveArgs = {
  payload: AdPayload;
  /** 주면 교체. 위치를 끄면 서버가 그 위치 이미지를 지운다. */
  kioskImage?: File | null;
  appImage?: File | null;
};

const toFormData = ({ payload, kioskImage, appImage }: SaveArgs): FormData => {
  const fd = new FormData();
  fd.append('data', jsonPart(payload));
  if (kioskImage) fd.append('kioskImage', kioskImage);
  if (appImage) fd.append('appImage', appImage);
  return fd;
};

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** 등록·수정·삭제·순서. 성공하면 광고 조회를 모두 무효화한다. */
export const useAdMutations = () => {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: adKeys.all });

  const create = useMutation({
    mutationFn: (args: SaveArgs) => APIService.private.post(BASE, toFormData(args), MULTIPART),
    onSuccess,
  });
  const update = useMutation({
    mutationFn: ({ id, ...args }: SaveArgs & { id: number }) =>
      APIService.private.put(`${BASE}/${id}`, toFormData(args), MULTIPART),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: (id: number) => APIService.private.delete(`${BASE}/${id}`),
    onSuccess,
  });
  /** PUT `/admin/ads/order` — 삭제 안 된 광고 전체 id 를 새 순서대로. */
  const reorder = useMutation({
    mutationFn: (ids: number[]) => APIService.private.put(`${BASE}/order`, ids),
    onSuccess,
  });

  return {
    createAsync: create.mutateAsync,
    updateAsync: update.mutateAsync,
    deleteAsync: remove.mutateAsync,
    reorderAsync: reorder.mutateAsync,
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
    isReordering: reorder.isPending,
  };
};
