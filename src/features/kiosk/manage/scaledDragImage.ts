import type { DragEvent } from 'react';

/** node 의 크기(cqw/cqh)를 해석하는 가장 가까운 컨테이너쿼리 조상(container-type 지정)을 찾는다. */
function findQueryContainer(node: HTMLElement): HTMLElement | null {
  let el = node.parentElement;
  while (el) {
    const ct = getComputedStyle(el).containerType;
    if (ct && ct !== 'normal') return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * 스케일(transform: scale)이 걸린 보드 안의 타일을 드래그할 때, 네이티브 드래그 고스트가
 * 화면 표시 크기와 다르게 뜨는 문제를 보정한다.
 *
 * 타일의 크기·글자 크기는 그리드 트랙과 컨테이너쿼리 단위(cqw/cqh, .board 기준)로 정해진다.
 * 클론을 그대로 떼어내면 그 컨텍스트가 사라져 크기가 붕괴(너무 작게)한다. 그래서
 *   1) 원본 컨테이너(.board)와 같은 박스(size + container-type)를 재현해 cqw/cqh 가 동일하게 해석되게 하고,
 *   2) 타일 자체 크기는 실측 픽셀(offsetWidth/Height)로 고정하고,
 *   3) 실제 화면 렌더 크기(getBoundingClientRect — 모든 조상 scale 반영)로 축소한다.
 * 덕분에 SCALE 상수/레이아웃이 바뀌어도 고스트가 화면상 타일과 정확히 일치한다.
 */
export function setScaledDragImage(e: DragEvent, node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const scale = node.offsetWidth > 0 ? w / node.offsetWidth : 1;

  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.top = '-10000px';
  ghost.style.left = '-10000px';
  ghost.style.width = `${w}px`;
  ghost.style.height = `${h}px`;
  ghost.style.overflow = 'hidden';
  ghost.style.pointerEvents = 'none';
  ghost.style.margin = '0';

  // 원본 컨테이너쿼리 조상과 같은 박스를 재현해 클론 내부 cqw/cqh 가 동일하게 해석되게 한다.
  const container = findQueryContainer(node);
  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.top = '0';
  host.style.left = '0';
  host.style.transformOrigin = 'top left';
  host.style.transform = `scale(${scale})`;
  if (container) {
    host.style.width = `${container.offsetWidth}px`;
    host.style.height = `${container.offsetHeight}px`;
    host.style.containerType = 'size';
  }

  const clone = node.cloneNode(true) as HTMLElement;
  // 타일 크기는 그리드 트랙에서 오므로, 그리드 밖 클론에는 실측 픽셀로 못박는다.
  clone.style.boxSizing = 'border-box';
  clone.style.width = `${node.offsetWidth}px`;
  clone.style.height = `${node.offsetHeight}px`;
  clone.style.margin = '0';
  // 원본 요소의 드래그중 흐림(opacity) 상태가 클론에 섞이지 않도록 초기화
  clone.style.opacity = '1';
  host.appendChild(clone);
  ghost.appendChild(host);

  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, w / 2, h / 2);
  // 스냅샷은 동기적으로 잡히므로 다음 틱에 정리
  window.setTimeout(() => {
    document.body.removeChild(ghost);
  }, 0);
}
