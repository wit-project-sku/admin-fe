import s from '@pages/ReportsPage.module.css';

/** `#W001-인사동=북인사광장` → 지점명 `인사동=북인사광장` + 코드 `#W001`. 형식이 다르면 이름 그대로 한 줄. */
function splitKioskName(name: string): { label: string; code: string | null } {
  const match = /^(#[^-\s]+)-(.+)$/.exec(name.trim());
  return match ? { label: match[2], code: match[1] } : { label: name, code: null };
}

/** 지점별 표 머리글 — 지점명 아래에 기기 코드를 작게 둬 열 폭을 줄인다. */
export function KioskColumnHeader({ name }: { name: string }) {
  const { label, code } = splitKioskName(name);
  return (
    <th className={`${s.darkTh} ${s.kioskTh}`} title={name}>
      <span className={s.kioskThLabel}>{label}</span>
      {code ? <span className={s.kioskThCode}>{code}</span> : null}
    </th>
  );
}
