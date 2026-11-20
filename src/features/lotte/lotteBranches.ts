import { useMemo } from 'react';
import { useGetKiosks } from '../../hooks/useGetKiosks';

/**
 * 롯데 키오스크 3개 지점. 화면에는 키오스크 id 가 아니라 이름 앞 코드(W011…)로 보여 준다.
 * 이름은 키오스크 앱(kioskLocations.ts)과 같다.
 */
export const LOTTE_BRANCHES = [
  { code: 'W011', name: '롯데월드몰', cinemaHints: ['월드타워', '월드몰', 'WORLD'] },
  { code: 'W012', name: '롯데백화점 청량리점', cinemaHints: ['청량리', 'CHEONGNYANGNI'] },
  { code: 'W013', name: '롯데백화점 건대스타시티점', cinemaHints: ['건대', 'KONKUK', 'GUNDAE'] },
] as const;

/**
 * 영화관 → 지점. 영화관의 `kioskId` 가 지점 키오스크와 같으면 그 지점, 아니면(키오스크가 아직 서버에 없을 때)
 * 영화관 이름·코드로 맞춘다.
 */
export const branchCodeForCinema = (
  cinema: { cinemaCode: string; cinemaName: string; kioskId: number | null },
  branches: LotteBranch[],
): LotteBranchCode | null => {
  if (cinema.kioskId != null) {
    const hit = branches.find((b) => b.kioskId === cinema.kioskId);
    if (hit) return hit.code;
  }
  const text = `${cinema.cinemaName} ${cinema.cinemaCode}`.toUpperCase();
  return LOTTE_BRANCHES.find((b) => b.cinemaHints.some((h) => text.includes(h.toUpperCase())))?.code ?? null;
};

export type LotteBranchCode = (typeof LOTTE_BRANCHES)[number]['code'];
/** '' = 전체 */
export type LotteBranchFilter = LotteBranchCode | '';

export type LotteBranch = {
  code: LotteBranchCode;
  name: string;
  /** 서버 키오스크 id. 서버에 아직 그 지점 키오스크가 없으면 null */
  kioskId: number | null;
};

/** `#W011-롯데=월드몰` → `W011` */
export const kioskCodeOf = (name?: string | null): string | null => {
  const m = /^\s*#?(W\d{3})/i.exec(name ?? '');
  return m ? m[1]!.toUpperCase() : null;
};

/**
 * 서버 키오스크 목록에서 롯데 3개 지점의 id 를 찾는다(이름 앞 코드로 맞춘다 — id 는 재번호된 전례가 있다).
 * 아직 등록되지 않은 지점은 `kioskId: null` 로 남는다.
 */
export function useLotteBranches() {
  const { data: kiosks, isLoading } = useGetKiosks();

  const branches = useMemo<LotteBranch[]>(() => {
    const list = Array.isArray(kiosks) ? kiosks : [];
    return LOTTE_BRANCHES.map((b) => ({
      code: b.code,
      name: b.name,
      kioskId: list.find((k) => kioskCodeOf(k.name) === b.code)?.id ?? null,
    }));
  }, [kiosks]);

  const byCode = useMemo(() => new Map(branches.map((b) => [b.code, b])), [branches]);
  const byKioskId = useMemo(
    () => new Map(branches.filter((b) => b.kioskId != null).map((b) => [b.kioskId as number, b])),
    [branches],
  );

  return { branches, byCode, byKioskId, isLoading };
}

/** `W011 롯데월드몰` */
export const branchLabel = (b: { code: string; name: string }) => `${b.code} ${b.name}`;
