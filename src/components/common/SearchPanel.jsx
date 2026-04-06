import React from 'react';
import styles from './SearchPanel.module.css';
import chevrondownIcon from '@assets/images/chevrondown.png';
import calendarIcon from '@assets/images/calendar.png';

export default function SearchPanel({
  filterLabel,
  filters = [],
  activeFilter,
  onFilterChange,
  showDateRange = false,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  searchLabel = '상세 검색',
  searchOptions = [],
  searchType,
  onSearchTypeChange,
  searchValue,
  onSearchValueChange,
  searchPlaceholder = '검색어를 입력하세요',
  onSearch,
  onReset,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch?.();
  };

  return (
    <div className={styles.panel}>
      {/* Row 1: 필터 + 날짜 */}
      {(filters.length > 0 || showDateRange) && (
        <div className={styles.row}>
          {filters.length > 0 && (
            <div className={styles.filterSection}>
              {filterLabel && <span className={styles.sectionLabel}>{filterLabel}</span>}
              <div className={styles.filterList}>
                {filters.map((f) => (
                  <label key={f.value} className={styles.filterItem}>
                    {/* 커스텀 체크박스 */}
                    <span className={`${styles.checkboxCustom} ${activeFilter === f.value ? styles.checkboxChecked : ''}`} />
                    <input
                      type='checkbox'
                      className={styles.checkboxHidden}
                      checked={activeFilter === f.value}
                      onChange={() => onFilterChange?.(f.value)}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
              {showDateRange && (
                <div className={styles.dateSection}>
                  <span className={styles.sectionLabel}>날짜</span>
                  <div className={styles.dateInputWrapper}>
                    <input
                      type='date'
                      value={startDate}
                      onChange={(e) => onStartDateChange?.(e.target.value)}
                      className={styles.dateInput}
                    />
                    <img src={calendarIcon} className={styles.calendarIcon} alt='' />
                  </div>
                  <span className={styles.dateDash}>~</span>
                  <div className={styles.dateInputWrapper}>
                    <input
                      type='date'
                      value={endDate}
                      onChange={(e) => onEndDateChange?.(e.target.value)}
                      className={styles.dateInput}
                    />
                    <img src={calendarIcon} className={styles.calendarIcon} alt='' />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row 2: 검색 입력 + 버튼 */}
      <div className={styles.row}>
        <div className={styles.searchSection}>
          {searchLabel && <span className={styles.sectionLabel}>{searchLabel}</span>}
          {searchOptions.length > 0 && (
            <div className={styles.selectWrapper}>
              <select
                value={searchType}
                onChange={(e) => onSearchTypeChange?.(e.target.value)}
                className={styles.searchTypeSelect}
              >
                {searchOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <img src={chevrondownIcon} className={styles.selectChevron} alt='' />
            </div>
          )}
          <input
            type='text'
            className={styles.searchInput}
            value={searchValue}
            onChange={(e) => onSearchValueChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className={styles.actionButtons}>
          <button type='button' className={styles.searchBtn} onClick={onSearch}>
            검색
          </button>
          <button type='button' className={styles.resetBtn} onClick={onReset}>
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
