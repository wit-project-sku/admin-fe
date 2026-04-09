export const normalizePhone = (v: string | number | null | undefined): string => {
  if (v == null || v === '') return '-';
  const d = String(v).replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : String(v);
};
