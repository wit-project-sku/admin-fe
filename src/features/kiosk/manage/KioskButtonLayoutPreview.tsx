import { getKioskIconOption } from '../kioskAppIconData';
import { KioskAppIconGlyph } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { POSITIONS } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
import styles from './KioskAppManagePage.module.css';

type Props = { buttons: KioskButtonDto[] };

export function KioskButtonLayoutPreview({ buttons }: Props) {
  const byPos = new Map(buttons.map((b) => [b.position, b]));
  return (
    <div className={styles.previewGrid}>
      {POSITIONS.map((pos) => {
        const b = byPos.get(pos);
        if (!b) {
          return (
            <div key={pos} className={styles.slot}>
              <span className={styles.slotPos}>{pos}</span>
              빈칸
            </div>
          );
        }
        const iconKey = resolveKioskButtonIconKey(b.iconKey);
        const opt = getKioskIconOption(iconKey);
        return (
          <div key={pos} className={`${styles.slot} ${styles.slotFilled}`} title={b.buttonType}>
            <span className={styles.slotPos}>{pos}</span>
            <span className={styles.slotIconInner} style={{ background: opt?.color ?? '#64748b' }}>
              <KioskAppIconGlyph iconKey={iconKey} size={22} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
