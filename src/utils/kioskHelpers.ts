/** Map kiosk id → display name for tables and filters. */
export function buildKioskNameById(kiosks: { id: string | number; name: string }[]): Record<string, string> {
  return kiosks.reduce<Record<string, string>>((acc, k) => {
    acc[String(k.id)] = k.name;
    return acc;
  }, {});
}
