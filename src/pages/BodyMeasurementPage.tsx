// 체형 측정 데이터 — 키오스크 AR 촬영 1건(eventId)마다 ZED 신체 폭 측정값·원본 사진·촬영자 입력(키·성별·국적).
// 최고 관리자 전용(USER_ALLOWED_PATHS 에 없어 RoleGuard 가 막고, 메뉴도 ROLE_ADMIN 묶음에만 있다).
// 시안 그대로 — 요약 카드 4칸은 두지 않는다(2026-10-08 확정).
import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import DeleteModal from '@modals/DeleteModal';
import { BodyMeasurementDetailPanel } from '../features/body-measurements/BodyMeasurementDetailPanel';
import { BodyMeasurementFilterChips } from '../features/body-measurements/BodyMeasurementFilterChips';
import { BodyMeasurementTable } from '../features/body-measurements/BodyMeasurementTable';
import { fmtShotSecond, kioskShortName } from '../features/body-measurements/bodyMeasurementFormat';
import { useBodyMeasurementPage } from '../features/body-measurements/useBodyMeasurementPage';
import s from '../features/body-measurements/BodyMeasurements.module.css';

export default function BodyMeasurementPage() {
  const p = useBodyMeasurementPage();
  const row = p.selectedRow;

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>체형 측정 데이터</h1>
          <p className={shared.pageSubtitle}>Body Measurement</p>
        </div>
        <div className={s.headerActions}>
          <SearchBar
            value={p.eventIdInput}
            onChange={p.setEventIdInput}
            placeholder='eventId 로 찾기'
            minWidth='260px'
          />
          <button
            type='button'
            className={shared.btnGreen}
            onClick={p.exportXlsx}
            disabled={p.isExporting}
            title='현재 필터의 전체 행을 엑셀(.xlsx)로 내려받기 — 사진은 들어가지 않습니다'
          >
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7 10 12 15 17 10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
            {p.isExporting ? '내려받는 중…' : '엑셀'}
          </button>
        </div>
      </div>

      <BodyMeasurementFilterChips
        range={p.range}
        defaultRange={p.defaultRange}
        onStartChange={p.changeStart}
        onEndChange={p.changeEnd}
        onRangeReset={p.resetRange}
        kioskOptions={p.kioskOptions}
        kiosksLoading={p.kiosksLoading}
        kioskIds={p.kioskIds}
        onToggleKiosk={p.toggleKiosk}
        onClearKiosks={() => p.setKioskIds([])}
        shotType={p.shotType}
        onShotTypeChange={p.setShotType}
        success={p.success}
        onSuccessChange={p.setSuccess}
        shooter={p.shooter}
        onShooterChange={p.setShooter}
        disabled={p.searchingByEventId}
        showReset={!p.filtersAreDefault}
        onReset={p.resetFilters}
      />

      <div className={`${shared.card} ${s.tableCard}`}>
        <BodyMeasurementTable
          loading={p.loading}
          errorMessage={p.errorMessage}
          emptyMessage={p.emptyMessage}
          rows={p.rows}
          selectedEventId={p.selectedEventId}
          onSelect={p.toggleRow}
          onThumbError={p.onThumbError}
        />
        <Pagination
          currentPage={p.page}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          totalCount={p.totalCount}
          unit='건'
        />
      </div>

      {row ? (
        <BodyMeasurementDetailPanel
          row={row}
          detail={p.detail}
          detailPending={p.detailPending}
          detailError={p.detailError}
          photoBroken={p.photoBroken}
          onPhotoError={p.onPhotoError}
          onCopyEventId={p.copyEventId}
          onDelete={p.openDelete}
          deleting={p.isDeleting}
        />
      ) : null}

      {p.showDeleteModal && row ? (
        <DeleteModal
          open={p.showDeleteModal}
          title='이 촬영 데이터를 삭제하시겠습니까?'
          target={`${fmtShotSecond(row.shotAt)} · ${kioskShortName(row.kioskName)}`}
          description='이 촬영의 사진·측정값·키·성별·국적이 함께 지워지고 되돌릴 수 없습니다.'
          loading={p.isDeleting}
          onConfirm={p.confirmDelete}
          onClose={() => p.setShowDeleteModal(false)}
        />
      ) : null}

      {p.notice ? (
        <div role='status' className={`${s.toast} ${p.notice.ok ? s.toastOk : s.toastErr}`}>
          {p.notice.text}
        </div>
      ) : null}
    </div>
  );
}
