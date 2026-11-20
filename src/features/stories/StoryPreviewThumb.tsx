import type { StoryDto } from '../../hooks/story-api/storyTypes';
import s from '../lotte/Lotte.module.css';
import { formatDuration } from '../lotte/lotteFormat';

/** 목록·순서 창의 작은 미리보기 — 사진은 그림, 영상은 첫 장면 + 길이, 글은 앞부분. */
export function StoryPreviewThumb({ story }: { story: Pick<StoryDto, 'type' | 'mediaUrl' | 'body' | 'title' | 'durationSeconds'> }) {
  if (story.type === 'PHOTO' && story.mediaUrl) {
    return (
      <span className={s.preview}>
        <img src={story.mediaUrl} alt='' loading='lazy' />
      </span>
    );
  }
  if (story.type === 'VIDEO' && story.mediaUrl) {
    return (
      <span className={s.preview}>
        {/* #t=0.1 — 첫 장면을 포스터로 쓴다(재생은 미리보기 창에서). */}
        <video src={`${story.mediaUrl}#t=0.1`} muted playsInline preload='metadata' />
        <span className={s.playMark} aria-hidden>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
            <polygon points='6 4 20 12 6 20 6 4' />
          </svg>
        </span>
        {story.durationSeconds != null ? (
          <span className={s.previewDuration}>{formatDuration(story.durationSeconds)}</span>
        ) : null}
      </span>
    );
  }
  return (
    <span className={s.preview}>
      <span className={s.previewText}>{story.body?.trim() || story.title}</span>
    </span>
  );
}
