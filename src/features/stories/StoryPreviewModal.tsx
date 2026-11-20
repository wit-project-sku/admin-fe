import { useEffect } from 'react';
import ImageZoom from '@components/common/ImageZoom';
import { InfoField, ModalContainer, ModalHeader } from '@modals/ModalElements';
import type { StoryDto, StoryStatus } from '../../hooks/story-api/storyTypes';
import s from '../lotte/Lotte.module.css';
import { formatDateTime, formatDuration } from '../lotte/lotteFormat';
import {
  STORY_KIOSK_WINDOW_DAYS,
  STORY_STATUS_BADGE,
  STORY_STATUS_LABEL,
  STORY_TYPE_LABEL,
  isPastKioskWindow,
} from './storyConfig';

type Props = {
  story: StoryDto;
  branchCode: string;
  busy: boolean;
  onClose: () => void;
  onChangeStatus: (story: StoryDto, next: Exclude<StoryStatus, 'PENDING'>) => void;
};

/** 사연 미리보기 — 글 전체, 사진(누르면 크게), 영상(재생). 아래에서 바로 승인·숨김. */
export function StoryPreviewModal({ story, branchCode, busy, onClose, onChangeStatus }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const expired = story.status === 'APPROVED' && isPastKioskWindow(story);

  return (
    <ModalContainer onClose={onClose} modalClassName={s.wideModal}>
      <ModalHeader title='사연 미리보기' onClose={onClose} />
      <div className={s.body}>
        {story.type === 'PHOTO' && story.mediaUrl ? (
          <ImageZoom src={story.mediaUrl} alt={story.title} title={story.title} className={s.media} />
        ) : null}
        {story.type === 'VIDEO' && story.mediaUrl ? (
          <video key={story.mediaUrl} src={story.mediaUrl} className={s.media} controls playsInline preload='metadata' />
        ) : null}

        <div>
          <div className={s.orderSectionTitle} style={{ fontSize: 16 }}>
            <span>{story.title}</span>
            <span className={STORY_STATUS_BADGE[story.status]}>{STORY_STATUS_LABEL[story.status]}</span>
          </div>
          {story.body?.trim() ? <p className={s.bodyText}>{story.body}</p> : null}
        </div>

        {expired ? (
          <p className={s.warnBox}>
            승인한 지 {STORY_KIOSK_WINDOW_DAYS}일이 지나 키오스크에서는 내려갔습니다(서버 기본 설정 기준). 다시 승인하면
            승인 시각이 새로 찍혀 다시 나옵니다.
          </p>
        ) : null}

        <div className={s.row}>
          <InfoField label='보낸 사람' value={story.displayName} />
          <InfoField label='지점' value={branchCode} />
        </div>
        <div className={s.row}>
          <InfoField
            label='종류'
            value={`${STORY_TYPE_LABEL[story.type]}${story.durationSeconds != null ? ` · ${formatDuration(story.durationSeconds)}` : ''}`}
          />
          <InfoField label='보낸 시각' value={formatDateTime(story.createdAt)} />
        </div>
        <div className={s.row}>
          <InfoField label='승인 시각' value={formatDateTime(story.approvedAt)} />
          <InfoField label='표시 순서' value={story.displayOrder != null ? `${story.displayOrder}번 고정` : '최근 승인 순'} />
        </div>
        <div className={s.row}>
          <InfoField label='마지막 처리' value={formatDateTime(story.reviewedAt)} />
          <InfoField label='처리한 관리자' value={story.reviewedBy != null ? `관리자 #${story.reviewedBy}` : '—'} />
        </div>
      </div>

      <div className={s.modalActions}>
        <span className={s.hint}>승인한 사연만 키오스크 &lsquo;오늘의 사연&rsquo;에 나옵니다.</span>
        <div className={s.modalActionsRight}>
          {story.status !== 'HIDDEN' ? (
            <button
              type='button'
              className={`${s.actionBtn} ${s.hideBtn}`}
              disabled={busy}
              onClick={() => onChangeStatus(story, 'HIDDEN')}
            >
              숨김
            </button>
          ) : null}
          {story.status !== 'APPROVED' ? (
            <button
              type='button'
              className={`${s.actionBtn} ${s.approveBtn}`}
              disabled={busy}
              onClick={() => onChangeStatus(story, 'APPROVED')}
            >
              승인
            </button>
          ) : null}
        </div>
      </div>
    </ModalContainer>
  );
}
