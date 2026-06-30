import shared from '@commons/shared.module.css';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import ImageZoom from '@components/common/ImageZoom';
import type { ProductRow } from './productListMappers';
import type { ProductStatus } from '../../hooks/product-api/productApiTypes';
import { PRODUCT_TABLE_MESSAGES } from './productListConfig';

type ProductManageTableProps = {
  loading: boolean;
  error: boolean;
  rows: ProductRow[];
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
  onRowClick?: (product: ProductRow) => void;
};

const COL_COUNT = 7;

function statusBadge(status: ProductStatus | undefined) {
  switch (status) {
    case 'ON_SALE':
      return { label: '판매중', cls: shared.badgeGreen };
    case 'SOLD_OUT':
      return { label: '품절', cls: shared.badgeOrange };
    case 'HIDDEN':
      return { label: '숨김', cls: shared.badgeGray };
    default:
      return { label: status ?? '—', cls: shared.badgeGray };
  }
}

export function ProductManageTable({ loading, error, rows, onEdit, onDelete, onRowClick }: ProductManageTableProps) {
  return (
    <div className={shared.tableResponsive}>
      <table className={shared.table}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
            <th className={`${shared.th} ${shared.thLeft}`}>상품</th>
            <th className={`${shared.th} ${shared.thCenter}`}>카테고리</th>
            <th className={`${shared.th} ${shared.thRight}`}>가격</th>
            <th className={`${shared.th} ${shared.thCenter}`}>재고</th>
            <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
            <th className={`${shared.th} ${shared.thRight}`}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`product-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={`product-skeleton-${idx}-${col}`} className={shared.td}>
                    <span className={shared.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={COL_COUNT} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                {PRODUCT_TABLE_MESSAGES.loadError}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                {PRODUCT_TABLE_MESSAGES.empty}
              </td>
            </tr>
          ) : (
            rows.map((p) => {
              const st = statusBadge(p.status);
              const lowStock = (p.stock ?? 0) === 0 && p.status === 'ON_SALE';
              return (
                <tr
                  key={String(p.id)}
                  className={shared.tr}
                  onClick={() => onRowClick?.(p)}
                  style={{ cursor: onRowClick ? 'pointer' : undefined }}
                >
                  <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMono}`}>
                    #{String(p.id).padStart(3, '0')}
                  </td>
                  <td className={`${shared.td} ${shared.tdLeft}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.images?.[0]?.imageUrl ? (
                        <ImageZoom
                          src={p.images[0].imageUrl}
                          title={p.name}
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : null}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.25 }}>{p.name}</div>
                        {p.subTitle ? (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.subTitle}</div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span className={shared.badge} style={{ background: '#f1f5f9' }}>
                      {p.categoryName ?? '—'}
                    </span>
                  </td>
                  <td className={`${shared.td} ${shared.tdRight}`}>
                    <strong>{p.price != null ? p.price.toLocaleString() : '—'}원</strong>
                  </td>
                  <td
                    className={`${shared.td} ${shared.tdCenter}`}
                    style={{ color: lowStock || p.status === 'SOLD_OUT' ? '#ef4444' : 'inherit' }}
                  >
                    {p.stock ?? '—'}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span className={`${shared.badge} ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className={shared.td}>
                    <div
                      className={shared.actionGroup}
                      style={{ justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EditBtn onClick={() => onEdit(p)} />
                      <DeleteBtn onClick={() => onDelete(p)} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
