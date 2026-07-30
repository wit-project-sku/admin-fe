// 배너 상세 — 행 클릭 시 연다. 노출 키오스크가 100대로 늘어나도 여기서 그룹별로 한눈에 본다.
import { useEffect } from 'react';

import ImageZoom from '@components/common/ImageZoom';
import {
  BANNER_STATUS_LABEL,
  formatPeriod,
  type BannerDto,
} from '@/hooks/kiosk-api/bannerTypes';
import type { ParsedKiosk } from './bannerKiosk';
import s from './BannerManage.module.css';

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: s.bActive,
  SCHEDULED: s.bScheduled,
  EXPIRED: s.bExpired,
};

type Props = {
  banner: BannerDto;
  byId: Map<number, ParsedKiosk>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function BannerDetailModal({
  banner,
  byId,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 노출 키오스크를 그룹(인사동·오산시…)으로 묶어 보여 준다. 대수가 많아져도 훑어보기 쉽다.
  const grouped = new Map<string, ParsedKiosk[]>();
  for (const id of banner.kioskIds) {
    const k = byId.get(id);
    const key = k?.group || '기타';
    grouped.set(key, [...(grouped.get(key) ?? []), k ?? { id, code: '', group: '', name: `#${id}`, raw: `#${id}` }]);
  }

  return (
    <div className={s.dim} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <span>배너 상세</span>
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={s.modalBody}>
          {/* 이미지 클릭 시 원본 확대 */}
          <div className={s.detailImgWrap}>
            <ImageZoom
              src={banner.imageUrl}
              alt={`배너 ${banner.id}`}
              title={`배너 #${banner.id}`}
              className={s.detailImg}
            />
          </div>

          <div className={s.detailGrid}>
            <span className={s.detailKey}>상태</span>
            <span>
              <span className={`${s.badge} ${STATUS_CLASS[banner.status] ?? ''}`}>
                {BANNER_STATUS_LABEL[banner.status]}
              </span>
              {banner.targetType === 'ALL' ? (
                <span className={`${s.badge} ${s.bAll}`} style={{ marginLeft: 6 }}>
                  전체 키오스크
                </span>
              ) : null}
            </span>

            <span className={s.detailKey}>노출 기간</span>
            <span>{formatPeriod(banner.startDate, banner.endDate)}</span>

            <span className={s.detailKey}>노출 대상</span>
            <span>
              <b>{banner.kioskCount}곳</b>
              {banner.targetType === 'ALL' ? (
                <span className={s.checkCode}> · 앞으로 추가되는 키오스크에도 자동 노출</span>
              ) : null}
            </span>

            <span className={s.detailKey}>키오스크</span>
            <div className={s.kioskGroups}>
              {banner.kioskCount === 0 ? (
                <span className={s.checkCode}>배정된 키오스크가 없습니다.</span>
              ) : (
                [...grouped.entries()].map(([group, list]) => (
                  <div className={s.kioskGroup} key={group}>
                    <span className={s.kioskGroupName}>{group}</span>
                    <div className={s.kioskChips}>
                      {list.map((k) => (
                        <span className={s.kioskChip} key={k.id}>
                          {k.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={s.warn}>
            노출 <b>순서</b>는 키오스크마다 다릅니다 — 순서 변경은 <b>키오스크별 노출</b> 탭에서 하세요.
          </div>
        </div>

        <div className={s.modalFoot}>
          <button
            type="button"
            className={s.primaryBtn}
            style={{ marginRight: 'auto', marginLeft: 0 }}
            onClick={onEdit}
          >
            수정
          </button>
          <button type="button" className={`${s.ghostBtn} ${s.deleteBtn}`} onClick={onDelete}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
