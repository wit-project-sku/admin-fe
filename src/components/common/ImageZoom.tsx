import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { ModalContainer, ModalHeader } from '../modal/ModalElements';
import s from './ImageZoom.module.css';

type Props = {
  /** 이미지 URL. 비어있으면 아무것도 렌더하지 않음. */
  src: string | null | undefined;
  alt?: string;
  /** 확대 미리보기 모달 제목. */
  title?: string;
  /** 썸네일 img 에 적용할 클래스(미지정 시 기본 썸네일 스타일). */
  className?: string;
  style?: CSSProperties;
};

/**
 * 클릭하면 원본 이미지를 확대 모달로 보여주는 썸네일.
 * 상세/목록 어디서든 `<ImageZoom src=... />` 로 재사용한다.
 * (행 클릭 상세보기 안에 있어도 이미지 클릭은 확대만 — 이벤트 전파 차단.)
 */
export default function ImageZoom({ src, alt = '', title = '이미지', className, style }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!src) return null;

  const openPreview = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button type='button' className={s.thumbBtn} onClick={openPreview} title='이미지 확대'>
        <img src={src} alt={alt} className={className ?? s.thumb} style={style} />
      </button>
      {open ? (
        <ModalContainer onClose={() => setOpen(false)} modalClassName={s.previewModal}>
          <ModalHeader title={title} onClose={() => setOpen(false)} />
          <div className={s.previewBody}>
            <img src={src} alt={alt} className={s.previewImg} />
          </div>
        </ModalContainer>
      ) : null}
    </>
  );
}
