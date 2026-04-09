import styles from './FilterGroup.module.css';

export type FilterDef = {
  key: string;
  label: string;
};

type FilterGroupProps = {
  filters: FilterDef[];
  current: string;
  onFilterChange: (key: string) => void;
};

export default function FilterGroup({ filters, current, onFilterChange }: FilterGroupProps) {
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
