import type { Dispatch, SetStateAction } from 'react';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import type { AnalyticsFilters, DatePreset } from '../kioskAnalyticsMock';
import { DATE_PRESETS } from './constants';
import styles from './KioskAnalyticsPage.module.css';

type Props = {
  filters: AnalyticsFilters;
  setFilters: Dispatch<SetStateAction<AnalyticsFilters>>;
  cityOptions: Array<{ value: string; label: string }>;
  citiesLoading: boolean;
  kioskOptions: Array<{ value: string; label: string; sublabel?: string }>;
  kiosksLoading: boolean;
  buttonTypeOptions: Array<{ value: string; label: string }>;
  buttonsLoading: boolean;
  onFilterChange: () => void;
  onReset: () => void;
};

export function KioskAnalyticsFilters({
  filters,
  setFilters,
  cityOptions,
  citiesLoading,
  kioskOptions,
  kiosksLoading,
  buttonTypeOptions,
  buttonsLoading,
  onFilterChange,
  onReset,
}: Props) {
  return (
    <section className={styles.filterCard} aria-label='분석 필터'>
      <div className={styles.filterRow}>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>기간</span>
          <div className={styles.datePresets}>
            <div className={`${shared.filterGroup} ${styles.datePresetInner}`}>
              {DATE_PRESETS.map(([preset, label]) => (
                <button
                  key={preset}
                  type='button'
                  className={`${shared.filterBtn} ${filters.preset === preset ? shared.filterBtnActive : ''}`}
                  onClick={() => {
                    setFilters((f) => ({ ...f, preset: preset as DatePreset }));
                    onFilterChange();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {filters.preset === 'custom' && (
              <div className={styles.customDates}>
                <div className={styles.dateInput}>
                  <input
                    type='date'
                    value={filters.customStart}
                    onChange={(e) => {
                      setFilters((f) => ({ ...f, customStart: e.target.value }));
                      onFilterChange();
                    }}
                    aria-label='시작일'
                  />
                </div>
                <span className={shared.dateSep}>—</span>
                <div className={styles.dateInput}>
                  <input
                    type='date'
                    value={filters.customEnd}
                    onChange={(e) => {
                      setFilters((f) => ({ ...f, customEnd: e.target.value }));
                      onFilterChange();
                    }}
                    aria-label='종료일'
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.filterField} ${styles.kioskSelect}`}>
          <span className={styles.filterLabel}>도시</span>
          <SearchableSelect
            aria-label='도시 필터'
            placeholder={citiesLoading ? '불러오는 중…' : '전체 도시'}
            options={[{ value: '', label: '전체 도시' }, ...cityOptions]}
            value={filters.city}
            onChange={(city) => {
              setFilters((f) => ({ ...f, city, kioskId: '' }));
              onFilterChange();
            }}
            minWidth='100%'
          />
        </div>

        <div className={`${styles.filterField} ${styles.kioskSelect}`}>
          <span className={styles.filterLabel}>키오스크</span>
          <SearchableSelect
            aria-label='키오스크 필터'
            placeholder={kiosksLoading ? '불러오는 중…' : '전체 키오스크'}
            options={[{ value: '', label: '전체 키오스크' }, ...kioskOptions]}
            value={filters.kioskId}
            onChange={(kioskId) => {
              setFilters((f) => ({ ...f, kioskId }));
              onFilterChange();
            }}
            minWidth='100%'
          />
        </div>

        <div className={`${styles.filterField} ${styles.kioskSelect}`}>
          <span className={styles.filterLabel}>버튼 타입</span>
          <SearchableSelect
            aria-label='버튼 타입 필터'
            placeholder={buttonsLoading ? '불러오는 중…' : '전체 버튼'}
            options={[{ value: '', label: '전체 버튼' }, ...buttonTypeOptions]}
            value={filters.buttonType}
            onChange={(buttonType) => {
              setFilters((f) => ({ ...f, buttonType }));
              onFilterChange();
            }}
            minWidth='100%'
          />
        </div>

        <div className={styles.resetWrap}>
          <button type='button' className={shared.btnOutline} onClick={onReset}>
            필터 초기화
          </button>
        </div>
      </div>
    </section>
  );
}
