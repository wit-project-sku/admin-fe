import { useEffect, useRef, useState } from 'react';
import shared from '@commons/shared.module.css';
import SearchableSelect from '@components/common/SearchableSelect';
import { KioskAppIconVisual } from '../kioskAppIcons';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { useUpdateKioskButton } from '@/hooks/kiosk-api/useUpdateKioskButton';
import {
  useUpdateKioskButtonPlacement,
  type ButtonPlacement,
} from '@/hooks/kiosk-api/useUpdateKioskButtonPlacement';
import { useKioskButtonImage } from '@/hooks/kiosk-api/useKioskButtonImage';
import { KioskMirrorPreview, type MoveRequest } from './KioskMirrorPreview';
import { PLACEMENT_OPTIONS, SPAN_OPTIONS, positionLabel } from './constants';
import { resolveKioskButtonIconKey } from './kioskButtonDisplay';
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
  const { updatePlacementAsync } = useUpdateKioskButtonPlacement();
  const { uploadImageAsync } = useKioskButtonImage();
  const [moving, setMoving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 드래그 SWAP 확인 대기
  const [pendingMove, setPendingMove] = useState<MoveRequest | null>(null);

  // 인라인 편집 폼 상태
  const [buttonType, setButtonType] = useState('');
  const [buttonName, setButtonName] = useState('');
  const [iconKey, setIconKey] = useState('map');
  const [status, setStatus] = useState('ACTIVE');
  const [placement, setPlacement] = useState<ButtonPlacement>('MAIN');
  const [span, setSpan] = useState(1);

  const selected = buttons.find((b) => b.id === selectedId) ?? null;
  // 미표시(OFF_MAIN) 아이콘 — 미러에 안 나오므로 별도 목록으로 표시
  const offMainButtons = buttons.filter(
    (b) => (b.placement ?? 'MAIN') === 'OFF_MAIN' || (b.line ?? 0) < 1,
  );

  const formatDuration = (sec?: number): string => {
    const s = Math.max(0, Math.floor(sec ?? 0));
    if (s === 0) return '0초';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    const parts: string[] = [];
    if (h) parts.push(`${h}시간`);
    if (m) parts.push(`${m}분`);
    if (r || parts.length === 0) parts.push(`${r}초`);
    return parts.join(' ');
  };

  // 선택 버튼이 바뀌면 폼 리셋
  useEffect(() => {
    if (!selected) return;
    setButtonType(selected.buttonType ?? '');
    setButtonName(selected.buttonName ?? '');
    setIconKey(resolveKioskButtonIconKey(selected.iconKey));
    setStatus(selected.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setPlacement((selected.placement as ButtonPlacement) ?? 'MAIN');
    setSpan(selected.span === 2 ? 2 : 1);
  }, [selectedId, selected]);

  const requestMove = (req: MoveRequest) => setPendingMove(req);

  const confirmMove = async () => {
    const req = pendingMove;
    setPendingMove(null);
    if (!req) return;
    const src = buttons.find((b) => b.id === req.sourceId);
    if (!src) return;
    try {
      setMoving(true);
      await updateKioskButtonAsync({
        buttonId: src.id,
        payload: {
          buttonType: src.buttonType,
          buttonName: src.buttonName ?? '',
          line: req.targetLine,
          position: req.targetPosition,
          span: src.span === 2 ? 2 : 1,
          iconKey: resolveKioskButtonIconKey(src.iconKey),
          status: src.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        },
      });
      onNotice?.('버튼 위치를 변경했습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '위치 변경에 실패했습니다.');
    } finally {
      setMoving(false);
    }
  };

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
      await updateKioskButtonAsync({
        buttonId: selected.id,
        payload: {
          buttonType: typeTrim,
          buttonName: nameTrim,
          line: selected.line,
          position: selected.position,
          span,
          iconKey: resolveKioskButtonIconKey(iconKey),
          status,
        },
      });
      const originalPlacement = (selected.placement as ButtonPlacement) ?? 'MAIN';
      if (placement !== originalPlacement) {
        await updatePlacementAsync({ buttonId: selected.id, placement });
      }
      onNotice?.('버튼 정보가 저장되었습니다.');
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : '저장하지 못했습니다.');
    } finally {
      setSaving(false);
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

  // 확인 모달 메시지용: 이동 대상/교환 상대
  const moveSource = pendingMove ? buttons.find((b) => b.id === pendingMove.sourceId) : null;
  const moveTarget =
    pendingMove &&
    buttons.find(
      (b) =>
        (b.placement ?? 'MAIN') === 'MAIN' &&
        b.line === pendingMove.targetLine &&
        b.id !== pendingMove.sourceId &&
        pendingMove.targetPosition >= b.position &&
        pendingMove.targetPosition <= b.position + (b.span === 2 ? 2 : 1) - 1,
    );

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
        <div>
          <div className={styles.previewLabel}>
            {kioskName} — 실기기 메인 화면 미리보기 · 3~6열 아이콘을 드래그해 서로 위치를 교환 · 아이콘 클릭 시 정보 편집
          </div>
          {isLoading ? (
            <p className={styles.emptyState}>불러오는 중…</p>
          ) : (
            <KioskMirrorPreview
              buttons={buttons}
              kioskId={kioskId}
              kioskName={kioskName}
              onMove={requestMove}
              onSelect={onSelectButton}
              selectedId={selectedId}
              disabled={moving}
            />
          )}
        </div>

        {/* 선택된 아이콘의 모든 정보 — 클릭 시에만 표시, 인라인으로 전부 수정 가능 */}
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
                    <td>총 클릭</td>
                    <td>{(selected.totalClicks ?? 0).toLocaleString()}회</td>
                  </tr>
                  <tr>
                    <td>사용 시간</td>
                    <td>{formatDuration(selected.totalDuration)}</td>
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
                <div className={styles.editRow}>
                  <label className={styles.editField}>
                    <span>상태</span>
                    <select
                      className={styles.select}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={saving}
                    >
                      <option value='ACTIVE'>활성화</option>
                      <option value='INACTIVE'>비활성화</option>
                    </select>
                  </label>
                  <label className={styles.editField}>
                    <span>배치</span>
                    <select
                      className={styles.select}
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value as ButtonPlacement)}
                      disabled={saving}
                    >
                      {PLACEMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.editField}>
                    <span>가로 폭</span>
                    <select
                      className={styles.select}
                      value={span}
                      onChange={(e) => setSpan(Number(e.target.value))}
                      disabled={saving || placement !== 'MAIN'}
                    >
                      {SPAN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
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
                  disabled={saving}
                >
                  {saving ? '저장 중…' : '변경 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 미표시(OFF_MAIN) 아이콘 — 미러에 안 나오므로 여기서 표시·선택 */}
      {offMainButtons.length > 0 ? (
        <div className={styles.offMainSection}>
          <div className={styles.previewLabel}>
            미표시 아이콘 ({offMainButtons.length}) — 클릭 후 배치를 ‘그리드’로 바꾸면 다시 표시됩니다
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

      {/* 드래그 SWAP 확인 모달 */}
      {pendingMove && moveSource ? (
        <div className={styles.overlay} role='presentation' onClick={() => setPendingMove(null)}>
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='kiosk-swap-title'
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <span id='kiosk-swap-title' className={styles.modalTitle}>
                아이콘 위치 변경
              </span>
              <button type='button' className={shared.btnOutline} onClick={() => setPendingMove(null)} aria-label='닫기'>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {moveTarget ? (
                <p className={styles.formHint}>
                  <strong>{moveSource.buttonType}</strong> 와 <strong>{moveTarget.buttonType}</strong> 의 위치를 서로
                  바꿉니다.
                  {moveSource.span === 2 || moveTarget.span === 2
                    ? ' (2칸 아이콘은 인접 아이콘과 함께 교환됩니다.)'
                    : ''}
                </p>
              ) : (
                <p className={styles.formHint}>
                  <strong>{moveSource.buttonType}</strong> 를{' '}
                  {positionLabel(pendingMove.targetLine, pendingMove.targetPosition, moveSource.span)} 위치로 이동합니다.
                </p>
              )}
              <p className={styles.formHint}>진행하시겠습니까?</p>
            </div>
            <div className={styles.modalFooter}>
              <button type='button' className={shared.btnOutline} onClick={() => setPendingMove(null)} disabled={moving}>
                취소
              </button>
              <button type='button' className={shared.btnPrimary} onClick={() => void confirmMove()} disabled={moving}>
                {moving ? '변경 중…' : '위치 바꾸기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
