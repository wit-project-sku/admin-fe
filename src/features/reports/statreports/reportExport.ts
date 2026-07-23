// 리포트 다운로드 — 페이지 걸침 원천 봉쇄(뷰의 data-report-page 그룹 = 문서 1페이지).
//   PDF  = 페이지 그룹별 화면 캡처(html2canvas) → A4에 맞춰(넘치면 축소) 1그룹 1페이지로 저장
//   DOCX = DOM을 실제 문서 요소로 변환(제목/문단/표 = 편집 가능 텍스트, 차트·사진만 이미지)
//          그룹 사이 페이지 나눔 — Word에서 자유롭게 수정 가능
// 라이브러리는 다운로드 시점에만 동적 import(번들 분리).

/** 현재 화면의 리포트 루트/페이지 그룹 */
function findReportNode(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-report-root]');
}

function findPages(root: HTMLElement): HTMLElement[] {
  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-report-page]'));
  return pages.length > 0 ? pages : [root];
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/* ═══════════ PDF — 그룹별 캡처, A4 1그룹 1페이지 ═══════════ */

export async function exportReportPdf(): Promise<boolean> {
  const root = findReportNode();
  if (!root) return false;
  const title = root.getAttribute('data-report-title') ?? '통계 리포트';
  const pages = findPages(root);

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const MARGIN = 8; // mm
  const CONTENT_W = 210 - MARGIN * 2;
  const CONTENT_H = 297 - MARGIN * 2;

  for (let i = 0; i < pages.length; i += 1) {
    // 뷰포트가 좁거나 숨겨진 환경에서도 폭이 0으로 잡히지 않도록 명시
    const capW = pages[i].offsetWidth || root.offsetWidth || 780;
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      width: capW,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(1280, capW),
    });
    if (canvas.width === 0 || canvas.height === 0) throw new Error('캡처 크기가 0입니다(창이 표시된 상태에서 다시 시도)');
    if (i > 0) doc.addPage();
    // 페이지 콘텐츠를 A4 안에 맞춤 — 세로가 넘치면 비율 축소(걸침 원천 봉쇄)
    const ratio = canvas.height / canvas.width;
    let wMm = CONTENT_W;
    let hMm = wMm * ratio;
    if (hMm > CONTENT_H) {
      hMm = CONTENT_H;
      wMm = hMm / ratio;
    }
    const x = MARGIN + (CONTENT_W - wMm) / 2;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, MARGIN, wMm, hMm);
  }

  doc.save(`${title}_${todayStamp()}.pdf`);
  return true;
}

/* ═══════════ DOCX — DOM → 편집 가능한 문서 요소 변환 ═══════════ */

type DocxModule = typeof import('docx');

const INK = '0f172a';
const INK2 = '475569';
const MUT = '64748b';
const ACCENT = '2563eb';
const RED = 'b91c1c';
const TBL_W = 9700; // A4 - 여백 (DXA)

function cls(el: Element, name: string): boolean {
  return typeof el.className === 'string' && el.className.includes(name);
}

function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** SVG → PNG dataURL (차트) */
async function svgToPng(svg: SVGSVGElement): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const rect = svg.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const cloned = svg.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('width', String(w));
    cloned.setAttribute('height', String(h));
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const xml = new XMLSerializer().serializeToString(cloned);
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('svg'));
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
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
    return { dataUrl: canvas.toDataURL('image/png'), w, h };
  } catch {
    return null;
  }
}

/** <img>(의상 사진) → PNG dataURL — CORS 실패 시 null */
async function imgToPng(src: string, w: number, h: number): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('img'));
      img.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(',')[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** 변환기 본체 — 페이지 그룹 하나를 docx 요소 배열로 */
async function convertPage(dx: DocxModule, page: HTMLElement): Promise<(InstanceType<DocxModule['Paragraph']> | InstanceType<DocxModule['Table']>)[]> {
  const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, ImageRun } = dx;
  const out: (InstanceType<DocxModule['Paragraph']> | InstanceType<DocxModule['Table']>)[] = [];

  const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const thin = { style: BorderStyle.SINGLE, size: 4, color: 'e6ebf1' };

  const run = (t: string, o: Record<string, unknown> = {}) => new TextRun({ text: t, font: 'Apple SD Gothic Neo', size: 18, color: INK2, ...o });
  const para = (runs: InstanceType<DocxModule['TextRun']>[], o: Record<string, unknown> = {}) => new Paragraph({ children: runs, spacing: { after: 100 }, ...o });

  const chartImage = async (svg: SVGSVGElement, width: number) => {
    const png = await svgToPng(svg);
    if (!png) return null;
    return new ImageRun({ type: 'png', data: dataUrlToUint8(png.dataUrl), transformation: { width, height: Math.round((png.h / png.w) * width) } });
  };

  /** HTML 표 → docx 표(편집 가능) */
  const convertTable = (tb: HTMLTableElement) => {
    const rowsHtml = Array.from(tb.rows);
    if (rowsHtml.length === 0) return null;
    const nCols = Math.max(...rowsHtml.map((r) => r.cells.length));
    const colW = Math.floor(TBL_W / nCols);
    const rows = rowsHtml.map((tr) => {
      const isHead = tr.cells[0]?.tagName === 'TH';
      const isSum = cls(tr, 'sumRow');
      return new TableRow({
        tableHeader: isHead,
        cantSplit: true,
        children: Array.from(tr.cells).map((cell) => {
          const isLeft = cls(cell, 'tdL') || (cell as HTMLElement).style.textAlign === 'left';
          const bold = isHead || isSum || cls(cell, 'tdB') || cell.querySelector('b') != null;
          const t = text(cell);
          const isDown = t.startsWith('▼');
          const isUp = t.startsWith('▲');
          return new TableCell({
            width: { size: colW, type: WidthType.DXA },
            shading: isHead ? { type: ShadingType.CLEAR, fill: INK } : isSum ? { type: ShadingType.CLEAR, fill: 'f6f8fb' } : undefined,
            margins: { top: 60, bottom: 60, left: 70, right: 70 },
            borders: { top: thin, bottom: thin, left: noB, right: noB },
            children: [new Paragraph({
              alignment: isLeft || (isHead && isLeft) ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: [run(t, { bold, size: isHead ? 17 : 17, color: isHead ? 'FFFFFF' : isDown ? RED : isUp ? ACCENT : bold ? INK : INK2 })],
            })],
          });
        }),
      });
    });
    return new Table({ width: { size: TBL_W, type: WidthType.DXA }, columnWidths: Array(nCols).fill(colW), rows });
  };

  /** KPI 그리드 → 5열 표 */
  const convertKpis = (kpis: HTMLElement) => {
    const boxes = Array.from(kpis.children) as HTMLElement[];
    const w = Math.floor(TBL_W / Math.max(1, boxes.length));
    const box = { top: thin, bottom: thin, left: thin, right: thin };
    return new Table({
      width: { size: TBL_W, type: WidthType.DXA },
      columnWidths: boxes.map(() => w),
      rows: [new TableRow({
        cantSplit: true,
        children: boxes.map((b, i) => {
          const label = text(b.querySelector('[class*="kpiLabel"]'));
          const value = text(b.querySelector('[class*="kpiValue"]'));
          const badge = text(b.querySelector('[class*="badge"]'));
          const hint = text(b.querySelector('[class*="kpiHint"]'));
          const badgeDown = (b.querySelector('[class*="badgeDown"]') != null);
          const children = [
            para([run(label, { size: 14 })], { spacing: { after: 40 } }),
            para([run(value, { size: 22, bold: true, color: INK })], { spacing: { after: 40 } }),
          ];
          if (badge) children.push(para([run(badge, { size: 13, bold: true, color: badgeDown ? RED : ACCENT })], { spacing: { after: 20 } }));
          if (hint) children.push(para([run(hint, { size: 13, color: MUT })], { spacing: { after: 20 } }));
          return new TableCell({
            width: { size: w, type: WidthType.DXA },
            borders: i === 0 ? { top: { style: BorderStyle.SINGLE, size: 12, color: INK }, bottom: { style: BorderStyle.SINGLE, size: 12, color: INK }, left: { style: BorderStyle.SINGLE, size: 12, color: INK }, right: { style: BorderStyle.SINGLE, size: 12, color: INK } } : box,
            margins: { top: 90, bottom: 90, left: 90, right: 90 },
            children,
          });
        }),
      })],
    });
  };

  /** 의상 카드 갤러리 → 5열 표(사진 이미지 + 텍스트) */
  const convertGallery = async (gal: HTMLElement) => {
    const cards = Array.from(gal.children) as HTMLElement[];
    const w = Math.floor(TBL_W / 5);
    const cells: InstanceType<DocxModule['TableCell']>[] = [];
    for (const card of cards) {
      const name = text(card.querySelector('[class*="gcardName"]'));
      const cat = text(card.querySelector('[class*="gcardCat"]'));
      const foot = text(card.querySelector('[class*="gcardFooter"]'));
      const rank = text(card.querySelector('[class*="gcardRank"]'));
      const imgEl = card.querySelector('img');
      const children: InstanceType<DocxModule['Paragraph']>[] = [];
      if (imgEl) {
        const png = await imgToPng(imgEl.src, 180, 135);
        if (png) children.push(new Paragraph({ children: [new ImageRun({ type: 'png', data: dataUrlToUint8(png), transformation: { width: 118, height: 88 } })], spacing: { after: 40 } }));
      }
      children.push(para([run(`${rank ? `${rank}. ` : ''}${name}`, { size: 16, bold: true, color: INK })], { spacing: { after: 20 } }));
      if (cat) children.push(para([run(cat, { size: 14, bold: true, color: ACCENT })], { spacing: { after: 20 } }));
      if (foot) children.push(para([run(foot, { size: 13, color: MUT })], { spacing: { after: 20 } }));
      cells.push(new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: thin, bottom: thin, left: thin, right: thin }, margins: { top: 70, bottom: 70, left: 70, right: 70 }, children }));
    }
    const rows: InstanceType<DocxModule['TableRow']>[] = [];
    for (let i = 0; i < cells.length; i += 5) {
      const rowCells = cells.slice(i, i + 5);
      while (rowCells.length < 5) rowCells.push(new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: noB, bottom: noB, left: noB, right: noB }, children: [new Paragraph({ children: [] })] }));
      rows.push(new TableRow({ cantSplit: true, children: rowCells }));
    }
    return new Table({ width: { size: TBL_W, type: WidthType.DXA }, columnWidths: Array(5).fill(w), rows });
  };

  /** row2(차트 2개) → 2열 표 */
  const convertChartsRow = async (row: HTMLElement) => {
    const chartCards = Array.from(row.querySelectorAll<HTMLElement>('[class*="chartCard"]'));
    const w = Math.floor(TBL_W / 2);
    const cellsArr: InstanceType<DocxModule['TableCell']>[] = [];
    for (const card of chartCards.slice(0, 2)) {
      const title = text(card.querySelector('h4'));
      const svg = card.querySelector('svg');
      const children: InstanceType<DocxModule['Paragraph']>[] = [para([run(title, { size: 15, bold: true, color: INK2 })], { spacing: { after: 40 } })];
      if (svg) {
        const img = await chartImage(svg as SVGSVGElement, 330);
        if (img) children.push(new Paragraph({ children: [img] }));
      } else {
        const note = text(card);
        children.push(para([run(note, { size: 13, color: MUT })]));
      }
      cellsArr.push(new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: noB, bottom: noB, left: noB, right: noB }, margins: { top: 40, bottom: 40, left: 40, right: 40 }, children }));
    }
    if (cellsArr.length === 0) return null;
    while (cellsArr.length < 2) cellsArr.push(new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: noB, bottom: noB, left: noB, right: noB }, children: [new Paragraph({ children: [] })] }));
    return new Table({ width: { size: TBL_W, type: WidthType.DXA }, columnWidths: [w, w], rows: [new TableRow({ cantSplit: true, children: cellsArr })] });
  };

  /** 재귀 순회 */
  const walk = async (el: Element): Promise<void> => {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGSVGElement)) return;

    if (cls(el, 'head') && el.querySelector('[class*="headTitle"]')) {
      const title = text(el.querySelector('[class*="headTitle"]'));
      const sub = text(el.querySelector('[class*="headSub"]'));
      const meta = text(el.querySelector('[class*="headMeta"]'));
      out.push(para([run(title, { size: 40, bold: true, color: INK }), ...(meta ? [run(`   ${meta}`, { size: 14, color: MUT })] : [])], { spacing: { after: 60 } }));
      out.push(new Paragraph({ children: [run(sub, { size: 20, color: INK2 })], spacing: { after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INK } } }));
      return;
    }
    if (cls(el, 'kpis')) { out.push(convertKpis(el as HTMLElement)); return; }
    if (cls(el, 'sec') && el.querySelector('[class*="secTitle"]')) {
      const t = text(el.querySelector('[class*="secTitle"]'));
      const sub = text(el.querySelector('[class*="secSub"]'));
      out.push(para([run('▎', { size: 26, bold: true, color: ACCENT }), run(` ${t}`, { size: 26, bold: true, color: INK }), ...(sub ? [run(`   ${sub}`, { size: 14, color: ACCENT })] : [])], { spacing: { before: 240, after: 120 } }));
      return;
    }
    if (cls(el, 'row2')) {
      const t = await convertChartsRow(el as HTMLElement);
      if (t) { out.push(t); return; }
    }
    if (cls(el, 'gal')) { out.push(await convertGallery(el as HTMLElement)); return; }
    if (el.tagName === 'TABLE') {
      const t = convertTable(el as HTMLTableElement);
      if (t) out.push(t);
      return;
    }
    if (cls(el, 'ai')) {
      const tag = text(el.querySelector('[class*="aiTag"]'));
      if (tag) out.push(para([run(tag, { size: 15, bold: true, color: ACCENT })], { spacing: { after: 80 } }));
      for (const child of Array.from(el.querySelectorAll('p, li'))) {
        const t = text(child);
        if (!t || t === tag) continue;
        const isHead = cls(child, 'aiHead');
        out.push(para([run(child.tagName === 'LI' ? `• ${t}` : t, { size: isHead ? 18 : 16, bold: isHead, color: isHead ? INK : INK2 })], { spacing: { after: 60 }, indent: child.tagName === 'LI' ? { left: 240 } : undefined }));
      }
      return;
    }
    if (cls(el, 'kioskBlockTitle')) { out.push(para([run(text(el), { size: 22, bold: true, color: INK })], { spacing: { before: 160, after: 60 } })); return; }
    if (cls(el, 'kioskBlockSummary') || cls(el, 'note') || cls(el, 'footer') || cls(el, 'toolbarHint')) {
      out.push(para([run(text(el), { size: 14, color: MUT })], { spacing: { after: 80 } }));
      return;
    }
    if (cls(el, 'emptyBox')) {
      out.push(para([run(text(el), { size: 15, color: MUT })], { spacing: { after: 100 } }));
      return;
    }
    if (cls(el, 'chartCard')) {
      // row2 밖 단독 차트
      const title = text(el.querySelector('h4'));
      if (title) out.push(para([run(title, { size: 15, bold: true, color: INK2 })], { spacing: { after: 40 } }));
      const svg = el.querySelector('svg');
      if (svg) {
        const img = await chartImage(svg as SVGSVGElement, 660);
        if (img) out.push(new Paragraph({ children: [img] }));
      }
      return;
    }
    // 그 외 컨테이너: 자식 순회
    for (const child of Array.from(el.children)) await walk(child);
  };

  await walk(page);
  return out;
}

export async function exportReportDoc(): Promise<boolean> {
  const root = findReportNode();
  if (!root) return false;
  const title = root.getAttribute('data-report-title') ?? '통계 리포트';
  const pages = findPages(root);

  const dx = await import('docx');
  const { Document, Packer, Paragraph, PageBreak, PageOrientation } = dx;

  const children: (InstanceType<DocxModule['Paragraph']> | InstanceType<DocxModule['Table']>)[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    if (i > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...(await convertPage(dx, pages[i])));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, // A4
          margin: { top: 680, bottom: 680, left: 620, right: 620 }, // ~12mm/11mm
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}_${todayStamp()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
