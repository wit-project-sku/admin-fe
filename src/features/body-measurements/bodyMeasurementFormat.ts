import { kioskLabel } from '../../utils/kioskHelpers';
import type {
  BodyMeasurementGender,
  BodyMeasurementShooterDto,
  BodyMeasurementShotType,
} from '../../hooks/body-measurement-api/bodyMeasurementTypes';

/** 값 없음 표시. */
export const NONE = '—';

export const SHOT_TYPE_LABEL: Record<BodyMeasurementShotType, string> = {
  SOLO: '혼자찍기',
  TOGETHER: '같이찍기',
};

export const GENDER_LABEL: Record<BodyMeasurementGender, string> = {
  MALE: '남',
  FEMALE: '여',
};

const isNum = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/** 측정값은 **받은 그대로** 보여 준다(반올림 없음). null → `—`. */
export function fmtNum(v: number | null | undefined): string {
  return isNum(v) ? String(v) : NONE;
}

/** 단위를 붙인 값(`172.4 cm`). null → `—`. */
export function fmtCm(v: number | null | undefined): string {
  return isNum(v) ? `${v} cm` : NONE;
}

/** "#W006-제주시=제주국제공항" → "제주국제공항". 이름이 없으면 `—`. */
export function kioskShortName(name: string | null | undefined): string {
  const n = name?.trim();
  return n ? kioskLabel(n) : NONE;
}

const DT_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

/** 서버 KST 문자열을 그대로 자른다(브라우저 시간대 변환 없음). */
function splitDateTime(v: string | null | undefined) {
  const m = v ? DT_RE.exec(v) : null;
  if (!m) return null;
  const [, y, mo, d, h, mi, s = '00'] = m;
  return { y, mo, d, h, mi, s };
}

/** 표: `MM-dd HH:mm` */
export function fmtShotMinute(v: string | null | undefined): string {
  const p = splitDateTime(v);
  return p ? `${p.mo}-${p.d} ${p.h}:${p.mi}` : NONE;
}

/** 상세 제목: `MM-dd HH:mm:ss` */
export function fmtShotSecond(v: string | null | undefined): string {
  const p = splitDateTime(v);
  return p ? `${p.mo}-${p.d} ${p.h}:${p.mi}:${p.s}` : NONE;
}

/** 엑셀: `yyyy-MM-dd HH:mm:ss`. 없으면 빈 칸. */
export function fmtFullDateTime(v: string | null | undefined): string {
  const p = splitDateTime(v);
  return p ? `${p.y}-${p.mo}-${p.d} ${p.h}:${p.mi}:${p.s}` : '';
}

/** 표의 키 칸: `측정 / 입력`(예 `172.4 / 170`). 둘 다 없으면 `—`, 한쪽만 없으면 그쪽만 `—`. */
export function fmtHeightPair(measured: number | null | undefined, input: number | null | undefined): string {
  if (!isNum(measured) && !isNum(input)) return NONE;
  return `${fmtNum(measured)} / ${fmtNum(input)}`;
}

const decimalPlaces = (n: number): number => {
  const s = String(n);
  if (s.includes('e')) return 6;
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/**
 * 측정 키 − 입력 키(예 172.4 − 170 → `+2.4`). 둘 다 있을 때만, 아니면 null.
 * 부동소수 오차(2.4000000000000057)를 없애려고 두 값 중 긴 소수 자릿수로 맞춘다 — 받은 값 자체는 손대지 않는다.
 */
export function fmtHeightDiff(measured: number | null | undefined, input: number | null | undefined): string | null {
  if (!isNum(measured) || !isNum(input)) return null;
  const places = Math.max(decimalPlaces(measured), decimalPlaces(input));
  const diff = Number((measured - input).toFixed(places));
  if (diff === 0) return '0';
  return diff > 0 ? `+${diff}` : String(diff);
}

let regionNames: Intl.DisplayNames | null | undefined;

/** `KR` → `대한민국`. 모르는 코드·미지원 브라우저면 코드 그대로. */
export function countryName(code: string | null | undefined): string {
  if (!code) return NONE;
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames('ko', { type: 'region' });
    } catch {
      regionNames = null;
    }
  }
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * 성별·국적. 표는 `남 · KR`, 상세는 `남 · 대한민국`.
 * 촬영자 정보 행이 없으면 null — 호출하는 쪽이 흐린 `미입력`을 그린다.
 */
export function fmtGenderNationality(
  shooter: BodyMeasurementShooterDto | null | undefined,
  nationality: 'code' | 'name',
): string | null {
  if (!shooter) return null;
  const g = shooter.gender ? (GENDER_LABEL[shooter.gender] ?? shooter.gender) : NONE;
  const n = shooter.nationality ? (nationality === 'name' ? countryName(shooter.nationality) : shooter.nationality) : NONE;
  return `${g} · ${n}`;
}

/** `0.85 · v1` — 둘 중 없는 쪽은 `—`. */
export function fmtConfidenceVersion(confidence: number | null | undefined, version: number | null | undefined): string {
  if (!isNum(confidence) && !isNum(version)) return NONE;
  return `${fmtNum(confidence)} · ${isNum(version) ? `v${version}` : NONE}`;
}

/** `3.2 · 혼자찍기 · 합성 성공` */
export function fmtOutfitShot(
  outfitCode: string | null | undefined,
  shotType: BodyMeasurementShotType | null | undefined,
  isSuccess: boolean | null | undefined,
): string {
  const parts = [
    outfitCode?.trim() || NONE,
    shotType ? (SHOT_TYPE_LABEL[shotType] ?? shotType) : NONE,
    isSuccess == null ? NONE : isSuccess ? '합성 성공' : '합성 실패',
  ];
  return parts.join(' · ');
}

/** eventId 칩에 보이는 앞 8자. */
export const shortEventId = (eventId: string): string => eventId.slice(0, 8);

/** 로컬 달력 기준 `yyyy-MM-dd`. */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 기본 기간 — 오늘 포함 최근 7일. */
export function defaultDateRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  return { start: toLocalYmd(start), end: toLocalYmd(now) };
}

/** `2026-10-02` → `10-02` (기간 칩 표시용). */
export const shortYmd = (ymd: string): string => (ymd.length >= 10 ? ymd.slice(5, 10) : ymd);
