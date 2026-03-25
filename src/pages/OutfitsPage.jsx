import { useState } from 'react';
import shared from '@commons/shared.module.css';
import s from './OutfitsPage.module.css';

const MOCK_OUTFITS = Array.from({ length: 15 }, (_, i) => {
  const cats = ['한복','현대복','교복','코스튬','정장'];
  const prefixes = { '한복':'H','현대복':'M','교복':'S','코스튬':'C','정장':'T' };
  const cat = cats[i % 5];
  const no = String(i + 1).padStart(3, '0');
  return {
    id: i + 1, no,
    code: `${prefixes[cat]}-${String(i + 1).padStart(2, '0')}`,
    name: `의상 No.${no}`,
    category: cat,
    kiosks: [`키오스크 ${(i % 3) + 1}`, `키오스크 ${(i % 2) + 4}`],
    schedule: '2026.01.01 ~ 2026.06.01',
    active: i % 5 !== 4,
  };
});

const KIOSKS = ['키오스크 1', '키오스크 2', '키오스크 3', '키오스크 4', '키오스크 5'];

export default function OutfitsPage() {
  const [view, setView] = useState('list');
  const [outfits, setOutfits] = useState(MOCK_OUTFITS);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name:'', code:'', category:'한복', kiosks:[], start:'', end:'', image: null });

  const displayed = outfits.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.code.toLowerCase().includes(search.toLowerCase())
  );

  const toggleKiosk = (k) => setForm((f) => ({
    ...f,
    kiosks: f.kiosks.includes(k) ? f.kiosks.filter((x) => x !== k) : [...f.kiosks, k],
  }));

  const handleRegister = (e) => {
    e.preventDefault();
    const id = outfits.length + 1;
    const no = String(id).padStart(3, '0');
    const prefixes = { '한복':'H','현대복':'M','교복':'S','코스튬':'C','정장':'T' };
    setOutfits([{
      id, no,
      code: form.code || `${prefixes[form.category] || 'X'}-${no}`,
      name: form.name || `의상 No.${no}`,
      category: form.category,
      kiosks: form.kiosks,
      schedule: `${form.start} ~ ${form.end}`,
      active: true,
    }, ...outfits]);
    setForm({ name:'', code:'', category:'한복', kiosks:[], start:'', end:'', image: null });
    setView('list');
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>의상 관리 시스템</h1>
          <p className={shared.pageSubtitle}>Inventory & Registration</p>
        </div>
        <div className={s.viewToggle}>
          <button className={`${s.toggleBtn} ${view === 'list' ? s.toggleBtnActive : ''}`} onClick={() => setView('list')}>의상 목록</button>
          <button className={`${s.toggleBtn} ${view === 'register' ? s.toggleBtnRegister : ''}`} onClick={() => setView('register')}>신규 등록</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className={shared.card}>
          <div className={shared.cardHead}>
            <span className={shared.cardTitle}>
              현재 등록된 의상
              <span className={s.countBadge}>{outfits.length}</span>
            </span>
            <div className={shared.searchBox}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="의상명 / 코드 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={shared.th}>No</th>
                <th className={shared.th}>Name / Code</th>
                <th className={shared.th}>카테고리</th>
                <th className={shared.th}>설치 키오스크</th>
                <th className={shared.th}>운영 일정</th>
                <th className={`${shared.th} ${shared.thRight}`}>상태</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((o) => (
                <tr key={o.id} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMuted}`}>#{o.no}</td>
                  <td className={shared.td}>
                    <div className={shared.tdBold}>{o.name}</div>
                    <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, marginTop: 1, letterSpacing: '.04em' }}>{o.code}</div>
                  </td>
                  <td className={shared.td}>
                    <span className={shared.badge} style={{ background: '#fdf4ff', color: '#9333ea' }}>{o.category}</span>
                  </td>
                  <td className={shared.td}>
                    <div className={shared.tagGroup}>
                      {o.kiosks.map((k) => <span key={k} className={shared.tag}>{k}</span>)}
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted}`}>{o.schedule}</td>
                  <td className={`${shared.td} ${shared.tdRight}`}>
                    <span className={`${shared.badge} ${o.active ? shared.badgeGreen : shared.badgeGray}`}>
                      {o.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={shared.pagination}>
            <span className={shared.pageInfo}>총 {outfits.length}종</span>
            <div className={shared.pageButtons}>
              <button className={shared.pageBtn}>‹</button>
              <button className={`${shared.pageBtn} ${shared.pageBtnActive}`}>1</button>
              <button className={shared.pageBtn}>2</button>
              <button className={shared.pageBtn}>›</button>
            </div>
          </div>
        </div>
      ) : (
        <div className={s.registerGrid}>
          <div className={shared.card} style={{ padding: '22px 24px' }}>
            <h3 className={s.formTitle}>신규 의상 정보 입력</h3>
            <form onSubmit={handleRegister} className={s.form}>
              <div className={s.formRow}>
                <div className={s.formField}>
                  <label className={s.label}>의상 이름</label>
                  <input required className={s.input} placeholder="예: 전통 한복 A"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className={s.formField}>
                  <label className={s.label}>의상 코드</label>
                  <input required className={s.input} placeholder="예: H-01"
                    value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div className={s.formField}>
                <label className={s.label}>카테고리</label>
                <select className={s.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {['한복','현대복','교복','코스튬','정장'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className={s.formField}>
                <label className={s.label}>설치 키오스크 선택</label>
                <div className={s.kioskGrid}>
                  {KIOSKS.map((k) => (
                    <div key={k} className={`${s.kioskItem} ${form.kiosks.includes(k) ? s.kioskActive : ''}`}
                      onClick={() => toggleKiosk(k)}>
                      <div className={`${s.kioskCheck} ${form.kiosks.includes(k) ? s.kioskChecked : ''}`} />
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={s.formField}>
                <label className={s.label}>운영 일정</label>
                <div className={s.dateRow}>
                  <input required type="date" className={s.input}
                    value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                  <span className={s.dateSep}>~</span>
                  <input required type="date" className={s.input}
                    value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                </div>
              </div>

              <button type="submit" className={`${shared.btnPrimary} ${s.submitBtn}`}>의상 등록 완료</button>
            </form>
          </div>

          <div className={shared.card} style={{ padding: '22px 24px' }}>
            <label className={s.label} style={{ display: 'block', marginBottom: 10 }}>Thumbnail Image</label>
            <div className={s.imageUpload}>
              {form.image ? (
                <img src={form.image} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius: 10 }} />
              ) : (
                <div className={s.uploadPlaceholder}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 10 }}>클릭하여 업로드</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>JPG, PNG, WEBP</p>
                </div>
              )}
              <input type="file" accept="image/*" style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }}
                onChange={(e) => {
                  if (e.target.files[0]) setForm({ ...form, image: URL.createObjectURL(e.target.files[0]) });
                }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
