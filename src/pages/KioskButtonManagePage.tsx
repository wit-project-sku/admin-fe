import { useCallback, useEffect, useState } from 'react';
import shared from '@commons/shared.module.css';
import { KioskButtonAddModal } from '@/features/kiosk/manage/KioskButtonAddModal';
import { KioskButtonByKioskPanel } from '@/features/kiosk/manage/KioskButtonByKioskPanel';
import { KioskButtonCatalogGrid } from '@/features/kiosk/manage/KioskButtonCatalogGrid';
import { KioskButtonEditModal } from '@/features/kiosk/manage/KioskButtonEditModal';
import { KioskSubtitleSheet } from '@/features/kiosk/manage/KioskSubtitleSheet';
import {
  formatKioskButtonStatusLabel,
  isKioskButtonStatusActive,
  resolveKioskButtonIconKey,
} from '@/features/kiosk/manage/kioskButtonDisplay';
import DetailModal from '@modals/DetailModal';
import styles from '@/features/kiosk/manage/KioskAppManagePage.module.css';
import { useKioskButtonManagePage } from '@/features/kiosk/manage/useKioskButtonManagePage';
import { useDeleteKioskButton } from '@/hooks/kiosk-api/useDeleteKioskButton';
import { useUpdateKioskButton } from '@/hooks/kiosk-api/useUpdateKioskButton';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';

type PlaceholderModal = 'add' | null;

export default function KioskButtonManagePage() {
  const m = useKioskButtonManagePage();
  const { deleteKioskButtonAsync } = useDeleteKioskButton();
  const { updateKioskButtonAsync } = useUpdateKioskButton();
  const [modal, setModal] = useState<PlaceholderModal>(null);
  const [editButton, setEditButton] = useState<KioskButtonDto | null>(null);
  const [focusButtonId, setFocusButtonId] = useState<number | null>(null);
  const [viewButton, setViewButton] = useState<KioskButtonDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KioskButtonDto | null>(null);
  const [deletingButtonId, setDeletingButtonId] = useState<number | null>(null);
  const [togglingButtonId, setTogglingButtonId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const messageFromError = (err: unknown, fallback: string) =>
    err instanceof Error && err.message.trim() ? err.message : fallback;

  useEffect(() => {
    setModal(null);
    setEditButton(null);
    setFocusButtonId(null);
    setDeleteTarget(null);
    setDeletingButtonId(null);
    setTogglingButtonId(null);
  }, [m.tab]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!modal && !editButton && !deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setModal(null);
      setEditButton(null);
      setDeleteTarget(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, editButton, deleteTarget]);

  const openAddModal = useCallback(() => setModal('add'), []);
  const closeModal = useCallback(() => setModal(null), []);
  const closeEditModal = useCallback(() => setEditButton(null), []);
  const closeDeleteModal = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeletingButtonId(deleteTarget.id);
      await deleteKioskButtonAsync(deleteTarget.id);
      setNotice('버튼이 삭제되었습니다.');
      setDeleteTarget(null);
    } catch (err) {
      setNotice(messageFromError(err, '버튼을 삭제하지 못했습니다.'));
    } finally {
      setDeletingButtonId(null);
    }
  }, [deleteTarget, deleteKioskButtonAsync]);

  const onCatalogCardAction = useCallback(
    async (action: 'edit' | 'toggle' | 'delete' | 'view' | 'subtitle', button: KioskButtonDto) => {
      if (action === 'view') {
        setViewButton(button);
        return;
      }
      if (action === 'edit') {
        setEditButton(button);
        return;
      }
      // 자막/영상·이미지 편집은 WITH별 탭의 시트에서 수행 — 해당 버튼의 WITH로 전환 + 행 포커스.
      if (action === 'subtitle') {
        if (button.kioskId != null) m.setByKioskId(String(button.kioskId));
        m.setTab('byKiosk');
        setFocusButtonId(button.id);
        return;
      }
      if (action === 'toggle') {
        const nextStatus = isKioskButtonStatusActive(button.status) ? 'INACTIVE' : 'ACTIVE';
        try {
          setTogglingButtonId(button.id);
          await updateKioskButtonAsync({
            buttonId: button.id,
            payload: {
              buttonType: button.buttonType,
              buttonName: button.buttonName ?? '',
              line: button.line,
              position: button.position,
              iconKey: resolveKioskButtonIconKey(button.iconKey),
              status: nextStatus,
            },
          });
          setNotice(nextStatus === 'ACTIVE' ? '버튼이 활성화되었습니다.' : '버튼이 비활성화되었습니다.');
        } catch (err) {
          setNotice(messageFromError(err, '버튼 상태를 변경하지 못했습니다.'));
        } finally {
          setTogglingButtonId(null);
        }
        return;
      }
      if (action === 'delete') {
        setDeleteTarget(button);
        return;
      }
    },
    [updateKioskButtonAsync, m],
  );

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>WITH 버튼 관리</h1>
          <p className={shared.pageSubtitle}>WITH Button Management</p>
        </div>
      </div>

      <div className={styles.tabBarBlock}>
        <div className={styles.tabBarRow}>
          <div className={styles.tabBar} role='tablist' aria-label='버튼 보기'>
            <button
              type='button'
              role='tab'
              aria-selected={m.tab === 'all'}
              className={`${styles.tab} ${m.tab === 'all' ? styles.tabActive : ''}`}
              onClick={() => m.setTab('all')}
            >
              전체 버튼
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={m.tab === 'byKiosk'}
              className={`${styles.tab} ${m.tab === 'byKiosk' ? styles.tabActive : ''}`}
              onClick={() => m.setTab('byKiosk')}
            >
              WITH별
            </button>
          </div>
          <div className={styles.tabBarActions}>
            <button type='button' className={shared.btnPrimary} onClick={openAddModal}>
              새 버튼 추가
            </button>
          </div>
        </div>
        <p className={styles.tabBarHint}>
          위치는 열(1~8)·칸(1~4) · 3~6열만 드래그 배치 · 자막/영상·이미지는 WITH별 탭의 시트에서 바로 편집
        </p>
      </div>

      {modal === 'add' ? (
        <KioskButtonAddModal
          open
          onClose={closeModal}
          kioskOptions={m.kioskSelectOptions}
          defaultKioskId={m.tab === 'byKiosk' ? m.byKioskId : undefined}
        />
      ) : null}

      {editButton ? (
        <KioskButtonEditModal open onClose={closeEditModal} button={editButton} onSuccess={setNotice} />
      ) : null}

      <DetailModal
        open={!!viewButton}
        title={viewButton ? `버튼 정보 — ${viewButton.buttonType}` : '버튼 정보'}
        onClose={() => setViewButton(null)}
        fields={
          viewButton
            ? [
                { label: '버튼 종류', value: viewButton.buttonType },
                { label: '버튼명', value: viewButton.buttonName },
                {
                  label: '배치',
                  value:
                    (viewButton.placement ?? 'MAIN') === 'MAIN'
                      ? `그리드 (줄·칸 ${viewButton.line}·${viewButton.position})`
                      : viewButton.placement === 'FIXED'
                        ? '고정 (위치 관리 안 함)'
                        : '미표시 (메인 화면 미노출)',
                },
                { label: '상태', value: formatKioskButtonStatusLabel(viewButton.status) },
                { label: 'WITH(키오스크)', value: viewButton.kioskName ?? viewButton.kioskId },
                { label: '아이콘 키', value: resolveKioskButtonIconKey(viewButton.iconKey) },
                { label: '총 클릭', value: viewButton.totalClicks?.toLocaleString() },
              ]
            : []
        }
      />

      {deleteTarget ? (
        <div className={styles.overlay} role='presentation' onClick={closeDeleteModal}>
          <div
            className={styles.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='kiosk-button-delete-title'
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <span id='kiosk-button-delete-title' className={styles.modalTitle}>
                버튼 삭제
              </span>
              <button type='button' className={shared.btnOutline} onClick={closeDeleteModal} aria-label='닫기' disabled={deletingButtonId === deleteTarget.id}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.formHint}>
                <strong>{deleteTarget.buttonType}</strong> 버튼을 삭제하시겠습니까?
              </p>
              <p className={styles.formHint}>삭제 후에는 복구할 수 없습니다.</p>
            </div>
            <div className={styles.modalFooter}>
              <button type='button' className={shared.btnOutline} onClick={closeDeleteModal} disabled={deletingButtonId === deleteTarget.id}>
                취소
              </button>
              <button type='button' className={shared.btnPrimary} onClick={confirmDelete} disabled={deletingButtonId === deleteTarget.id}>
                {deletingButtonId === deleteTarget.id ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className={styles.actionNotice} role='status' aria-live='polite'>
          {notice}
          <button
            type='button'
            className={styles.actionNoticeDismiss}
            onClick={() => setNotice(null)}
            aria-label='알림 닫기'
          >
            ×
          </button>
        </p>
      ) : null}

      {m.error ? (
        <p className={styles.apiError} role='alert'>
          버튼 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      ) : null}

      {m.tab === 'all' && (
        <KioskButtonCatalogGrid
          buttons={m.buttons}
          isLoading={m.isLoading}
          deletingButtonId={deletingButtonId}
          togglingButtonId={togglingButtonId}
          showKioskColumn={m.showKioskColumn}
          page={m.page}
          totalPages={m.totalPages}
          totalElements={m.totalElements}
          onPageChange={m.setPage}
          onCardAction={onCatalogCardAction}
        />
      )}

      {m.tab === 'byKiosk' && (
        <>
          <KioskButtonByKioskPanel
            buttons={m.byKioskAllButtons}
            isLoading={m.byKioskAllLoading || m.kiosksLoading}
            kioskName={m.selectedKioskName}
            kioskId={m.selectedKioskIdNum}
            byKioskId={m.byKioskId}
            onByKioskId={m.setByKioskId}
            kioskOptions={m.kioskSelectOptions}
            onEditButton={(b) => setEditButton(b)}
            onFocusButton={(b) => setFocusButtonId(b.id)}
            onNotice={setNotice}
          />
          <KioskSubtitleSheet
            kioskId={m.selectedKioskIdNum}
            buttons={m.byKioskAllButtons}
            onNotice={setNotice}
            focusButtonId={focusButtonId}
          />
        </>
      )}
    </div>
  );
}
