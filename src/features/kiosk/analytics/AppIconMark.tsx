import styles from './KioskAnalyticsPage.module.css';

type Props = { name: string; color: string };

export function AppIconMark({ name, color }: Props) {
  const letter = name.trim().charAt(0) || '?';
  return (
    <div className={styles.appIcon} style={{ background: color }} title={name}>
      {letter}
    </div>
  );
}
