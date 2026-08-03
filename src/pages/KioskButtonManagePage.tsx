import { useCallback, useEffect, useState } from 'react';
import shared from '@commons/shared.module.css';
import { KioskButtonAddModal } from '@/features/kiosk/manage/KioskButtonAddModal';
import { KioskButtonByKioskPanel } from '@/features/kiosk/manage/KioskButtonByKioskPanel';
import { KioskSubtitleSheet } from '@/features/kiosk/manage/KioskSubtitleSheet';
import { KioskUpdateButton } from '@/features/kiosk/manage/KioskUpdateButton';
import styles from '@/features/kiosk/manage/KioskAppManagePage.module.css';
import { useKioskButtonManagePage } from '@/features/kiosk/manage/useKioskButtonManagePage';

type PlaceholderModal = 'add' | null;

export default function KioskButtonManagePage() {
  const m = useKioskButtonManagePage();
  const [modal, setModal] = useState<PlaceholderModal>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 키오스크가 바뀌면 선택 해제(시트도 함께 숨김)
  useEffect(() => setSelectedId(null), [m.byKioskId]);

  const selectedButton = m.byKioskAllButtons.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const openAddModal = useCallback(() => setModal('add'), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>WITH 버튼 관리</h1>
          <p className={shared.pageSubtitle}>키오스크 별 아이콘 배치 · 정보 · 자막/영상</p>
        </div>
        <div className={shared.actionGroup}>
          {/* 키오스크 데스크톱 앱 즉시 업데이트(주간 점검 창과 별개의 수동 트리거). */}
          <KioskUpdateButton />
          <button type='button' className={shared.btnPrimary} onClick={openAddModal}>
            새 버튼 추가
          </button>
        </div>
      </div>

      <p className={styles.tabBarHint} style={{ margin: '0 0 12px' }}>
        위치는 열(1~8)·칸(1~4) · 3~6열 아이콘을 드래그해 배치(2칸 와이드 포함) · 아이콘을 클릭하면 정보·옵션이
        표시됩니다 · 자막/영상은 아래 시트에서 전 언어를 한 번에 편집
      </p>

      {modal === 'add' ? (
        <KioskButtonAddModal
          open
          onClose={closeModal}
          kioskOptions={m.kioskSelectOptions}
          defaultKioskId={m.byKioskId}
        />
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

      <KioskButtonByKioskPanel
        buttons={m.byKioskAllButtons}
        isLoading={m.byKioskAllLoading || m.kiosksLoading}
        kioskName={m.selectedKioskName}
        kioskId={m.selectedKioskIdNum}
        byKioskId={m.byKioskId}
        onByKioskId={m.setByKioskId}
        kioskOptions={m.kioskSelectOptions}
        selectedId={selectedId}
        onSelectButton={(b) => setSelectedId(b.id)}
        onNotice={setNotice}
      />
      {selectedButton ? (
        <KioskSubtitleSheet
          kioskId={m.selectedKioskIdNum}
          button={selectedButton}
          onNotice={setNotice}
        />
      ) : null}
    </div>
  );
}
