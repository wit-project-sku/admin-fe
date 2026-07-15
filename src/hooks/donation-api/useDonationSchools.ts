import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildDataImageMultipart } from '../../utils/formDataBuilder';
import type { CampaignAmountOption } from './donationApiTypes';

/**
 * 기부 학교 — 목록·단건·지역은 공용(`/api/donations/schools`),
 * 등록/수정/삭제는 관리자 전용(`/api/admin/donations/schools`, multipart).
 * 삭제는 소프트(active=false).
 */
export type DonationSchool = {
  id: number;
  name: string;
  /** 정식 명칭(전체). 표시명(name)은 축약일 수 있음. */
  officialName: string | null;
  description: string | null;
  imageUrl: string | null;
  address: string | null;
  /** 지역 코드(Region enum). */
  region: string;
  /** 지역 라벨(예: 서울). */
  regionLabel: string;
  /** 초성(ㄱ~ㅎ, 기타). */
  initial: string;
  active: boolean;
  /** 목표 기부액. 0 = 목표 없음. */
  targetAmount: number | null;
  /** 기부 금액 프리셋(응답 전용, 오름차순). */
  amountOptions: CampaignAmountOption[] | null;
  /** 누적 기부액. */
  accumulatedAmount: number | null;
  /** 참여자 수(기부한 사람 수 = 성공 결제 건수). 목록 조회에서만 채워짐. */
  participantCount: number | null;
  /** 수혜자 수(재학생 수). 등록/수정 시 입력. */
  studentCount: number | null;
  /** 개교년도. 공공데이터 기준. */
  foundingYear: number | null;
  /** 직전 순위 대비 변동(양수=상승▲ / 음수=하락▼ / 0=유지 / null=기준 없음). 기부액순·필터 없는 목록에서만. */
  rankChange: number | null;
  createdAt: string;
};

export type DonationSchoolPage = {
  content: DonationSchool[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetDonationSchoolsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: DonationSchoolPage;
};

export type SchoolSort = 'NAME' | 'DONATION';

export type GetDonationSchoolsParams = {
  pageNum?: number;
  pageSize?: number;
  /** 지역(시·도) 코드 필터. */
  region?: string;
  /** 초성 필터(ㄱ~ㅎ, 기타). */
  initial?: string;
  /** 학교명 검색어. */
  keyword?: string;
  /** 정렬: NAME(이름순) | DONATION(누적 기부액순). */
  sort?: SchoolSort;
  /** 비활성 포함 여부(관리자 true). 미전송 시 활성만. */
  includeInactive?: boolean;
};

export type SchoolWriteBody = {
  name: string;
  /** 정식 명칭(전체). 선택. */
  officialName?: string | null;
  description: string;
  address: string;
  /** 지역 코드(Region enum). */
  region: string;
  /** 수혜자 수(재학생 수). 선택. */
  studentCount?: number | null;
  /** 개교년도. 선택. */
  foundingYear?: number | null;
  /** 목표 기부액. 0 = 목표 없음. */
  targetAmount: number;
  /** 기부 금액 프리셋(오름차순 정수 배열). */
  amountOptions: number[];
};

/** 지역(시·도) 옵션 — payment-be `GET /api/donations/schools/regions`. */
export type RegionOption = { code: string; label: string };

export const DONATION_SCHOOLS_QUERY_KEY = 'donation-schools';
export const DONATION_SCHOOL_REGIONS_QUERY_KEY = 'donation-school-regions';

const SCHOOLS_PUBLIC_PATH = '/donations/schools';
const SCHOOLS_ADMIN_PATH = '/admin/donations/schools';

export const useGetDonationSchools = (params: GetDonationSchoolsParams = {}) => {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const region = params.region || undefined;
  const initial = params.initial || undefined;
  const keyword = params.keyword?.trim() || undefined;
  const sort = params.sort ?? 'NAME';
  const includeInactive = params.includeInactive ?? true; // 관리자웹 기본: 전체

  return useQuery<GetDonationSchoolsResponse>({
    queryKey: [
      DONATION_SCHOOLS_QUERY_KEY,
      pageNum,
      pageSize,
      region ?? '',
      initial ?? '',
      keyword ?? '',
      sort,
      includeInactive,
    ],
    queryFn: () =>
      APIService.private.get<GetDonationSchoolsResponse>(SCHOOLS_PUBLIC_PATH, {
        params: {
          pageNum,
          pageSize,
          sort,
          includeInactive,
          ...(region ? { region } : {}),
          ...(initial ? { initial } : {}),
          ...(keyword ? { keyword } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};

export const useGetDonationSchoolRegions = () => {
  return useQuery<{ data: RegionOption[] }>({
    queryKey: [DONATION_SCHOOL_REGIONS_QUERY_KEY],
    queryFn: () => APIService.private.get<{ data: RegionOption[] }>(`${SCHOOLS_PUBLIC_PATH}/regions`),
    staleTime: Infinity, // 지역 목록은 정적
  });
};

export const useCreateDonationSchool = () => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ data, image }: { data: SchoolWriteBody; image?: File | null }) =>
      APIService.private.post(SCHOOLS_ADMIN_PATH, buildDataImageMultipart(data, image), {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_SCHOOLS_QUERY_KEY] });
    },
  });
  return { createSchool: mutate, createSchoolAsync: mutateAsync, isPending, error };
};

export const useUpdateDonationSchool = () => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ id, data, image }: { id: number; data: SchoolWriteBody; image?: File | null }) =>
      APIService.private.put(`${SCHOOLS_ADMIN_PATH}/${id}`, buildDataImageMultipart(data, image), {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_SCHOOLS_QUERY_KEY] });
    },
  });
  return { updateSchool: mutate, updateSchoolAsync: mutateAsync, isPending, error };
};

export const useDeleteDonationSchool = () => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (id: number) => APIService.private.delete(`${SCHOOLS_ADMIN_PATH}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_SCHOOLS_QUERY_KEY] });
    },
  });
  return { deleteSchool: mutate, deleteSchoolAsync: mutateAsync, isPending, error };
};
