import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { APIService } from '../../utils/axios';
import { buildShopMultipart } from '../../utils/formDataBuilder';
import type {
  InstallationDetailDto,
  InstallationListParams,
  InstallationPayload,
  InstallationSummaryDto,
} from './installationTypes';

const BASE = '/admin/kiosk-installations';
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** 등록·수정·삭제 뒤 이 접두어 전체(목록·상세)를 다시 받는다. */
export const installationKeys = {
  all: ['kiosk-installations'] as const,
  list: (params: InstallationListParams) => ['kiosk-installations', 'list', params] as const,
  detail: (id: number) => ['kiosk-installations', 'detail', id] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number };

/** BaseResponse 의 `data` 만 꺼낸다. */
const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

/** GET `/admin/kiosk-installations` — 최근 설치 순. keyword = 주소·설치 지점·클라이언트·담당자 부분일치. */
export const useInstallationList = (params: InstallationListParams) => {
  const { data, isPending, isError } = useQuery({
    queryKey: installationKeys.list(params),
    queryFn: async () => {
      const res = await APIService.private.get(BASE, {
        params: {
          pageNum: params.pageNum,
          pageSize: params.pageSize,
          ...(params.kioskId ? { kioskId: params.kioskId } : {}),
          ...(params.keyword ? { keyword: params.keyword } : {}),
        },
      });
      return dataOf<PageData<InstallationSummaryDto>>(res);
    },
    placeholderData: keepPreviousData,
  });
  return {
    rows: data?.content ?? [],
    totalElements: Number(data?.totalElements) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    isPending,
    isError,
  };
};

/** GET `/admin/kiosk-installations/{id}` — 상세 보기·수정 창 채우기(연락처 포함). */
export const useInstallation = (id: number | null) => {
  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: installationKeys.detail(id ?? 0),
    enabled: id != null,
    queryFn: async () => dataOf<InstallationDetailDto>(await APIService.private.get(`${BASE}/${id}`)),
    // 404 는 다시 받아도 같다(이미 지워진 설치 정보) — 재시도 없이 바로 알린다.
    retry: (count, err) => !(isAxiosError(err) && err.response?.status === 404) && count < 3,
  });
  return { installation: data ?? null, isPending: id != null && isPending, isError, isFetching };
};

/** 등록·수정·삭제. 성공하면 설치 정보 조회를 모두 무효화한다. */
export const useInstallationMutations = () => {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: installationKeys.all });

  const create = useMutation({
    mutationFn: ({ data, images }: { data: InstallationPayload; images: File[] }) =>
      APIService.private.post(BASE, buildShopMultipart(data, images), MULTIPART),
    onSuccess,
  });
  const update = useMutation({
    mutationFn: ({ id, data, images }: { id: number; data: InstallationPayload; images: File[] }) =>
      APIService.private.put(`${BASE}/${id}`, buildShopMultipart(data, images), MULTIPART),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: (id: number) => APIService.private.delete(`${BASE}/${id}`),
    // 실패해도 다시 받는다 — 404 면 이미 지워진 행이 목록에서 빠져야 한다.
    onSettled: onSuccess,
  });

  return {
    createAsync: create.mutateAsync,
    updateAsync: update.mutateAsync,
    deleteAsync: remove.mutateAsync,
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
  };
};
