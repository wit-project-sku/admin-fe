import styles from './FilterGroup.module.css';

export type FilterDef = {
  key: string;
  label: string;
};

type FilterGroupProps = {
  filters: FilterDef[];
  current: string;
  onFilterChange: (key: string) => void;
  /** 지정하면 필터 기준 라벨을 앞에 붙이고 세그먼트 컨트롤로 묶어 렌더(여러 필터 기준을 구분하기 쉬움). */
  label?: string;
};

export default function FilterGroup({ filters, current, onFilterChange, label }: FilterGroupProps) {
  // 라벨이 있으면: "기준 라벨 + 세그먼트 컨트롤"로 묶어 여러 필터 그룹을 시각적으로 구분한다.
  if (label) {
    return (
      <div className={styles.labeledGroup}>
        <span className={styles.groupLabel}>{label}</span>
        <div className={styles.segment} role="group" aria-label={label}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.segBtn} ${current === f.key ? styles.segActive : ''}`}
              aria-pressed={current === f.key}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 라벨 없는 기본 렌더(기존 사용처 호환).
  return (
    <div className={styles.container}>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`${styles.filterBtn} ${current === f.key ? styles.active : ''}`}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
