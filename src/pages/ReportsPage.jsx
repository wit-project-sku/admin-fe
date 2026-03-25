import { useState, useCallback } from 'react';
import shared from '@commons/shared.module.css';
import s from './ReportsPage.module.css';

const LOCATIONS = ['화성휴게소(상)', '화성휴게소(하)', '인사동 본점', '강남 팝업', '제주공항점'];

const MONTHLY_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: `2025-${String(i + 1).padStart(2, '0')}`,
  '화성휴게소(상)': 2500 + i * 80,
  '화성휴게소(하)': 2200 + i * 60,
  '인사동 본점':    1800 + i * 50,
  '강남 팝업':      1200 + i * 30,
  '제주공항점':     400  + i * 10,
  get total() { return LOCATIONS.reduce((sum, l) => sum + this[l], 0); },
}));

function genDailyData(start, end) {
  const results = [];
  const cur = new Date(start);
  const fin = new Date(end);
  while (cur <= fin) {
    const row = { date: cur.toISOString().split('T')[0], total: 0 };
    LOCATIONS.forEach((l) => { const v = Math.floor(Math.random() * 60) + 10; row[l] = v; row.total += v; });
    results.push(row);
    cur.setDate(cur.getDate() + 1);
  }
  return results;
}

export default function ReportsPage() {
  const [subTab, setSubTab] = useState('monthly');
  const [dateRange, setRange] = useState({ start: '', end: '' });
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(() => {
    if (!dateRange.start || !dateRange.end) return;
    setLoading(true);
    setTimeout(() => {
      setDailyData(genDailyData(dateRange.start, dateRange.end));
      setLoading(false);
    }, 500);
  }, [dateRange]);

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>지점 성과 리포트</h1>
          <p className={shared.pageSubtitle}>Analytics Report</p>
        </div>
        <button className={shared.btnGreen}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          EXCEL 다운로드
        </button>
      </div>

      {/* Sub tabs */}
      <div className={s.tabGroup}>
        <button
          className={`${s.tabBtn} ${subTab === 'monthly' ? s.tabBtnActive : ''}`}
          onClick={() => setSubTab('monthly')}
        >지점별 월별 상세</button>
        <button
          className={`${s.tabBtn} ${subTab === 'daily' ? s.tabBtnActive : ''}`}
          onClick={() => setSubTab('daily')}
        >지점별 일별 상세</button>
      </div>

      {subTab === 'monthly' && (
        <div className={shared.card}>
          <div className={shared.cardHead}>
            <span className={shared.cardTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              월별 상세 리포트
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className={shared.table} style={{ minWidth: 700 }}>
              <thead>
                <tr className={s.darkHead}>
                  <th className={s.darkTh}>Month</th>
                  {LOCATIONS.map((l) => <th key={l} className={s.darkTh} style={{ textAlign: 'center' }}>{l}</th>)}
                  <th className={s.darkThAccent}>Total</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_DATA.map((row, i) => (
                  <tr key={row.month} className={shared.tr} style={{ background: i % 2 === 1 ? '#fafbff' : 'white' }}>
                    <td className={`${shared.td} ${shared.tdBold}`}>{row.month}</td>
                    {LOCATIONS.map((l) => (
                      <td key={l} className={`${shared.td} ${shared.tdMuted}`} style={{ textAlign: 'center' }}>
                        {row[l].toLocaleString()}
                      </td>
                    ))}
                    <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`} style={{ background: '#eff6ff', color: '#2563eb' }}>
                      {row.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'daily' && (
        <div>
          <div className={`${shared.card} ${s.filterCard}`}>
            <div className={shared.dateFilter}>
              <div className={shared.dateInput}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input type="date" value={dateRange.start} onChange={(e) => setRange({ ...dateRange, start: e.target.value })} />
              </div>
              <span className={shared.dateSep}>~</span>
              <div className={shared.dateInput}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input type="date" value={dateRange.end} onChange={(e) => setRange({ ...dateRange, end: e.target.value })} />
              </div>
              <button className={shared.btnPrimary} onClick={handleSearch} disabled={loading || !dateRange.start || !dateRange.end}>
                {loading ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                )}
                데이터 조회
              </button>
            </div>
          </div>

          <div className={shared.card} style={{ marginTop: 14 }}>
            {dailyData.length === 0 ? (
              <div className={s.emptyState}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>날짜를 선택하고 조회 버튼을 눌러주세요</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={shared.table} style={{ minWidth: 700 }}>
                  <thead>
                    <tr className={s.darkHead}>
                      <th className={s.darkTh}>Date</th>
                      {LOCATIONS.map((l) => <th key={l} className={s.darkTh} style={{ textAlign: 'center' }}>{l}</th>)}
                      <th className={s.darkThAccent}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((row, i) => (
                      <tr key={row.date} className={shared.tr} style={{ background: i % 2 === 1 ? '#fafbff' : 'white' }}>
                        <td className={`${shared.td} ${shared.tdBold}`}>{row.date}</td>
                        {LOCATIONS.map((l) => (
                          <td key={l} className={`${shared.td} ${shared.tdMuted}`} style={{ textAlign: 'center' }}>{row[l]}</td>
                        ))}
                        <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`} style={{ background: '#eff6ff', color: '#2563eb' }}>
                          {row.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
