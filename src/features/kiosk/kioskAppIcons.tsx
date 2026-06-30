import { Map as MapIcon } from 'lucide-react';
import { getKioskIconOption, KIOSK_APP_ICON_OPTIONS } from './kioskAppIconData';

/** SVG asset URL from `KIOSK_APP_ICON_OPTIONS`, or Lucide fallback when `iconKey` is unknown. */
export function KioskAppIconGlyph({ iconKey, size }: { iconKey: string; size: number }) {
  const src = getKioskIconOption(iconKey)?.Icon;
  if (src) {
    return (
      <img
        src={src}
        alt=''
        width={size}
        height={size}
        draggable={false}
        style={{ objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return <MapIcon size={size} strokeWidth={2.2} />;
}

type KioskAppIconVisualProps = {
  iconKey: string;
  /** Glyph size in px */
  size?: number;
  /** Tile outer size in px (default 48) */
  tileSize?: number;
  className?: string;
};

/** Renders the hardcoded icon inside a colored tile (for lists, previews, tables). */
export function KioskAppIconVisual({ iconKey, size = 22, tileSize = 48, className }: KioskAppIconVisualProps) {
  const opt = getKioskIconOption(iconKey);
  const bg = opt?.color ?? '#64748b';
  const iconPx = size ?? Math.max(14, Math.round(tileSize * 0.46));
  return (
    <span
      className={className}
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: 8,
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <KioskAppIconGlyph iconKey={iconKey} size={iconPx} />
    </span>
  );
}

type IconPickerProps = {
  value: string;
  onChange: (key: string) => void;
  /** Extra class on the grid wrapper (e.g. modal-specific layout). */
  className?: string;
};

/** Grid of selectable hardcoded icons for forms. */
export function KioskIconPicker({ value, onChange, className }: IconPickerProps) {
  return (
    <div
      className={className}
      role='listbox'
      aria-label='앱 아이콘 선택'
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
        gap: 8,
      }}
    >
      {KIOSK_APP_ICON_OPTIONS.map((opt) => {
        const selected = opt.iconKey === value;
        const caption = opt.label?.trim() || opt.iconKey;
        return (
          <button
            key={opt.iconKey}
            type='button'
            role='option'
            aria-selected={selected}
            title={`${opt.iconKey}${opt.label ? ` · ${opt.label}` : ''}`}
            onClick={() => onChange(opt.iconKey)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 8px',
              borderRadius: 8,
              border: selected ? `2px solid var(--accent)` : '1px solid var(--border)',
              background: selected ? 'var(--blue-bg)' : 'var(--bg-muted)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: opt.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <KioskAppIconGlyph iconKey={opt.iconKey} size={24} />
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              {caption}
            </span>
          </button>
        );
      })}
    </div>
  );
}
