import shared from '@commons/shared.module.css';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import type { ShopRow } from './shopsListMappers';
import { SHOP_TABLE_MESSAGES } from './shopsListConfig';

type ShopsManageTableProps = {
  loading: boolean;
  error: boolean;
  rows: ShopRow[];
  onEdit: (shop: ShopRow) => void;
  onDelete: (shop: ShopRow) => void;
  onRowClick?: (shop: ShopRow) => void;
};

const COL_COUNT = 7;

export function ShopsManageTable({ loading, error, rows, onEdit, onDelete, onRowClick }: ShopsManageTableProps) {
  return (
    <div className={shared.tableResponsive}>
      <table className={shared.table}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
            <th className={`${shared.th} ${shared.thLeft}`}>상점명</th>
            <th className={`${shared.th} ${shared.thLeft}`}>카테고리</th>
            <th className={`${shared.th} ${shared.thLeft}`}>주소</th>
            <th className={`${shared.th} ${shared.thCenter}`}>전화</th>
            <th className={`${shared.th} ${shared.thCenter}`}>이미지</th>
            <th className={`${shared.th} ${shared.thRight}`}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`shop-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={`shop-skeleton-${idx}-${col}`} className={shared.td}>
                    <span className={shared.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={COL_COUNT} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                {SHOP_TABLE_MESSAGES.loadError}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                {SHOP_TABLE_MESSAGES.empty}
              </td>
            </tr>
          ) : (
            rows.map((s) => (
              <tr
                key={String(s.id)}
                className={shared.tr}
                onClick={() => onRowClick?.(s)}
                style={{ cursor: onRowClick ? 'pointer' : undefined }}
              >
                <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMono}`}>
                  #{String(s.id).padStart(3, '0')}
                </td>
                <td className={`${shared.td} ${shared.tdLeft}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt=''
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: '#f1f5f9',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <strong style={{ color: '#1e293b' }}>{s.name}</strong>
                  </div>
                </td>
                <td className={`${shared.td} ${shared.tdLeft}`}>{s.category ?? '—'}</td>
                <td className={`${shared.td} ${shared.tdLeft}`}>{s.address ?? '—'}</td>
                <td className={`${shared.td} ${shared.tdCenter}`}>{s.tel ?? '—'}</td>
                <td className={`${shared.td} ${shared.tdCenter}`}>
                  <span className={shared.badge} style={{ background: '#f1f5f9' }}>
                    {s.imageCount}장
                  </span>
                </td>
                <td className={shared.td}>
                  <div
                    className={shared.actionGroup}
                    style={{ justifyContent: 'flex-end' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditBtn onClick={() => onEdit(s)} />
                    <DeleteBtn onClick={() => onDelete(s)} />
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
