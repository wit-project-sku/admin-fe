import s from '@pages/ReportsPage.module.css';
import type { ReportTab } from './reportTypes';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'monthly', label: '지점별 월별 상세' },
  { id: 'daily', label: '지점별 일별 상세' },
  { id: 'ranking', label: '의상별 인기 랭킹' },
  { id: 'stats', label: '전체 의상 통계' },
];

type ReportTabBarProps = {
  active: ReportTab;
  onChange: (tab: ReportTab) => void;
};

export function ReportTabBar({ active, onChange }: ReportTabBarProps) {
  return (
    <div className={`${s.tabGroup} ${s.tabGroupWide}`}>
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`${s.tabBtn} ${active === id ? s.tabBtnActive : ''}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
