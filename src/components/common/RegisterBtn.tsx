import styles from './RegisterBtn.module.css';

type RegisterBtnProps = {
  title: string;
  onClick?: () => void;
};

export default function RegisterBtn({ title, onClick }: RegisterBtnProps) {
  return (
    <button type="button" className={styles.btnPrimary} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 6 }}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {title}
    </button>
  );
}
