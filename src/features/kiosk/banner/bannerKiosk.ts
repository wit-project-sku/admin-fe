import type { AdminKioskDto } from '@/hooks/useGetKiosks';

/**
 * 키오스크 표시명 파싱. 등록명이 `#W001-인사동=북인사광장` 형태라 셋으로 나뉜다.
 * 형식이 다르면 원문을 name 으로 돌려주고 group 은 비운다(빠른 선택에서만 안 쓰임).
 */
export type ParsedKiosk = {
  id: number;
  /** 예: W001 */
  code: string;
  /** 예: 인사동 — 빠른 선택(그룹) 기준 */
  group: string;
  /** 예: 북인사광장 */
  name: string;
  raw: string;
};

export function parseKiosk(k: AdminKioskDto): ParsedKiosk {
  const raw = k.name ?? '';
  const m = raw.match(/^#?([^-]+)-([^=]+)=(.+)$/);
  return m
    ? { id: k.id, code: m[1].trim(), group: m[2].trim(), name: m[3].trim(), raw }
    : { id: k.id, code: '', group: '', name: raw, raw };
}

/** 그룹별로 묶는다(등록 순서 유지). 그룹이 없는 키오스크는 제외. */
export function groupKiosks(list: ParsedKiosk[]): { group: string; ids: number[] }[] {
  const map = new Map<string, number[]>();
  for (const k of list) {
    if (!k.group) continue;
    const arr = map.get(k.group) ?? [];
    arr.push(k.id);
    map.set(k.group, arr);
  }
  return [...map.entries()].map(([group, ids]) => ({ group, ids }));
}

/** id 목록 → "북인사광장, 인사동쉼터 외 2곳" 형태 요약. */
export function summarizeKiosks(ids: number[], byId: Map<number, ParsedKiosk>, head = 2): string {
  if (ids.length === 0) return '없음';
  const names = ids.map((id) => byId.get(id)?.name ?? `#${id}`);
  if (names.length <= head) return names.join(', ');
  return `${names.slice(0, head).join(', ')} 외 ${names.length - head}곳`;
}
