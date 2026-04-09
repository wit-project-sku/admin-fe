/** Normalize list responses that may be a bare array or wrapped in `{ data: [] }`. */
export const unwrapList = (v: unknown): unknown[] => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object' && 'data' in v) {
    const inner = (v as { data: unknown }).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
};
