// 리포트 다운로드(클라이언트 생성) — 확인용 임시 구현.
// PDF = 브라우저 인쇄(리포트 영역만 출력, @media print), DOC = Word 호환 HTML(.doc, 편집 가능).
// 정식 발행(서버 DOCX 템플릿 채움 + AI 분석 포함)은 P3에서 대체한다.

/** 현재 화면의 리포트 루트(data-report-root) */
function findReportNode(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-report-root]');
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** PDF 다운로드 — 인쇄 대화상자에서 'PDF로 저장' */
export function exportReportPdf(): boolean {
  if (!findReportNode()) return false;
  window.print();
  return true;
}

/** SVG(차트)를 PNG <img>로 치환 — Word가 SVG를 못 읽는 문제 대응 */
async function svgToPngDataUrl(svg: SVGSVGElement): Promise<string | null> {
  try {
    const rect = svg.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const cloned = svg.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('width', String(w));
    cloned.setAttribute('height', String(h));
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const xml = new XMLSerializer().serializeToString(cloned);
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg load fail'));
      img.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** 문서 전체 CSS 수집 — 모듈 해시 클래스가 클론 HTML에 그대로 남으므로 규칙을 함께 내보낸다 */
function collectCss(): string {
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) out.push(rule.cssText);
    } catch {
      // cross-origin 시트는 건너뜀
    }
  }
  return out.join('\n');
}

/** DOCX(편집용) 다운로드 — Word 호환 HTML(.doc) */
export async function exportReportDoc(): Promise<boolean> {
  const node = findReportNode();
  if (!node) return false;

  const clone = node.cloneNode(true) as HTMLElement;

  // 차트(SVG) → PNG 치환 (원본 노드 기준으로 크기 계산)
  const liveSvgs = Array.from(node.querySelectorAll('svg'));
  const cloneSvgs = Array.from(clone.querySelectorAll('svg'));
  for (let i = 0; i < cloneSvgs.length; i += 1) {
    const liveSvg = liveSvgs[i] as SVGSVGElement | undefined;
    const target = cloneSvgs[i];
    if (!liveSvg) { target.remove(); continue; }
    const dataUrl = await svgToPngDataUrl(liveSvg);
    if (dataUrl) {
      const img = document.createElement('img');
      img.src = dataUrl;
      const rect = liveSvg.getBoundingClientRect();
      img.width = Math.round(rect.width);
      img.height = Math.round(rect.height);
      target.replaceWith(img);
    } else {
      target.remove();
    }
  }

  const title = node.getAttribute('data-report-title') ?? '통계 리포트';
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">',
    `<head><meta charset="utf-8"><title>${title}</title><style>${collectCss()}</style></head>`,
    `<body>${clone.outerHTML}</body></html>`,
  ].join('');

  const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}_${todayStamp()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
