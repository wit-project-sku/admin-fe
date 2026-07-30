// 배너 노출 대상 선택 — 전체 / 직접 선택(그룹 빠른선택 + 개별 체크).
// '전체'만 이후 새로 등록되는 키오스크에 자동 노출된다. 그룹 버튼은 체크박스를 채워 주는 편의 기능일 뿐이다.
import type { BannerTargetType } from '@/hooks/kiosk-api/bannerTypes';
import type { ParsedKiosk } from './bannerKiosk';
import { groupKiosks } from './bannerKiosk';
import s from './BannerManage.module.css';

type Props = {
  kiosks: ParsedKiosk[];
  targetType: BannerTargetType;
  selectedIds: number[];
  onChangeType: (t: BannerTargetType) => void;
  onChangeIds: (ids: number[]) => void;
};

export function BannerTargetPicker({
  kiosks,
  targetType,
  selectedIds,
  onChangeType,
  onChangeIds,
}: Props) {
  const groups = groupKiosks(kiosks);
  const toggle = (id: number) =>
    onChangeIds(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );

  return (
    <div className={s.picker}>
      <div className={s.radioRow}>
        <button
          type="button"
          className={`${s.radioBtn} ${targetType === 'ALL' ? s.on : ''}`}
          onClick={() => onChangeType('ALL')}
        >
          전체 키오스크
          <span className={s.radioSub}>앞으로 추가되는 키오스크에도 자동 노출</span>
        </button>
        <button
          type="button"
          className={`${s.radioBtn} ${targetType === 'SELECTED' ? s.on : ''}`}
          onClick={() => onChangeType('SELECTED')}
        >
          직접 선택
          <span className={s.radioSub}>고른 키오스크에만 노출</span>
        </button>
      </div>

      {targetType === 'SELECTED' ? (
        <>
          {groups.length > 0 ? (
            <div className={s.groupRow}>
              <span className={s.checkCode} style={{ alignSelf: 'center', marginRight: 2 }}>
                빠른 선택
              </span>
              {groups.map((g) => (
                <button
                  key={g.group}
                  type="button"
                  className={s.groupBtn}
                  onClick={() => onChangeIds([...new Set([...selectedIds, ...g.ids])])}
                >
                  {g.group} +{g.ids.length}
                </button>
              ))}
              <button type="button" className={s.groupBtn} onClick={() => onChangeIds([])}>
                모두 해제
              </button>
            </div>
          ) : null}

          <div className={s.checkGrid}>
            {kiosks.map((k) => (
              <label key={k.id} className={s.checkItem}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(k.id)}
                  onChange={() => toggle(k.id)}
                />
                <span>{k.name}</span>
                {k.code ? <span className={s.checkCode}>{k.code}</span> : null}
              </label>
            ))}
          </div>
          <span className={s.uploadSub}>{selectedIds.length}곳 선택됨</span>
        </>
      ) : (
        <span className={s.uploadSub}>현재 {kiosks.length}곳 + 이후 추가되는 키오스크 전부</span>
      )}
    </div>
  );
}
