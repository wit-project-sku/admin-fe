import styles from './DateRangePicker.module.css';

const Icon = () => (
  <svg className={styles.icon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.dateInputGroup}>
        <Icon />
        <input type="date" className={styles.input} value={startDate} onChange={(e) => onStartChange(e.target.value)} />
      </div>
      <span className={styles.separator}>~</span>
      <div className={styles.dateInputGroup}>
        <Icon />
        <input type="date" className={styles.input} value={endDate} onChange={(e) => onEndChange(e.target.value)} />
      </div>
    </div>
  );
}
