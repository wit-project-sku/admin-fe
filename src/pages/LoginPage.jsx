import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '@apis/authApi';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin(form);
      const data = res?.data ?? res;
      const accessToken = data?.accessToken ?? data?.data?.accessToken ?? data;
      const refreshToken = data?.refreshToken ?? data?.data?.refreshToken;
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        navigate('/admin/dashboard');
      } else {
        setError('로그인에 실패했습니다.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || '아이디 또는 비밀번호를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Left branding panel */}
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>W</div>
          <h1 className={styles.brandName}>WIT GLOBAL</h1>
          <p className={styles.brandSub}>ADMIN HUB</p>
          <div className={styles.divider} />
          <p className={styles.brandDesc}>키오스크 서비스 통합<br />관리자 플랫폼</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.right}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>관리자 로그인</h2>
          <p className={styles.formDesc}>승인된 관리자만 접근할 수 있습니다</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>아이디</label>
            <div className={styles.inputWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                placeholder="관리자 아이디"
                className={styles.input}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호</label>
            <div className={styles.inputWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호"
                className={styles.input}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className={styles.copyright}>© 2026 WIT Global. All rights reserved.</p>
        </form>
      </div>
    </div>
  );
}
