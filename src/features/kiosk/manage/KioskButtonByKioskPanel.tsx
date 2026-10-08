import { useEffect, useRef, useState } from 'react';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import { KioskAppIconVisual } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { useUpdateKioskButton } from '@/hooks/kiosk-api/useUpdateKioskButton';
import { useKioskButtonImage } from '@/hooks/kiosk-api/useKioskButtonImage';
import { useDeleteKioskButton } from '@/hooks/kiosk-api/useDeleteKioskButton';
import { KioskMirrorPreview } from './KioskMirrorPreview';
import { KioskMirrorHwaseong } from './KioskMirrorHwaseong';
import { KioskMirrorGridApp, INSADONG_SKIN, OSAN_SKIN } from './KioskMirrorGridApp';
import { placementLabel, positionLabel } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
import { formatUsageDaysHours, formatUsageExact } from '../kioskFormatters';
import styles from './KioskAppManagePage.module.css';

type Props = {
  buttons: KioskButtonDto[];
  isLoading: boolean;
  kioskName: string;
  kioskId?: number;
  byKioskId: string;
  onByKioskId: (id: string) => void;
  kioskOptions: Array<{ value: string; label: string; sublabel?: string }>;
  selectedId: number | null;
  onSelectButton: (button: KioskButtonDto) => void;
  onNotice?: (message: string) => void;
};

export function KioskButtonByKioskPanel({
  buttons,
  isLoading,
  kioskName,
  kioskId,
  byKioskId,
  onByKioskId,
  kioskOptions,
  selectedId,
  onSelectButton,
  onNotice,
}: Props) {
  const { updateKioskButtonAsync } = useUpdateKioskButton();
  const { uploadImageAsync } = useKioskButtonImage();
  const { deleteKioskButtonAsync } = useDeleteKioskButton();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 인라인 편집 폼 상태
  const [buttonType, setButtonType] = useState('');
  const [buttonName, setButtonName] = useState('');
  const [iconKey, setIconKey] = useState('');

  const selected = buttons.find((b) => b.id === selectedId) ?? null;
  // 미표시(OFF_MAIN) 아이콘 — 미러에 안 나오므로 별도 목록으로 표시
  const offMainButtons = buttons.filter(
    (b) => (b.placement ?? 'MAIN') === 'OFF_MAIN' || (b.line ?? 0) < 1,
  );

  // 선택 버튼이 바뀌면 폼 리셋
  useEffect(() => {
    if (!selected) return;
    setButtonType(selected.buttonType ?? '');
    setButtonName(selected.buttonName ?? '');
    setIconKey(selected.iconKey ?? '');
  }, [selectedId, selected]);

  const saveEdit = async () => {
    if (!selected) return;
    const typeTrim = buttonType.trim();
    const nameTrim = buttonName.trim();
    if (!typeTrim) {
      onNotice?.('버튼 종류(별칭)를 입력해주세요.');
      return;
    }
    try {
      setSaving(true);
      // 위치(line·position)·폭(span)은 보내지 않는다 — 서버가 기존 값을 그대로 둔다.
      await updateKioskButtonAsync({
        buttonId: selected.id,
        payload: {
          buttonType: typeTrim,
          buttonName: nameTrim,
          iconKey: iconKey.trim() ? iconKey.trim() : null,
        },
      });
      onNotice?.('버튼 정보가 저장되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (!window.confirm(`'${selected.buttonType}' 버튼을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    try {
      setDeleting(true);
      await deleteKioskButtonAsync(selected.id);
      // 목록 재조회되면 selected 가 자동으로 사라져 상세 패널이 닫힌다.
      onNotice?.('버튼을 삭제했습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '버튼을 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const onFilePicked = async (file: File | null) => {
    if (!file || !selected) return;
    try {
      setUploading(true);
      await uploadImageAsync({ buttonId: selected.id, file });
      onNotice?.('버튼 이미지가 업로드되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '이미지를 업로드하지 못했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.byKioskPanel}>
      <div className={styles.byKioskSelectRow}>
        <div className={`${styles.field} ${styles.fieldCompact}`}>
          <span className={styles.fieldLabel}>키오스크</span>
          <div className={styles.byKioskSelectWrap}>
            <SearchableSelect
              aria-label='키오스크 선택'
              options={kioskOptions}
              value={byKioskId}
              onChange={onByKioskId}
              minWidth='100%'
            />
          </div>
        </div>
      </div>

      <div className={styles.mirrorLayout}>
        <div className={styles.mirrorLeft}>
        <div>
          <div className={styles.previewLabel}>
            {kioskName} — 실기기 메인 화면 미리보기(보기 전용) · 아이콘 클릭 시 정보 편집
          </div>
          {isLoading ? (
            <p className={styles.emptyState}>불러오는 중…</p>
          ) : (
            (() => {
              // 키오스크별 실사 미러 — kiosk-electron 레이아웃(HwaseongHome/InsadongHome/OsanHome)을
              // 그대로 이식. 매칭 안 되는 키오스크는 기존 제네릭 미러로 폴백.
              const name = kioskName ?? '';
              const isHwaseong = kioskId === 5 || name.includes('화성') || name.includes('휴게소');
              const isOsan = kioskId === 4 || name.includes('오색') || name.includes('오산');
              const isInsadong = kioskId === 1 || kioskId === 2 || kioskId === 3 || name.includes('인사동');
              if (isHwaseong) {
                return (
                  <KioskMirrorHwaseong
                    buttons={buttons}
                    onSelect={onSelectButton}
                    selectedId={selectedId}
                  />
                );
              }
              if (isOsan || isInsadong) {
                return (
                  <KioskMirrorGridApp
                    buttons={buttons}
                    skin={isOsan ? OSAN_SKIN : INSADONG_SKIN}
                    onSelect={onSelectButton}
                    selectedId={selectedId}
                  />
                );
              }
              return (
                <KioskMirrorPreview
                  buttons={buttons}
                  kioskId={kioskId}
                  kioskName={kioskName}
                  onSelect={onSelectButton}
                  selectedId={selectedId}
                />
              );
            })()
          )}
        </div>

        {/* 미표시(OFF_MAIN) 아이콘 — 미러 바로 아래에 표시·선택 */}
        {offMainButtons.length > 0 ? (
          <div className={styles.offMainSection}>
            <div className={styles.previewLabel}>
              미표시 아이콘 ({offMainButtons.length}) — 키오스크 화면에 나오지 않는 버튼 · 클릭 시 정보 편집
            </div>
            <div className={styles.offMainList}>
              {offMainButtons.map((b) => (
                <button
                  key={b.id}
                  type='button'
                  className={`${styles.offMainChip} ${selectedId === b.id ? styles.offMainChipSel : ''}`}
                  onClick={() => onSelectButton(b)}
                  title={b.buttonName ?? b.buttonType}
                >
                  <span className={styles.offMainIcon}>
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt='' />
                    ) : (
                      <KioskAppIconVisual iconKey={resolveKioskButtonIconKey(b.iconKey)} tileSize={34} />
                    )}
                  </span>
                  <span className={styles.offMainName}>{b.buttonType}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        </div>

        {/* 선택된 아이콘의 모든 정보 — 오른쪽 컬럼에 표시, 인라인으로 전부 수정 가능 */}
        <div className={styles.detailCol}>
          {!selected ? (
            <div className={`${shared.card} ${styles.detailEmpty}`}>
              <i className='ti ti-click' aria-hidden style={{ fontSize: 22, opacity: 0.4 }} />
              <p className={styles.formHint} style={{ margin: '8px 0 0' }}>
                왼쪽 미리보기에서 아이콘을 클릭하면
                <br />
                해당 버튼의 모든 정보를 편집할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className={`${shared.card} ${styles.detailBox}`}>
              <div className={styles.detailHead}>
                <span className={styles.detailIcon}>
                  {selected.imageUrl ? (
                    <img
                      src={selected.imageUrl}
                      alt=''
                      style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
                    />
                  ) : (
                    <KioskAppIconVisual iconKey={resolveKioskButtonIconKey(iconKey)} tileSize={48} />
                  )}
                </span>
                <div>
                  <div className={shared.tdBold} style={{ fontSize: 15 }}>{selected.buttonType}</div>
                  <div className={styles.formHint} style={{ margin: 0 }}>
                    {positionLabel(selected.line, selected.position, selected.span)}
                  </div>
                </div>
              </div>

              <table className={styles.detailTable}>
                <tbody>
                  <tr>
                    <td>배치</td>
                    <td>{placementLabel(selected.placement)}</td>
                  </tr>
                  <tr>
                    <td>총 클릭</td>
                    <td>{(selected.totalClicks ?? 0).toLocaleString()}회</td>
                  </tr>
                  <tr>
                    <td>누적 사용 시간</td>
                    <td title={formatUsageExact(selected.totalDuration)}>
                      {formatUsageDaysHours(selected.totalDuration)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className={styles.editForm}>
                <label className={styles.editField}>
                  <span>버튼 종류(별칭)</span>
                  <input
                    className={styles.input}
                    value={buttonType}
                    onChange={(e) => setButtonType(e.target.value)}
                    disabled={saving}
                  />
                </label>
                <label className={styles.editField}>
                  <span>버튼 이름</span>
                  <input
                    className={styles.input}
                    value={buttonName}
                    onChange={(e) => setButtonName(e.target.value)}
                    disabled={saving}
                  />
                </label>
                <label className={styles.editField}>
                  <span>아이콘 key</span>
                  <input
                    className={styles.input}
                    value={iconKey}
                    onChange={(e) => setIconKey(e.target.value)}
                    placeholder='비우면 미지정'
                    autoComplete='off'
                    disabled={saving}
                  />
                </label>
                <div className={styles.editField}>
                  <span>아이콘 이미지 {selected.imageUrl ? '(등록됨)' : '(미등록)'}</span>
                  <input
                    ref={fileRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      void onFilePicked(e.target.files?.[0] ?? null);
                      e.target.value = '';
                    }}
                  />
                  <div>
                    <button
                      type='button'
                      className={shared.btnOutline}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? '업로드…' : selected.imageUrl ? '이미지 교체' : '이미지 등록'}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.detailActions}>
                <button
                  type='button'
                  className={shared.btnPrimary}
                  onClick={() => void saveEdit()}
                  disabled={saving || deleting}
                >
                  {saving ? '저장 중…' : '변경 저장'}
                </button>
                <button
                  type='button'
                  className={shared.btnOutline}
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}
                  onClick={() => void deleteSelected()}
                  disabled={saving || deleting}
                >
                  {deleting ? '삭제 중…' : '삭제'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
