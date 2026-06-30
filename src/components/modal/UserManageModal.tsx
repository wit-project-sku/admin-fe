import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import {
  DropDownField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
} from './ModalElements';
import { useCreateUser } from '../../hooks/user-api/useCreateUser';
import { useUpdateUser } from '../../hooks/user-api/useUpdateUser';
import { useGetUserById } from '../../hooks/user-api/useGetUserById';
import type { UserRow } from '../../features/users/userListMappers';
import type { AdminUserRole } from '../../hooks/user-api/useGetUsers';
import styles from './UserManageModal.module.css';

type UserFormState = {
  username: string;
  password: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: AdminUserRole;
};

type FieldErrors = Partial<Record<keyof UserFormState, string>>;

function emptyForm(): UserFormState {
  return { username: '', password: '', name: '', email: '', phoneNumber: '', role: 'ROLE_USER' };
}

function extractApiErrorMessage(err: unknown): string | null {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return null;
}

function validateForm(form: UserFormState, mode: 'create' | 'edit'): FieldErrors {
  const e: FieldErrors = {};
  if (!form.username.trim()) e.username = '아이디를 입력해 주세요.';
  if (mode === 'create' && !form.password.trim()) e.password = '비밀번호를 입력해 주세요.';
  if (mode === 'create' && form.password.trim() && form.password.trim().length < 6)
    e.password = '비밀번호는 최소 6자 이상이어야 합니다.';
  if (!form.name.trim()) e.name = '이름을 입력해 주세요.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = '올바른 이메일 형식을 입력해 주세요.';
  return e;
}

function ApiErrorMessageBody({ text }: { text: string }): ReactNode {
  const parts = text
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return <p className={styles.apiErrorText}>{text}</p>;
  }
  return (
    <ul className={styles.apiErrorList}>
      {parts.map((p, i) => (
        <li key={`${i}-${p}`} className={styles.apiErrorListItem}>
          {p}
        </li>
      ))}
    </ul>
  );
}

const ROLE_OPTIONS = [
  { value: 'ROLE_USER', label: '일반 사용자' },
  { value: 'ROLE_ADMIN', label: '관리자' },
];

type UserManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function UserManageModal({ open, mode, user, onClose, onSuccess }: UserManageModalProps) {
  const { createUserAsync } = useCreateUser();
  const { updateUserAsync } = useUpdateUser();

  const editUserId = open && mode === 'edit' ? (user?.userId ?? null) : null;
  const { data: userDetail, isLoading: detailLoading } = useGetUserById(editUserId);

  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      setForm(emptyForm());
      setFieldErrors({});
      setApiErrorMessage(null);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== 'edit') return;
    const source = userDetail ?? user;
    if (!source) return;
    setForm({
      username: source.username,
      password: '',
      name: source.name,
      email: source.email,
      phoneNumber: source.phoneNumber ?? '',
      role: (source.role as AdminUserRole) ?? 'ROLE_USER',
    });
    setFieldErrors({});
    setApiErrorMessage(null);
  }, [open, mode, userDetail, user]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (apiErrorMessage) {
        setApiErrorMessage(null);
        return;
      }
      onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose, apiErrorMessage]);

  if (!open) return null;

  const clearError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const errors = validateForm(form, mode);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        await createUserAsync({
          username: form.username.trim(),
          password: form.password.trim(),
          name: form.name.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          role: form.role,
        });
      } else if (user?.userId != null) {
        await updateUserAsync({
          userId: user.userId,
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim(),
            role: form.role,
            ...(form.password.trim() ? { password: form.password.trim() } : {}),
          },
        });
      }
      onSuccess?.();
    } catch (err) {
      const msg = extractApiErrorMessage(err);
      setApiErrorMessage(msg ?? '저장에 실패했습니다. 입력값과 네트워크를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ModalContainer>
        <ModalHeader title={mode === 'create' ? '사용자 등록' : '사용자 수정'} onClose={onClose} />
        {detailLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>불러오는 중...</div>
        ) : (
          <form style={{ display: 'contents' }} onSubmit={handleSubmit}>
            <div className={styles.body}>
              <InputField
                label="아이디 (로그인 ID)"
                required
                error={fieldErrors.username}
                placeholder="영문, 숫자 조합"
                value={form.username}
                disabled={mode === 'edit'}
                onChange={(e) => { clearError('username'); setForm({ ...form, username: e.target.value }); }}
              />
              <InputField
                label={mode === 'edit' ? '새 비밀번호 (변경 시만 입력)' : '비밀번호'}
                required={mode === 'create'}
                type="password"
                error={fieldErrors.password}
                placeholder={mode === 'edit' ? '변경하지 않으려면 비워두세요' : '최소 6자 이상'}
                value={form.password}
                onChange={(e) => { clearError('password'); setForm({ ...form, password: e.target.value }); }}
              />
              <InputField
                label="이름"
                required
                error={fieldErrors.name}
                placeholder="홍길동"
                value={form.name}
                onChange={(e) => { clearError('name'); setForm({ ...form, name: e.target.value }); }}
              />
              <InputField
                label="이메일"
                type="email"
                error={fieldErrors.email}
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => { clearError('email'); setForm({ ...form, email: e.target.value }); }}
              />
              <InputField
                label="전화번호"
                type="tel"
                error={fieldErrors.phoneNumber}
                placeholder="01012345678"
                value={form.phoneNumber}
                onChange={(e) => { clearError('phoneNumber'); setForm({ ...form, phoneNumber: e.target.value }); }}
              />
              <DropDownField
                label="역할"
                required
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AdminUserRole })}
              />
            </div>
            <ModalFooter
              onCancel={onClose}
              cancelText="취소"
              onSubmit={handleSubmit}
              submitText={saving ? '처리 중...' : mode === 'create' ? '사용자 등록' : '수정 완료'}
              isLoading={saving}
            />
          </form>
        )}
      </ModalContainer>
      {apiErrorMessage ? (
        <div
          className={styles.apiErrorOverlay}
          onClick={() => setApiErrorMessage(null)}
          role="presentation"
        >
          <div
            className={styles.apiErrorModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="입력 확인"
          >
            <ModalHeader title="입력 확인" onClose={() => setApiErrorMessage(null)} />
            <div className={styles.apiErrorBody}>
              <ApiErrorMessageBody text={apiErrorMessage} />
            </div>
            <ModalFooter cancelText="확인" onCancel={() => setApiErrorMessage(null)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
