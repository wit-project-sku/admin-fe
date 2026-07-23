// 리포트 다운로드 — 화면 캡처 기반(html2canvas)이라 관리자 웹 화면과 픽셀 동일.
//   PDF  = 캡처를 A4 페이지로 잘라 jsPDF로 즉시 파일 다운로드(인쇄창 없음)
//   DOCX = 캡처 페이지 이미지를 docx 문서에 삽입(모양 동일 — 텍스트 편집형 정식 발행은 P3 서버 템플릿)
// 라이브러리는 다운로드 시점에만 동적 import(번들 분리).

/** 현재 화면의 리포트 루트(data-report-root) */
function findReportNode(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-report-root]');
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

const A4_RATIO = 297 / 210;

type CapturedPages = { title: string; pages: { dataUrl: string; wPx: number; hPx: number }[] };

/** 리포트를 고해상 캡처 후 A4 비율 페이지로 분할 */
async function captureReportPages(): Promise<CapturedPages | null> {
  const node = findReportNode();
  if (!node) return null;
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: document.documentElement.clientWidth,
  });
  const pageH = Math.floor(canvas.width * A4_RATIO);
  const pages: CapturedPages['pages'] = [];
  for (let y = 0; y < canvas.height; y += pageH) {
    const sliceH = Math.min(pageH, canvas.height - y);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    pages.push({ dataUrl: slice.toDataURL('image/png'), wPx: slice.width, hPx: sliceH });
  }
  const title = node.getAttribute('data-report-title') ?? '통계 리포트';
  return { title, pages };
}

/** PDF 다운로드 — A4 세로, 캡처 페이지를 그대로 삽입 후 즉시 저장 */
export async function exportReportPdf(): Promise<boolean> {
  const cap = await captureReportPages();
  if (!cap) return false;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  cap.pages.forEach((p, i) => {
    if (i > 0) doc.addPage();
    const hMm = (p.hPx / p.wPx) * 210;
    doc.addImage(p.dataUrl, 'PNG', 0, 0, 210, hMm);
  });
  doc.save(`${cap.title}_${todayStamp()}.pdf`);
  return true;
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** DOCX 다운로드 — 캡처 페이지 이미지를 A4 문서에 삽입(모양 = 관리자 웹과 동일) */
export async function exportReportDoc(): Promise<boolean> {
  const cap = await captureReportPages();
  if (!cap) return false;
  const { Document, ImageRun, Packer, PageOrientation, Paragraph } = await import('docx');

  // A4 콘텐츠 폭(96dpi px): 210mm − 좌우 여백 8mm×2 = 194mm ≈ 733px
  const CONTENT_W = 733;
  const children = cap.pages.map(
    (p) =>
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: dataUrlToUint8(p.dataUrl),
            transformation: { width: CONTENT_W, height: Math.round((p.hPx / p.wPx) * CONTENT_W) },
          }),
        ],
      }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, // A4 (twip)
            margin: { top: 454, bottom: 454, left: 454, right: 454 }, // 8mm
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cap.title}_${todayStamp()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
