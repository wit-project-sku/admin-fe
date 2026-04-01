import React from 'react';
import styles from './FilterGroup.module.css';

export default function FilterGroup({ filters, current, onFilterChange }) {
  return (
    <div className={styles.container}>
      {filters.map((f) => (
        <button
          key={f.key}
          className={`${styles.filterBtn} ${current === f.key ? styles.active : ''}`}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
