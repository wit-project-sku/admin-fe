import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGetDonationSchools } from '@/hooks/donation-api/useDonationSchools';
import styles from './SchoolSearchSelect.module.css';

type Props = {
  /** 선택된 학교 id(문자열, 없으면 ''). */
  value: string;
  /** 선택된 학교명(표시용). 수정 진입 시 서버가 주는 이름, 없으면 빈 문자열. */
  label: string;
  onSelect: (schoolId: string, schoolName: string) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * 학교 검색 선택 — 드롭다운(2000+개) 대신 학교명을 입력해 서버에서 검색하고 결과 중 선택.
 * 주소 검색과 동일한 원리(입력 → 검색결과 → 선택).
 */
export default function SchoolSearchSelect({ value, label, onSelect, error, disabled }: Props) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const { data, isFetching } = useGetDonationSchools({
    keyword: debounced,
    pageSize: 20,
    includeInactive: true,
  });
  const results = debounced.trim() ? (data?.data?.content ?? []) : [];

  const showPicker = searching || !value;

  return (
    <div className={styles.field}>
      <label className={styles.label}>
        학교 <span className={styles.req}>*</span>
      </label>

      {!showPicker ? (
        <div className={`${styles.selected} ${error ? styles.selectedError : ''}`}>
          <span className={styles.selectedName}>{label || `학교 ID ${value}`}</span>
          <button
            type='button'
            className={styles.changeBtn}
            disabled={disabled}
            onClick={() => {
              setSearching(true);
              setQuery('');
            }}
          >
            변경
          </button>
        </div>
      ) : (
        <div className={styles.picker}>
          <input
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            value={query}
            disabled={disabled}
            autoFocus
            placeholder='학교명 검색 (예: 경복고)'
            onChange={(e) => setQuery(e.target.value)}
          />
          {debounced.trim() ? (
            <div className={styles.results}>
              {isFetching ? (
                <div className={styles.hint}>검색 중…</div>
              ) : results.length === 0 ? (
                <div className={styles.hint}>검색 결과가 없습니다.</div>
              ) : (
                results.map((s) => (
                  <button
                    key={s.id}
                    type='button'
                    className={styles.result}
                    onClick={() => {
                      onSelect(String(s.id), s.name);
                      setSearching(false);
                      setQuery('');
                    }}
                  >
                    <span className={styles.rName}>{s.name}</span>
                    <span className={styles.rMeta}>
                      {s.regionLabel ?? s.region}
                      {s.address ? ` · ${s.address}` : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className={styles.hint}>학교명을 입력하면 검색됩니다.</div>
          )}
        </div>
      )}
      {error ? (
        <span className={styles.error} role='alert'>
          {error}
        </span>
      ) : null}
    </div>
  );
}
