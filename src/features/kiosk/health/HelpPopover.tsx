import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';

import s from './KioskHealth.module.css';

type Props = { label: string; children: ReactNode };

const WIDTH = 300;

/**
 * (?) 버튼을 누르면 설명을 띄우는 작은 말풍선. 바깥 클릭·Esc·스크롤로 닫힌다.
 * 표 머리(가로 스크롤 영역) 안에서 쓰여서 잘리지 않도록 화면 기준(fixed)으로 위치를 잡는다.
 */
export function HelpPopover({ label, children }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!boxRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btnRef.current!.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left + r.width / 2 - WIDTH / 2, window.innerWidth - WIDTH - 8));
    setPos({ top: r.bottom + 6, left });
  };

  return (
    <>
      <button
        ref={btnRef}
        type='button'
        className={s.helpBtn}
        aria-label={`${label} 도움말`}
        aria-expanded={!!pos}
        onClick={toggle}
      >
        <CircleHelp size={14} />
      </button>
      {pos && (
        <div
          ref={boxRef}
          role='dialog'
          aria-label={`${label} 도움말`}
          className={s.helpBox}
          style={{ ...pos, width: WIDTH }}
        >
          <strong className={s.helpTitle}>{label}</strong>
          {children}
        </div>
      )}
    </>
  );
}
