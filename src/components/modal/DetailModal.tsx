import { useEffect, type ReactNode } from 'react';
import { ModalContainer, ModalHeader } from './ModalElements';
import ImageZoom from '../common/ImageZoom';

export type DetailField = {
  label: string;
  value?: ReactNode;
  /** 한 줄 전체 폭으로 표시(긴 텍스트/설명용). */
  full?: boolean;
};

export type DetailImage = { src: string; title?: string };

type Props = {
  open: boolean;
  title: string;
  fields: DetailField[];
  /** 상세에 표시할 이미지들(클릭 시 ImageZoom 으로 확대). */
  images?: DetailImage[];
  onClose: () => void;
};

/**
 * 읽기전용 상세보기 모달. 각 목록 페이지에서 행을 클릭하면 행 데이터를
 * {label, value} 배열로 매핑해 넘긴다. 이미지는 클릭하면 확대된다.
 */
export default function DetailModal({ open, title, fields, images, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validImages = (images ?? []).filter((im) => im.src);

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <div
        style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px 20px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {fields.map((f, i) => (
          <div
            key={`${f.label}-${i}`}
            style={{ gridColumn: f.full ? '1 / -1' : 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{f.label}</span>
            <span style={{ fontSize: '14px', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {f.value === null || f.value === undefined || f.value === '' ? '—' : f.value}
            </span>
          </div>
        ))}
        {validImages.length > 0 ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>이미지</span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {validImages.map((im, i) => (
                <ImageZoom
                  key={i}
                  src={im.src}
                  title={im.title ?? title}
                  style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ModalContainer>
  );
}
