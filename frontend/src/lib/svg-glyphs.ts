// Vẽ chữ thành SVG: mỗi glyph + kiểu tô là một <path> trong <defs>, chỗ đặt dùng <use>.
// Dùng chung cho lớp trang (chữ mẫu, số trang) và lớp trang trí (tiêu đề, ô thông tin, watermark).
import type { LoadedFont } from './font-engine'

export const f = (n: number) => (Math.round(n * 1000) / 1000).toString()
export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Cách tô một kiểu glyph: tô kín, hoặc viền (vẽ viền trước rồi phủ nền trắng lên
 *  để giấu các đường viền chồng nhau bên trong glyph của font). */
export type GlyphPaint = { fill: string; opacity?: number } | { outline: string }

export class GlyphDefs {
  private defs = new Map<string, string>()
  private fontIds = new Map<string, number>()

  constructor(
    private prefix: string,
    private paints: Record<string, GlyphPaint> = {},
  ) {}

  /** Thêm kiểu tô mới (ví dụ màu chữ tiêu đề do người dùng chọn). */
  setPaint(style: string, paint: GlyphPaint) {
    this.paints[style] = paint
  }

  ref(font: LoadedFont, gid: number, style: string): string {
    let fi = this.fontIds.get(font.key)
    if (fi === undefined) {
      fi = this.fontIds.size
      this.fontIds.set(font.key, fi)
    }
    const id = `${this.prefix}-${fi}-${gid}-${style}`
    if (!this.defs.has(id)) {
      const d = font.glyphPath(gid)
      const paint = this.paints[style]
      this.defs.set(
        id,
        'fill' in paint
          ? `<path id="${id}" d="${d}" fill="${paint.fill}"${paint.opacity !== undefined ? ` fill-opacity="${f(paint.opacity)}"` : ''}/>`
          : `<g id="${id}"><path d="${d}" ${paint.outline}/><path d="${d}" fill="#ffffff"/></g>`,
      )
    }
    return id
  }

  toString() {
    return this.defs.size ? `<defs>${[...this.defs.values()].join('')}</defs>` : ''
  }
}

/** Đặt một dòng chữ: x là mép trái, baseline là chân chữ (mm); scale = mm trên đơn vị font. */
export function runUses(
  defs: GlyphDefs,
  font: LoadedFont,
  text: string,
  x: number,
  baseline: number,
  scale: number,
  style: string,
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

/** Bọc các lớp thành một SVG trang (đơn vị mm). background=false: nền trong suốt (lớp chồng khi xem trước). */
export function wrapPage(width: number, height: number, layers: string[], opts: { title?: string; background?: boolean } = {}) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${f(width)}mm" height="${f(height)}mm" viewBox="0 0 ${f(width)} ${f(height)}">` +
    (opts.title ? `<title>${esc(opts.title)}</title>` : '') +
    (opts.background !== false ? `<rect width="${f(width)}" height="${f(height)}" fill="#ffffff"/>` : '') +
    layers.join('') +
    `</svg>`
  )
}
