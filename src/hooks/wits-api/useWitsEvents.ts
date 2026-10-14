import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type {
  WitsEventBannerDto,
  WitsEventDetailDto,
  WitsEventListParams,
  WitsEventParticipantDto,
  WitsEventPayload,
  WitsEventSummaryDto,
} from './witsTypes';

const BASE = '/admin/wits-events';

/** 등록·수정·삭제·순서 변경 뒤 이 접두어 전체(목록·상세·배너·참여자·알림 창의 이벤트 선택지)를 다시 받는다. */
export const witsEventKeys = {
  all: ['wits-events'] as const,
  list: (params: WitsEventListParams) => ['wits-events', 'list', params] as const,
  detail: (id: number) => ['wits-events', 'detail', id] as const,
  banners: ['wits-events', 'banners'] as const,
  participants: (id: number, pageNum: number, pageSize: number) =>
    ['wits-events', 'participants', id, pageNum, pageSize] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number };

/** BaseResponse 의 `data` 만 꺼낸다. */
const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

/** 멀티파트 `data`(JSON) 파트는 content-type 을 명시해야 서버가 역직렬화한다. */
const jsonPart = (payload: unknown): Blob => new Blob([JSON.stringify(payload)], { type: 'application/json' });

/** GET `/admin/wits-events` — 최근 시작 순. keyword = 한국어 제목 부분일치. */
export const useWitsEventList = (params: WitsEventListParams, options?: { enabled?: boolean }) => {
  const { data, isPending, isError } = useQuery({
    queryKey: witsEventKeys.list(params),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await APIService.private.get(BASE, {
        params: {
          pageNum: params.pageNum,
          pageSize: params.pageSize,
          ...(params.status ? { status: params.status } : {}),
          ...(params.keyword ? { keyword: params.keyword } : {}),
        },
      });
      return dataOf<PageData<WitsEventSummaryDto>>(res);
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

/** GET `/admin/wits-events/{id}` — 수정 창 채우기. */
export const useWitsEvent = (id: number | null) => {
  const { data, isPending, isError } = useQuery({
    queryKey: witsEventKeys.detail(id ?? 0),
    enabled: id != null,
    queryFn: async () => dataOf<WitsEventDetailDto>(await APIService.private.get(`${BASE}/${id}`)),
  });
  return { event: data ?? null, isPending: id != null && isPending, isError };
};

/** GET `/admin/wits-events/banners` — 앱 홈 배너 노출 중인 이벤트(bannerOrder 순). */
export const useWitsEventBanners = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: witsEventKeys.banners,
    queryFn: async () => dataOf<WitsEventBannerDto[]>(await APIService.private.get(`${BASE}/banners`)) ?? [],
  });
  return { banners: data ?? [], isPending, isError };
};

/** GET `/admin/wits-events/{id}/participants` — 참여 최신순. */
export const useWitsEventParticipants = (id: number | null, pageNum: number, pageSize: number) => {
  const { data, isPending, isError } = useQuery({
    queryKey: witsEventKeys.participants(id ?? 0, pageNum, pageSize),
    enabled: id != null,
    queryFn: async () =>
      dataOf<PageData<WitsEventParticipantDto>>(
        await APIService.private.get(`${BASE}/${id}/participants`, { params: { pageNum, pageSize } }),
      ),
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

type SaveArgs = {
  payload: WitsEventPayload;
  /** 새 배너 이미지(주면 교체). */
  bannerImage?: File | null;
  /** 새로 더할 본문 이미지(기존 유지분 뒤에 붙는다). */
  contentImages?: File[];
};

const toFormData = ({ payload, bannerImage, contentImages }: SaveArgs): FormData => {
  const fd = new FormData();
  fd.append('data', jsonPart(payload));
  if (bannerImage) fd.append('bannerImage', bannerImage);
  (contentImages ?? []).forEach((f) => fd.append('contentImages', f));
  return fd;
};

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** 등록·수정·삭제·배너 순서. 성공하면 이벤트 관련 조회를 모두 무효화한다(알림 창의 이벤트 이름도 바뀔 수 있어 알림도). */
export const useWitsEventMutations = () => {
  const qc = useQueryClient();
  const onSuccess = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: witsEventKeys.all }),
      qc.invalidateQueries({ queryKey: ['wits-notifications'] }),
    ]);
  };

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
  /** PUT `/banners/order` — 배너 노출 목록과 정확히 같은 id 집합이어야 한다(아니면 400). */
  const reorderBanners = useMutation({
    mutationFn: (ids: number[]) => APIService.private.put(`${BASE}/banners/order`, ids),
    onSuccess,
  });

  return {
    createAsync: create.mutateAsync,
    updateAsync: update.mutateAsync,
    deleteAsync: remove.mutateAsync,
    reorderBannersAsync: reorderBanners.mutateAsync,
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
    isReordering: reorderBanners.isPending,
  };
};
