import s from './Lotte.module.css';
import { LOTTE_BRANCHES, type LotteBranch, type LotteBranchFilter as BranchValue } from './lotteBranches';

type Props = {
  value: BranchValue;
  onChange: (value: BranchValue) => void;
  branches: LotteBranch[];
};

/** 지점 선택 — 전체 · W011 · W012 · W013. 코드만 보이고 이름은 툴팁. 서버에 없는 지점은 흐리게. */
export function LotteBranchFilter({ value, onChange, branches }: Props) {
  const options: { key: BranchValue; label: string; title: string; missing: boolean }[] = [
    { key: '', label: '전체', title: '롯데 전체 지점', missing: false },
    ...LOTTE_BRANCHES.map((b) => {
      const missing = branches.find((x) => x.code === b.code)?.kioskId == null;
      return {
        key: b.code,
        label: b.code,
        title: missing ? `${b.code} ${b.name} — 서버에 아직 키오스크가 등록되지 않았습니다` : `${b.code} ${b.name}`,
        missing,
      };
    }),
  ];

  return (
    <div className={s.segmentGroup}>
      <span className={s.segmentLabel}>지점</span>
      <div className={s.segment} role='group' aria-label='지점'>
        {options.map((o) => (
          <button
            key={o.key || 'all'}
            type='button'
            title={o.title}
            className={[s.segBtn, value === o.key ? s.segActive : '', o.missing ? s.segMissing : '']
              .filter(Boolean)
              .join(' ')}
            aria-pressed={value === o.key}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
