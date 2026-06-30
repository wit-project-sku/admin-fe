import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound({ message = '페이지를 찾을 수 없습니다.' }) {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>{message}</p>

      <button type='button' className={styles.homeBtn} onClick={() => navigate(-1)}>
        이전 페이지로 이동
      </button>
    </div>
  );
}
