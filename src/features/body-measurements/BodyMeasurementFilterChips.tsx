import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import shared from '@commons/shared.module.css';

import { shortYmd } from './bodyMeasurementFormat';
import {
  SHOOTER_OPTIONS,
  SHOT_TYPE_OPTIONS,
  SUCCESS_OPTIONS,
  type ShooterFilter,
  type ShotTypeFilter,
  type SuccessFilter,
} from './useBodyMeasurementPage';
import s from './BodyMeasurements.module.css';

type ChipProps = {
  label: string;
  value: string;
  /** 기본값이 아닐 때 강조 */
  active: boolean;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
};

/** 누르면 아래에 작은 선택 창이 열리는 칩. 바깥 클릭·Esc 로 닫힌다. */
function FilterChip({ label, value, active, disabled, children }: ChipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={s.chipWrap}>
      <button
        type='button'
        className={`${s.chip} ${active ? s.chipActive : ''}`}
        aria-haspopup='dialog'
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={s.chipLabel}>{label}</span>
        <span className={s.chipValue}>{value}</span>
        <span className={s.chipCaret}>
          <ChevronDown size={13} />
        </span>
      </button>
      {open && !disabled ? (
        <div className={s.popover} role='dialog' aria-label={label}>
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function OptionList<K extends string>({
  options,
  current,
  onPick,
}: {
  options: { key: K; label: string }[];
  current: K;
  onPick: (key: K) => void;
}) {
  return (
    <div className={s.optionList} role='listbox'>
      {options.map((o) => (
        <button
          key={o.key}
          type='button'
          role='option'
          aria-selected={current === o.key}
          className={`${s.optionBtn} ${current === o.key ? s.optionBtnActive : ''}`}
          onClick={() => onPick(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const labelOf = <K extends string>(options: { key: K; label: string }[], key: K) =>
  options.find((o) => o.key === key)?.label ?? '';

type KioskOption = { id: number; name: string; label: string };

type Props = {
  range: { start: string; end: string };
  defaultRange: { start: string; end: string };
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onRangeReset: () => void;
  kioskOptions: KioskOption[];
  kiosksLoading: boolean;
  kioskIds: number[];
  onToggleKiosk: (id: number) => void;
  onClearKiosks: () => void;
  shotType: ShotTypeFilter;
  onShotTypeChange: (v: ShotTypeFilter) => void;
  success: SuccessFilter;
  onSuccessChange: (v: SuccessFilter) => void;
  shooter: ShooterFilter;
  onShooterChange: (v: ShooterFilter) => void;
  /** eventId 로 찾는 중이면 칩을 끈다(그 필터는 싣지 않는다). */
  disabled: boolean;
  showReset: boolean;
  onReset: () => void;
};

/** 기간·지점·촬영·합성·촬영자 정보 칩 줄. */
export function BodyMeasurementFilterChips(p: Props) {
  const rangeIsDefault = p.range.start === p.defaultRange.start && p.range.end === p.defaultRange.end;

  const selectedKiosks = p.kioskOptions.filter((k) => p.kioskIds.includes(k.id));
  let kioskValue = '전체';
  if (p.kioskIds.length > 0) {
    const first = selectedKiosks[0]?.label ?? `${p.kioskIds.length}곳`;
    kioskValue = p.kioskIds.length === 1 ? first : `${first} 외 ${p.kioskIds.length - 1}곳`;
  }

  return (
    <div className={s.chipRow}>
      <FilterChip
        label='기간'
        value={`${shortYmd(p.range.start)} ~ ${shortYmd(p.range.end)}`}
        active={!rangeIsDefault}
        disabled={p.disabled}
      >
        {() => (
          <div className={s.rangeBox}>
            <div className={s.rangeInputs}>
              <div className={shared.dateInput}>
                <input
                  type='date'
                  aria-label='시작일'
                  value={p.range.start}
                  max={p.range.end || undefined}
                  onChange={(e) => e.target.value && p.onStartChange(e.target.value)}
                />
              </div>
              <span className={shared.dateSep}>~</span>
              <div className={shared.dateInput}>
                <input
                  type='date'
                  aria-label='종료일'
                  value={p.range.end}
                  min={p.range.start || undefined}
                  onChange={(e) => e.target.value && p.onEndChange(e.target.value)}
                />
              </div>
            </div>
            <span className={s.hint}>촬영 시각 기준 · 양끝 날짜 포함</span>
            {!rangeIsDefault ? (
              <div className={s.popoverFooter}>
                <button type='button' className={shared.btnOutline} onClick={p.onRangeReset}>
                  최근 7일로
                </button>
              </div>
            ) : null}
          </div>
        )}
      </FilterChip>

      <FilterChip label='지점' value={kioskValue} active={p.kioskIds.length > 0} disabled={p.disabled}>
        {() =>
          p.kiosksLoading ? (
            <div className={s.popoverMessage}>불러오는 중…</div>
          ) : p.kioskOptions.length === 0 ? (
            <div className={s.popoverMessage}>키오스크가 없습니다.</div>
          ) : (
            <>
              <div className={s.kioskList}>
                {p.kioskOptions.map((k) => (
                  <label key={k.id} className={s.kioskItem} title={k.name}>
                    <input
                      type='checkbox'
                      checked={p.kioskIds.includes(k.id)}
                      onChange={() => p.onToggleKiosk(k.id)}
                    />
                    {k.label}
                    <span className={s.kioskCode}>#{k.id}</span>
                  </label>
                ))}
              </div>
              <div className={s.popoverFooter}>
                <button
                  type='button'
                  className={shared.btnOutline}
                  onClick={p.onClearKiosks}
                  disabled={p.kioskIds.length === 0}
                >
                  전체 지점
                </button>
              </div>
            </>
          )
        }
      </FilterChip>

      <FilterChip
        label='촬영'
        value={labelOf(SHOT_TYPE_OPTIONS, p.shotType)}
        active={p.shotType !== 'ALL'}
        disabled={p.disabled}
      >
        {(close) => (
          <OptionList
            options={SHOT_TYPE_OPTIONS}
            current={p.shotType}
            onPick={(k) => {
              p.onShotTypeChange(k);
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label='합성'
        value={labelOf(SUCCESS_OPTIONS, p.success)}
        active={p.success !== 'ALL'}
        disabled={p.disabled}
      >
        {(close) => (
          <OptionList
            options={SUCCESS_OPTIONS}
            current={p.success}
            onPick={(k) => {
              p.onSuccessChange(k);
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label='촬영자 정보'
        value={labelOf(SHOOTER_OPTIONS, p.shooter)}
        active={p.shooter !== 'ALL'}
        disabled={p.disabled}
      >
        {(close) => (
          <OptionList
            options={SHOOTER_OPTIONS}
            current={p.shooter}
            onPick={(k) => {
              p.onShooterChange(k);
              close();
            }}
          />
        )}
      </FilterChip>

      {p.showReset && !p.disabled ? (
        <button
          type='button'
          className={shared.btnFilterReset}
          style={{ width: 32, height: 32 }}
          onClick={p.onReset}
          aria-label='필터 초기화'
          title='필터 초기화'
        />
      ) : null}

      {p.disabled ? <span className={s.hint}>eventId 로 찾는 중에는 기간·지점 등 다른 필터를 쓰지 않습니다.</span> : null}
    </div>
  );
}
