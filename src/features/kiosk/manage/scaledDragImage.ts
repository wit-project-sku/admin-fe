import type { DragEvent } from 'react';

/**
 * 스케일(transform: scale)이 걸린 보드 안의 타일을 드래그할 때, 네이티브 드래그 고스트가
 * 조상의 scale 을 무시하고 원본(확대) 크기로 표시되는 문제를 보정한다.
 *
 * 화면에 보이는 크기(offsetWidth * scale)와 동일한 박스를 임시로 만들고, 그 안에 타일 클론을
 * scale 로 축소해 넣어 setDragImage 로 지정한다. (박스 자체가 축소 크기라 스냅샷이 정확히 일치)
 */
export function setScaledDragImage(e: DragEvent, node: HTMLElement, scale: number) {
  const w = node.offsetWidth * scale;
  const h = node.offsetHeight * scale;

  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.top = '-10000px';
  ghost.style.left = '-10000px';
  ghost.style.width = `${w}px`;
  ghost.style.height = `${h}px`;
  ghost.style.overflow = 'hidden';
  ghost.style.pointerEvents = 'none';
  ghost.style.margin = '0';

  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  clone.style.transform = `scale(${scale})`;
  clone.style.transformOrigin = 'top left';
  // 원본 요소의 드래그중 흐림(opacity) 상태가 클론에 섞이지 않도록 초기화
  clone.style.opacity = '1';
  ghost.appendChild(clone);

  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, w / 2, h / 2);
  // 스냅샷은 동기적으로 잡히므로 다음 틱에 정리
  window.setTimeout(() => {
    document.body.removeChild(ghost);
  }, 0);
}
