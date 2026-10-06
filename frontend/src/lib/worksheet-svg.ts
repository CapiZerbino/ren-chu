// Lớp trang: lưới ô li, chữ mẫu / chữ để tô, số trang. Phần đầu trang (tiêu đề,
// ô thông tin, logo, nền, watermark) vẽ ở decor-svg.ts rồi ghép lại khi xuất.
import type { LoadedFont } from './font-engine'
import { inkById, lineColorById, MARGIN_RED } from './paper-presets'
import { O_LI_PER_UNIT, type Geometry, type PageModel } from './worksheet-layout'
import type { WorksheetSettings } from './worksheet-settings'
import { f, GlyphDefs, runUses, type GlyphPaint } from './svg-glyphs'

function glyphPaints(s: WorksheetSettings, g: Geometry, writing: LoadedFont): Record<string, GlyphPaint> {
  const ink = inkById(s.ink)
  // Nét viền co giãn theo chiều cao chữ thường (mm) để chữ nhỏ không bị dày đặc.
  // Viền vẽ dưới lớp phủ trắng nên chỉ nửa ngoài hiện ra → độ dày đặt gấp đôi.
  const xh = writing.xHeight * g.scale
  const u = (k: number) => f((k * xh) / g.scale)
  let trace: GlyphPaint
  if (s.traceStyle === 'mo') trace = { fill: ink.faded }
  else if (s.traceStyle === 'net-dut')
    trace = { outline: `fill="none" stroke="${ink.outline}" stroke-width="${u(0.1)}" stroke-dasharray="${u(0.2)} ${u(0.13)}"` }
  else
    trace = {
      outline: `fill="none" stroke="${ink.outline}" stroke-width="${u(0.16)}" stroke-linecap="round" stroke-dasharray="0 ${u(0.17)}"`,
    }
  return { solid: { fill: ink.solid }, trace, label: { fill: '#2b2b33' } }
}

function gridSvg(s: WorksheetSettings, g: Geometry): string {
  const c = lineColorById(s.lineColor)
  let thin = ''
  let bold = ''
  const count = Math.round((g.gridBottom - g.gridTop) / g.oLi)
  for (let i = 0; i <= count; i++) {
    const y = f(g.gridTop + i * g.oLi)
    const seg = `M${f(g.gridLeft)} ${y}H${f(g.gridRight)}`
    if (i % O_LI_PER_UNIT === 0) bold += seg
    else thin += seg
  }
  let vert = ''
  let vertMajor = ''
  if (s.ruling === 'o-vuong') {
    // Ô vuông: kẻ dọc từng ô li, đường mỗi 4 ô li đậm hơn (khớp dòng kẻ đậm ngang)
    const cols = Math.round((g.gridRight - g.gridLeft) / g.oLi)
    for (let i = 0; i <= cols; i++) {
      const seg = `M${f(g.gridLeft + i * g.oLi)} ${f(g.gridTop)}V${f(g.gridBottom)}`
      if (i % O_LI_PER_UNIT === 0) vertMajor += seg
      else vert += seg
    }
  } else if (s.verticalLines) {
    for (let x = g.gridLeft; x <= g.gridRight + 0.01; x += g.unit) vert += `M${f(x)} ${f(g.gridTop)}V${f(g.gridBottom)}`
  } else {
    vert = `M${f(g.gridLeft)} ${f(g.gridTop)}V${f(g.gridBottom)}M${f(g.gridRight)} ${f(g.gridTop)}V${f(g.gridBottom)}`
  }
  let out =
    `<path d="${thin}" stroke="${c.thin}" stroke-width="0.12" fill="none"/>` +
    `<path d="${vert}" stroke="${c.vertical}" stroke-width="0.12" fill="none"/>` +
    (vertMajor ? `<path d="${vertMajor}" stroke="${c.bold}" stroke-width="0.18" stroke-opacity="0.7" fill="none"/>` : '') +
    `<path d="${bold}" stroke="${c.bold}" stroke-width="0.25" fill="none"/>`
  if (g.marginLineX !== null) {
    const x = f(g.marginLineX)
    out += `<path d="M${x} ${f(g.gridTop)}V${f(g.gridBottom)}" stroke="${MARGIN_RED}" stroke-width="0.3" fill="none"/>`
  }
  return out
}

export interface RenderPageInput {
  s: WorksheetSettings
  g: Geometry
  page: PageModel
  pageIndex: number
  pageCount: number
  label: LoadedFont
  writing: LoadedFont
}

/** Nội dung lớp trang (chưa bọc thẻ <svg>, không có nền trắng). */
export function renderBaseLayer({ s, g, page, pageIndex, pageCount, label, writing }: RenderPageInput): string {
  const defs = new GlyphDefs(`p${pageIndex}`, glyphPaints(s, g, writing))
  let body = gridSvg(s, g)
  for (const row of page.rows) {
    for (const item of row.items) {
      body += runUses(defs, writing, item.text, item.x, row.baseline, g.scale, item.kind, s.slant)
    }
  }
  if (s.showPageNumber) {
    const ps = 3 / label.upem
    const txt = `Trang ${pageIndex + 1}/${pageCount}`
    const w = label.shape(txt).width * ps
    body += runUses(defs, label, txt, g.gridRight - w, g.gridBottom + 5.2, ps, 'label')
  }
  return defs.toString() + body
}
