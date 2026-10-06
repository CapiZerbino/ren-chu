// Vẽ một trang mẫu luyện viết thành chuỗi SVG (đơn vị mm). Cùng một chuỗi dùng cho
// bản xem trước trên màn hình và cho bản PDF (svg2pdf) nên in ra giống hệt.
import type { LoadedFont } from './font-engine'
import { inkById, lineColorById, MARGIN_RED } from './paper-presets'
import { O_LI_PER_UNIT, type Geometry, type InkKind, type PageModel } from './worksheet-layout'
import { effectiveTitle, type WorksheetSettings } from './worksheet-settings'

const f = (n: number) => (Math.round(n * 1000) / 1000).toString()
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

type GlyphStyle = InkKind | 'label'

/** Cách tô một kiểu glyph: tô kín, hoặc viền (vẽ viền trước rồi phủ nền trắng lên
 *  để giấu các đường viền chồng nhau bên trong glyph của font). */
type GlyphPaint = { fill: string } | { outline: string }

/** Gom glyph dùng trên trang vào <defs>, mỗi glyph + kiểu nét một bản, chỗ đặt dùng <use>. */
class GlyphDefs {
  private defs = new Map<string, string>()
  constructor(
    private prefix: string,
    private paints: Record<GlyphStyle, GlyphPaint>,
  ) {}

  ref(font: LoadedFont, gid: number, style: GlyphStyle): string {
    const id = `${this.prefix}-${font.key === 'label' ? 'l' : 'w'}${gid}-${style[0]}`
    if (!this.defs.has(id)) {
      const d = font.glyphPath(gid)
      const paint = this.paints[style]
      this.defs.set(
        id,
        'fill' in paint
          ? `<path id="${id}" d="${d}" fill="${paint.fill}"/>`
          : `<g id="${id}"><path d="${d}" ${paint.outline}/><path d="${d}" fill="#ffffff"/></g>`,
      )
    }
    return id
  }

  toString() {
    return `<defs>${[...this.defs.values()].join('')}</defs>`
  }
}

function runUses(
  defs: GlyphDefs,
  font: LoadedFont,
  text: string,
  x: number,
  baseline: number,
  scale: number,
  style: GlyphStyle,
  slant = 0,
): string {
  let out = ''
  const skew = slant ? ` skewX(${f(-slant)})` : ''
  for (const g of font.shape(text).glyphs) {
    const id = defs.ref(font, g.gid, style)
    const tx = x + g.x * scale
    const ty = baseline - g.y * scale
    out += `<use href="#${id}" xlink:href="#${id}" transform="translate(${f(tx)} ${f(ty)})${skew} scale(${f(scale)} ${f(-scale)})"/>`
  }
  return out
}

function glyphPaints(s: WorksheetSettings, g: Geometry, writing: LoadedFont): Record<GlyphStyle, GlyphPaint> {
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
  if (s.verticalLines) {
    for (let x = g.gridLeft; x <= g.gridRight + 0.01; x += g.unit) vert += `M${f(x)} ${f(g.gridTop)}V${f(g.gridBottom)}`
  } else {
    vert = `M${f(g.gridLeft)} ${f(g.gridTop)}V${f(g.gridBottom)}M${f(g.gridRight)} ${f(g.gridTop)}V${f(g.gridBottom)}`
  }
  let out =
    `<path d="${thin}" stroke="${c.thin}" stroke-width="0.12" fill="none"/>` +
    `<path d="${vert}" stroke="${c.vertical}" stroke-width="0.12" fill="none"/>` +
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

export function renderPageSvg({ s, g, page, pageIndex, pageCount, label, writing }: RenderPageInput): string {
  const labelScale = (mm: number) => mm / label.upem
  const defs = new GlyphDefs(`p${pageIndex}`, glyphPaints(s, g, writing))
  let body = gridSvg(s, g)

  if (s.showHeader) {
    const title = effectiveTitle(s)
    const ts = labelScale(6.2)
    const tw = label.shape(title).width * ts
    body += runUses(defs, label, title, (g.width - tw) / 2, g.margin + 6, ts, 'label')

    // Họ và tên ……… Lớp ……… Ngày ………
    const ls = labelScale(3.8)
    const y = g.margin + 15
    const left = g.gridLeft
    const right = g.gridRight
    const fields: [string, number][] = [
      ['Họ và tên:', 0.56],
      ['Lớp:', 0.16],
      ['Ngày:', 0.28],
    ]
    let x = left
    for (const [name, share] of fields) {
      const w = label.shape(name).width * ls
      const end = x + (right - left) * share
      body += runUses(defs, label, name, x, y, ls, 'label')
      body += `<path d="M${f(x + w + 1.2)} ${f(y + 0.6)}H${f(end - 3)}" stroke="#8a8a96" stroke-width="0.25" stroke-dasharray="0.4 0.9" fill="none"/>`
      x = end
    }
  }

  for (const row of page.rows) {
    for (const item of row.items) {
      body += runUses(defs, writing, item.text, item.x, row.baseline, g.scale, item.kind, s.slant)
    }
  }

  if (s.showPageNumber) {
    const ps = labelScale(3)
    const txt = `Trang ${pageIndex + 1}/${pageCount}`
    const w = label.shape(txt).width * ps
    body += runUses(defs, label, txt, g.gridRight - w, g.gridBottom + 5.2, ps, 'label')
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${f(g.width)}mm" height="${f(g.height)}mm" viewBox="0 0 ${f(g.width)} ${f(g.height)}">` +
    `<title>${esc(effectiveTitle(s))} — trang ${pageIndex + 1}</title>` +
    `<rect width="${f(g.width)}" height="${f(g.height)}" fill="#ffffff"/>` +
    defs.toString() +
    body +
    `</svg>`
  )
}
