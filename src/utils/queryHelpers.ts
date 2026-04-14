export type PaginatedPayload<T = unknown> = {
  content?: T[];
  totalPages?: number;
  totalElements?: number;
};

export type PaginatedListQueryData<T = unknown> = { data?: PaginatedPayload<T> } | undefined;

/** Reads `data.content` / totals from standard admin list API envelopes. */
export const extractPaginatedResult = <T = unknown>(queryData: unknown) => {
  const payload = queryData as PaginatedListQueryData<T>;
  const content = (payload?.data?.content ?? []) as T[];
  const totalPages = Number(payload?.data?.totalPages) > 0 ? Number(payload?.data?.totalPages) : 1;
  const totalElements = Number.isFinite(Number(payload?.data?.totalElements))
    ? Number(payload?.data?.totalElements)
    : content.length;

  return { payload, content, totalPages, totalElements };
};
