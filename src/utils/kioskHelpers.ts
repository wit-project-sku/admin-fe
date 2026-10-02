/** Map kiosk id → display name for tables and filters. */
export function buildKioskNameById(kiosks: { id: string | number; name: string }[]): Record<string, string> {
  return kiosks.reduce<Record<string, string>>((acc, k) => {
    acc[String(k.id)] = k.name;
    return acc;
  }, {});
}

/** 키오스크 표시명 — "#W001-인사동=북인사광장" → "북인사광장" ('=' 뒤만, 없으면 이름 그대로). */
export function kioskLabel(name: string): string {
  const i = name.lastIndexOf('=');
  return i >= 0 ? name.slice(i + 1).trim() : name;
}
