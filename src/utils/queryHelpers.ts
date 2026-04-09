import { DeliveriesResponse, Delivery, GetAllDeliveriesResponse } from '@/hooks/delivery-api/useGetAllDeliveries';

export type PaginatedPayload<T = unknown> = {
  content?: T[];
  totalPages?: number;
  totalElements?: number;
  [key: string]: unknown;
};

/** Table rows are left as `any[]` until domain DTOs are modeled. */
export const extractPaginatedResult = (queryData: GetAllDeliveriesResponse | undefined) => {
  const payload = queryData;
  const content: Delivery[] | [] = payload?.data?.content ?? [];
  const totalPages = Number(payload?.data?.totalPages) > 0 ? Number(payload?.data?.totalPages) : 1;
  const totalElements = Number.isFinite(Number(payload?.data?.totalElements))
    ? Number(payload?.data?.totalElements)
    : content.length;

  return { payload, content: content, totalPages, totalElements };
};
