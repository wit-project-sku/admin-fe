import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import lockIcon from '@assets/images/lock.png';
import eyeClose from '@assets/images/eyeClose.png';
import eyeOpen from '@assets/images/eyeOpen.png';
import { loginAdmin } from '@apis/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAdmin({ username: username.trim(), password });
      console.log('login response:', res);
      const token = res?.data;
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token);
      console.log('login success, token saved. navigating to /admin/products');
      localStorage.setItem('tokenType', 'Bearer');
      navigate('/admin/products', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.loginBox}>
        <div className={styles.iconWrapper}>
          <img src={lockIcon} alt='lock' />
        </div>

        <div className={styles.field}>
          <label>아이디</label>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='아이디 입력'
            autoComplete='username'
          />
        </div>

        <div className={styles.field}>
          <label>비밀번호</label>
          <div className={styles.passwordBox}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='비밀번호 입력'
              autoComplete='current-password'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLogin();
                }
              }}
            />
            <img
              src={showPassword ? eyeOpen : eyeClose}
              alt='toggle password'
              className={styles.eyeIcon}
              onClick={() => setShowPassword((prev) => !prev)}
            />
          </div>
        </div>

        {error && <div className={styles.errorText}>{error}</div>}

        <button type='button' className={styles.loginButton} onClick={handleLogin} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>
    </div>
  );
}
