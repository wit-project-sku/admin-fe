import shared from '@commons/shared.module.css';
import { USER_ROLE_LABELS } from './userListConfig';
import type { UserRow } from './userListMappers';
import styles from './UserManageTable.module.css';

const SKELETON_ROWS = 5;

type UserManageTableProps = {
  loading?: boolean;
  error?: boolean;
  rows: UserRow[];
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onStatusChange: (user: UserRow, isActive: boolean) => void;
};

function RoleBadge({ role }: { role: string }) {
  const label = USER_ROLE_LABELS[role] ?? role;
  const cls = role === 'ROLE_ADMIN' ? shared.badgePurple : shared.badgeBlue;
  return <span className={`${shared.badge} ${cls}`}>{label}</span>;
}

function StatusSelect({ user, onChange }: { user: UserRow; onChange: (isActive: boolean) => void }) {
  return (
    <select
      className={`${styles.statusSelect} ${user.isActive ? styles.statusActive : styles.statusInactive}`}
      value={user.isActive ? 'active' : 'inactive'}
      onChange={(e) => onChange(e.target.value === 'active')}
    >
      <option value="active">활성</option>
      <option value="inactive">비활성</option>
    </select>
  );
}

export function UserManageTable({ loading, error, rows, onEdit, onDelete, onStatusChange }: UserManageTableProps) {
  return (
    <div className={shared.tableResponsive}>
      <table className={shared.table}>
        <thead className={shared.thead}>
          <tr>
            <th className={shared.th}>ID</th>
            <th className={shared.th}>아이디</th>
            <th className={shared.th}>이름</th>
            <th className={shared.th}>이메일</th>
            <th className={shared.th}>전화번호</th>
            <th className={`${shared.th} ${shared.thCenter}`}>역할</th>
            <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
            <th className={`${shared.th} ${shared.thRight}`}>액션</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className={`${shared.tr} ${shared.skeletonRow}`}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className={shared.td}>
                    <span className={shared.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={8} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                데이터를 불러오지 못했습니다.
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={shared.tableStateCell}>
                사용자가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((user) => (
              <tr key={user.userId} className={shared.tr}>
                <td className={`${shared.td} ${shared.tdMono}`}>{user.userId}</td>
                <td className={`${shared.td} ${shared.tdBold}`}>{user.username}</td>
                <td className={shared.td}>{user.name || '-'}</td>
                <td className={`${shared.td} ${shared.tdMuted}`}>{user.email || '-'}</td>
                <td className={`${shared.td} ${shared.tdMuted}`}>{user.phoneNumber || '-'}</td>
                <td className={`${shared.td} ${shared.tdCenter}`}>
                  <RoleBadge role={user.role} />
                </td>
                <td className={`${shared.td} ${shared.tdCenter}`}>
                  <StatusSelect user={user} onChange={(isActive) => onStatusChange(user, isActive)} />
                </td>
                <td className={`${shared.td} ${shared.tdRight}`}>
                  <div className={shared.actionGroup}>
                    <button
                      type="button"
                      className={shared.btnEdit}
                      title="수정"
                      onClick={() => onEdit(user)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={shared.btnDelete}
                      title="삭제"
                      onClick={() => onDelete(user)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
