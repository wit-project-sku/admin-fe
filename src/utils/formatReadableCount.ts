const KO_LOCALE = 'ko-KR';

/**
 * Readable integers: `ko-KR` thousands grouping; ≥1만 / ≥1억 은 **만·억** 단위로 끊어 표기.
 * 예: `1234` → `1,234`, `12345678` → `1,234만 5,678`.
 */
export function formatReadableCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n);
  const neg = rounded < 0;
  let v = Math.abs(rounded);
  if (v === 0) return '0';

  const parts: string[] = [];
  const eok = Math.floor(v / 100_000_000);
  if (eok) {
    parts.push(`${eok.toLocaleString(KO_LOCALE)}억`);
    v %= 100_000_000;
  }
  const man = Math.floor(v / 10_000);
  if (man) {
    parts.push(`${man.toLocaleString(KO_LOCALE)}만`);
    v %= 10_000;
  }
  if (v > 0 || parts.length === 0) {
    parts.push(v.toLocaleString(KO_LOCALE));
  }
  return (neg ? '-' : '') + parts.join(' ');
}
