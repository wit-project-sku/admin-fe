import shared from '@commons/shared.module.css';
import s from '@/features/outfits/kioskCategory/KioskOutfitCategoryTable.module.css';
import { KioskOutfitCategoryTable } from '@/features/outfits/kioskCategory/KioskOutfitCategoryTable';
import { useKioskOutfitCategoryPage } from '@/features/outfits/kioskCategory/useKioskOutfitCategoryPage';

export default function KioskOutfitCategoryPage() {
  const m = useKioskOutfitCategoryPage();

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>키오스크별 의상 카테고리</h1>
          <p className={shared.pageSubtitle}>지점마다 탭을 감추거나 표시 이름을 바꿉니다</p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={shared.cardHead}>
          <div className={s.toolbar}>
            <label className={s.selectLabel} htmlFor='kiosk-select'>
              키오스크
            </label>
            <select
              id='kiosk-select'
              className={s.select}
              value={m.kioskId ?? ''}
              onChange={(e) => m.setKioskId(e.target.value ? Number(e.target.value) : null)}
              disabled={m.kiosksLoading}
            >
              {m.kiosks.length === 0 ? <option value=''>불러오는 중...</option> : null}
              {m.kiosks.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            {m.kioskId != null && !m.isLoading ? (
              <span className={s.summary}>
                노출 {m.visibleCount} / {m.settings.length} · 덮어쓴 설정 {m.overrideCount}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ padding: '0 20px 4px' }}>
          <p className={s.hint}>
            탭 노출은 저장값이 아니라 <b>파생값</b>입니다 — 그 키오스크에 배정된 유효 의상이 1벌 이상인
            카테고리만 나옵니다. 그래서 <b>배정 의상 0벌이면 숨김과 무관하게 탭이 보이지 않습니다.</b> 여기서
            거는 설정은 그 규칙에 얹는 <b>예외</b>이고, 되돌리기를 누르면 예외가 사라집니다. 카테고리 코드는
            앱이 의상 필터로 쓰는 값이라 여기서 바꿀 수 없습니다.
          </p>

          {m.notice ? (
            <p className={s.notice} role='status' aria-live='polite'>
              {m.notice}
            </p>
          ) : null}
          {m.errorText ? (
            <p className={s.error} role='alert'>
              {m.errorText}
            </p>
          ) : null}
        </div>

        <KioskOutfitCategoryTable
          loading={m.isLoading}
          errorMessage={m.errorMessage}
          rows={m.settings}
          kioskSelected={m.kioskId != null}
          editingCategoryId={m.editingCategoryId}
          draft={m.draft}
          busy={m.busy}
          onEdit={m.openEditor}
          onCancelEdit={m.closeEditor}
          onChangeDraft={m.changeDraft}
          onSaveLabels={m.saveLabels}
          onToggleHidden={m.toggleHidden}
          onReset={m.resetRow}
        />
      </div>
    </div>
  );
}
