// 광고 관리 — 키오스크·앱 공통 순서 하나. 목록은 페이지 없이 전체(순서 편집 화면이라).
// 순서는 끌어서(또는 ↑↓) 바꾼 뒤 '순서 저장'으로 한 번에 보낸다. 서버는 삭제 안 된 광고 전체와 같은 집합만 받으므로
// 상태·검색 필터를 건 동안에는 순서를 바꾸지 않는다.
import { useCallback, useMemo, useRef, useState } from 'react';

import shared from '@commons/shared.module.css';
import SearchBar from '@components/common/SearchBar';
import FilterGroup from '@components/common/FilterGroup';
import RegisterBtn from '@components/common/RegisterBtn';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import DeleteModal from '@modals/DeleteModal';
import { useAdList, useAdMutations } from '@/hooks/ad-api/useAds';
import { AD_STATUS_LABEL, regionLabel, type AdSummaryDto } from '@/hooks/ad-api/adTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { AdFormModal } from '@/features/wits/ads/AdFormModal';
import { AD_STATUS_BADGE } from '@/features/wits/witsBadges';
import { formatDate } from '@/features/wits/witsFormat';
import s from '@/features/wits/Wits.module.css';

const COL_COUNT = 8;

const STATUS_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'ACTIVE', label: '노출 중' },
  { key: 'SCHEDULED', label: '예약' },
  { key: 'PAUSED', label: '일시 중지' },
  { key: 'EXPIRED', label: '종료' },
];

type FormState = { mode: 'create' | 'edit'; id: number | null } | null;

/** 저장 안 한 순서(id)를 최신 목록에 입힌다. 그사이 사라진 광고는 빠지고 새 광고는 뒤에 붙는다. */
function applyOrder(ads: AdSummaryDto[], ids: number[] | null): AdSummaryDto[] {
  if (!ids) return ads;
  const byId = new Map(ads.map((a) => [a.id, a]));
  const picked = ids.map((id) => byId.get(id)).filter((a): a is AdSummaryDto => a != null);
  const seen = new Set(ids);
  return [...picked, ...ads.filter((a) => !seen.has(a.id))];
}

export default function AdManagePage() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<AdSummaryDto | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const { ads, isPending, isError } = useAdList();
  const { deleteAsync, reorderAsync, isDeleting, isReordering } = useAdMutations();

  // null = 서버 순서 그대로. 바꾸기 시작하면 화면 순서(id)를 따로 쥔다 — 행 내용은 늘 최신 목록에서 읽는다.
  const [draftIds, setDraftIds] = useState<number[] | null>(null);
  const ordered = useMemo(() => applyOrder(ads, draftIds), [ads, draftIds]);
  const dirty = draftIds != null;

  // 드래그 소스는 ref 로 유지한다(state 로 두면 stale-closure 로 드롭이 누락된다).
  const dragFrom = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const keyword = search.trim().toLowerCase();
  const filtering = status !== 'ALL' || keyword !== '';
  const rows = useMemo(
    () =>
      ordered.filter(
        (a) =>
          (status === 'ALL' || a.status === status) &&
          (!keyword ||
            a.title.toLowerCase().includes(keyword) ||
            a.advertiserName.toLowerCase().includes(keyword)),
      ),
    [ordered, status, keyword],
  );
  const canReorder = !filtering && ordered.length > 1;

  const flash = useCallback((text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const move = (from: number, to: number) => {
    if (!canReorder || from === to || to < 0 || to >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraftIds(next.map((a) => a.id));
  };

  const clearDrag = () => {
    dragFrom.current = null;
    setDragIdx(null);
    setOverIdx(null);
  };

  const saveOrder = async () => {
    if (!dirty) return;
    try {
      await reorderAsync(ordered.map((a) => a.id));
      setDraftIds(null);
      flash('광고 순서를 저장했습니다.');
    } catch (err) {
      flash(apiErrorMessage(err, '순서 저장에 실패했습니다. 새로고침 후 다시 시도해 주세요.'), false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAsync(deleting.id);
      setDeleting(null);
            flash('광고를 삭제했습니다.');
    } catch (err) {
      setDeleting(null);
      flash(apiErrorMessage(err, '삭제에 실패했습니다.'), false);
    }
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>광고 관리</h1>
          <p className={shared.pageSubtitle}>키오스크와 WITS 앱에 띄울 광고를 등록하고 순서를 정합니다.</p>
        </div>
        <RegisterBtn title='광고 등록' onClick={() => setForm({ mode: 'create', id: null })} />
      </div>

      {notice ? <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div> : null}

      <div className={shared.card}>
        <div className={s.cardHead}>
          <FilterGroup label='상태' filters={STATUS_FILTERS} current={status} onFilterChange={setStatus} />
          <SearchBar value={search} onChange={setSearch} placeholder='광고 제목·광고주 검색' minWidth='260px' />
        </div>

        {ordered.length > 0 ? (
          <div style={{ padding: '14px 20px 0' }}>
            <div className={`${s.orderBar} ${dirty ? s.orderBarDirty : ''}`} style={{ marginBottom: 14 }}>
              <span>
                {dirty
                  ? '순서를 바꿨습니다. 저장해야 키오스크·앱에 반영됩니다.'
                  : filtering
                    ? '필터·검색을 풀면 순서를 바꿀 수 있습니다.'
                    : '행을 끌거나 ↑↓ 로 순서를 바꿀 수 있습니다. 키오스크와 앱이 같은 순서를 씁니다.'}
              </span>
              <span className={s.orderBarSpacer} />
              {dirty ? (
                <>
                  <button type='button' className={s.textBtn} onClick={() => setDraftIds(null)} disabled={isReordering}>
                    되돌리기
                  </button>
                  <button type='button' className={shared.btnPrimary} onClick={saveOrder} disabled={isReordering}>
                    {isReordering ? '저장 중...' : '순서 저장'}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={shared.tableResponsive}>
          <table className={`${shared.table} ${s.listTable}`}>
            <thead className={shared.thead}>
              <tr>
                <th className={shared.th} style={{ width: 70 }}>
                  순서
                </th>
                <th className={shared.th}>광고 제목</th>
                <th className={shared.th}>광고주</th>
                <th className={shared.th}>연락처</th>
                <th className={shared.th}>기간</th>
                <th className={shared.th}>노출 위치</th>
                <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                <th className={`${shared.th} ${shared.thRight}`} style={{ width: 170 }}>
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`ad-skeleton-${idx}`} className={shared.skeletonRow}>
                    {Array.from({ length: COL_COUNT }).map((__, col) => (
                      <td key={col} className={shared.td}>
                        <span className={shared.skeletonLine} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={COL_COUNT} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                    광고 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                    {filtering ? '조건에 맞는 광고가 없습니다.' : '등록된 광고가 없습니다.'}
                  </td>
                </tr>
              ) : (
                rows.map((ad) => {
                  // 필터가 없을 때만 순서를 바꾸므로 이때 rows 와 ordered 의 인덱스가 같다.
                  const i = ordered.indexOf(ad);
                  const dropCls =
                    canReorder && overIdx === i && dragIdx != null && dragIdx !== i
                      ? dragIdx < i
                        ? s.dropAfter
                        : s.dropBefore
                      : '';
                  return (
                    <tr
                      key={ad.id}
                      className={`${shared.tr} ${canReorder ? s.draggable : ''} ${dragIdx === i ? s.dragging : ''} ${dropCls}`}
                      draggable={canReorder}
                      onDragStart={(e) => {
                        if (!canReorder) return;
                        dragFrom.current = i;
                        setDragIdx(i);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        if (!canReorder) return;
                        e.preventDefault(); // 이걸 해야 drop 이 발생한다
                        e.dataTransfer.dropEffect = 'move';
                        if (overIdx !== i) setOverIdx(i);
                      }}
                      onDrop={(e) => {
                        if (!canReorder) return;
                        e.preventDefault();
                        const from = dragFrom.current;
                        clearDrag();
                        if (from != null) move(from, i);
                      }}
                      onDragEnd={clearDrag}
                    >
                      <td className={shared.td}>
                        <span className={s.handle} title={canReorder ? '끌어서 순서 변경' : undefined}>
                          {canReorder ? '⠿' : null}
                          <span className={s.order}>{i + 1}</span>
                        </span>
                      </td>
                      <td className={`${shared.td} ${shared.tdBold}`}>
                        <div className={s.ellipsis} title={ad.title}>
                          {ad.title}
                        </div>
                      </td>
                      <td className={shared.td}>{ad.advertiserName}</td>
                      <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>{ad.advertiserPhoneMasked || '-'}</td>
                      <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>
                        {formatDate(ad.startDate)} ~ {formatDate(ad.endDate)}
                      </td>
                      <td className={shared.td}>
                        <div className={s.chips}>
                          {ad.showOnKiosk ? <span className={`${s.chip} ${s.chipStrong}`}>키오스크</span> : null}
                          {ad.showOnApp ? <span className={`${s.chip} ${s.chipStrong}`}>앱</span> : null}
                          {ad.showOnKiosk
                            ? (ad.regions ?? []).map((r) => (
                                <span key={r} className={s.chip}>
                                  {regionLabel(r)}
                                </span>
                              ))
                            : null}
                        </div>
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        <span className={`${shared.badge} ${AD_STATUS_BADGE[ad.status] ?? shared.badgeGray}`}>
                          {AD_STATUS_LABEL[ad.status] ?? ad.status}
                        </span>
                      </td>
                      <td className={shared.td}>
                        <div className={shared.actionGroup}>
                          {canReorder ? (
                            <>
                              <button
                                type='button'
                                className={s.textBtn}
                                onClick={() => move(i, i - 1)}
                                disabled={i === 0}
                                title='위로'
                              >
                                ↑
                              </button>
                              <button
                                type='button'
                                className={s.textBtn}
                                onClick={() => move(i, i + 1)}
                                disabled={i === ordered.length - 1}
                                title='아래로'
                              >
                                ↓
                              </button>
                            </>
                          ) : null}
                          <EditBtn onClick={() => setForm({ mode: 'edit', id: ad.id })} />
                          <DeleteBtn onClick={() => setDeleting(ad)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={s.hint}>
        · 키오스크에는 고른 <b>지점</b>에만, 앱에는 전체에 노출됩니다. <b>노출 중</b>(기간 안·일시 중지 아님)인 광고만 이 순서대로 보입니다.
        <br />· 연락처는 목록에서 가려 보입니다. 수정 창에서 전체 번호를 확인할 수 있습니다.
      </div>

      {form ? (
        <AdFormModal
          mode={form.mode}
          adId={form.id}
          onClose={() => setForm(null)}
          onSuccess={(msg) => {
            setForm(null);
            flash(msg);
          }}
        />
      ) : null}

      {deleting ? (
        <DeleteModal
          open
          title='광고를 삭제하시겠습니까?'
          target={deleting.title}
          description='키오스크와 앱에서 바로 내려갑니다.'
          loading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
