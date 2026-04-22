import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import { DashboardChartFallback } from './DashboardChartFallback';
import { pieColor } from './commerceFormatters';
import type { ShopOrderStatusSlice } from '../../hooks/payment-api/useGetShopStatsSummary';

export type DashboardCommerceStatusChartProps = {
  data: ShopOrderStatusSlice[];
  isLoading: boolean;
  isError: boolean;
};

export function DashboardCommerceStatusChart({ data, isLoading, isError }: DashboardCommerceStatusChartProps) {
  return (
    <div className={s.chartCard}>
      <div className={s.pieHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>Order status</span>
      </div>
      <div className={s.chartBody} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='주문 상태 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 주문 상태 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                dataKey='count'
                nameKey='status'
                cx='50%'
                cy='45%'
                innerRadius={52}
                outerRadius={72}
                paddingAngle={4}
                label={({ percent }: { percent?: number }) =>
                  typeof percent === 'number' ? `${(percent * 100).toFixed(1)}%` : ''
                }
              >
                {data.map((entry, i) => (
                  <Cell key={entry.status} fill={pieColor(entry, i)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item) => {
                  const payload = (item as { payload?: ShopOrderStatusSlice }).payload;
                  return [`${value.toLocaleString('ko-KR')}건`, payload?.status ?? ''];
                }}
              />
              <Legend
                verticalAlign='bottom'
                iconType='circle'
                iconSize={7}
                wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
