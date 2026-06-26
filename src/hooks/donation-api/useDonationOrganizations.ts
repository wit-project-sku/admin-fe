import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { DonationTypeCode } from './donationApiTypes';

/**
 * 기부 단체(NGO/학교) — payment-be `/api/admin/donations/organizations`.
 * 삭제는 소프트(active=false)이며, 행은 보존된다(캠페인 FK 보호).
 */
export type DonationOrganization = {
  id: number;
  type: DonationTypeCode;
  name: string;
  active: boolean;
  createdAt: string;
};

export type DonationOrganizationPage = {
  content: DonationOrganization[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetDonationOrganizationsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: DonationOrganizationPage;
};

export type GetDonationOrganizationsParams = {
  pageNum?: number;
  pageSize?: number;
  type?: DonationTypeCode | '';
  /** 활성 여부 필터. 미전송 시 전체. */
  active?: boolean;
};

export type DonationOrganizationWriteBody = {
  type: DonationTypeCode;
  name: string;
};

export const DONATION_ORGANIZATIONS_QUERY_KEY = 'donation-organizations';

const ORGANIZATIONS_PATH = '/admin/donations/organizations';

export const useGetDonationOrganizations = (params: GetDonationOrganizationsParams = {}) => {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const type = params.type || undefined;
  const active = params.active;

  return useQuery<GetDonationOrganizationsResponse>({
    queryKey: [DONATION_ORGANIZATIONS_QUERY_KEY, pageNum, pageSize, type ?? '', active ?? ''],
    queryFn: () =>
      APIService.private.get<GetDonationOrganizationsResponse>(ORGANIZATIONS_PATH, {
        params: {
          pageNum,
          pageSize,
          ...(type ? { type } : {}),
          ...(active != null ? { active } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
};

export const useCreateDonationOrganization = () => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (body: DonationOrganizationWriteBody) =>
      APIService.private.post(ORGANIZATIONS_PATH, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_ORGANIZATIONS_QUERY_KEY] });
    },
  });
  return { createOrganization: mutate, createOrganizationAsync: mutateAsync, isPending, error };
};

export const useUpdateDonationOrganization = () => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ id, body }: { id: number; body: DonationOrganizationWriteBody }) =>
      APIService.private.put(`${ORGANIZATIONS_PATH}/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_ORGANIZATIONS_QUERY_KEY] });
    },
  });
  return { updateOrganization: mutate, updateOrganizationAsync: mutateAsync, isPending, error };
};

export const useDeleteDonationOrganization = () => {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: (id: number) => APIService.private.delete(`${ORGANIZATIONS_PATH}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DONATION_ORGANIZATIONS_QUERY_KEY] });
    },
  });
  return { deleteOrganization: mutate, deleteOrganizationAsync: mutateAsync, isPending, error };
};
