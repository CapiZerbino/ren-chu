// Vẽ lớp trang trí: dưới cùng là ảnh nền; trên cùng là watermark, logo, tiêu đề, ô thông tin.
// Trả kèm khung (mm) của từng phần tử để lớp kéo thả đặt tay nắm đúng chỗ.
import type { LoadedFont } from './font-engine'
import type { Decor } from './decor-settings'
import type { ImageAsset } from './image-assets'
import { f, GlyphDefs, runUses } from './svg-glyphs'

export type DecorKind = 'title' | 'field' | 'logo'

export interface DecorBox {
  id: string
  kind: DecorKind
  x: number
  y: number
  w: number
  h: number
}

export interface DecorRender {
  /** Dưới lưới ô li */
  under: string
  /** Trên lưới và chữ */
  over: string
  boxes: DecorBox[]
}

export interface DecorContext {
  width: number
  height: number
  showHeader: boolean
  /** Tiêu đề hiển thị (đã thay tiêu đề tự động nếu để trống) */
  titleText: string
  fontFor: (key: string) => LoadedFont | null
  asset: (id: string) => ImageAsset | undefined
}

const FIELD_GAP = 1.2

/** Khung chữ một dòng: rộng theo chữ, cao từ đỉnh đến đáy font. */
export function textMetrics(font: LoadedFont, text: string, sizeMm: number) {
  const s = sizeMm / font.upem
  return { s, w: font.shape(text).width * s, h: (font.ascender - font.descender) * s, asc: font.ascender * s }
}

function imageTag(a: ImageAsset, x: number, y: number, w: number, h: number, opacity: number) {
  const op = opacity < 1 ? ` opacity="${f(opacity)}"` : ''
  return `<image href="${a.dataUrl}" xlink:href="${a.dataUrl}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none"${op}/>`
}

export function renderDecor(d: Decor, ctx: DecorContext): DecorRender {
  const { width: W, height: H } = ctx
  const defs = new GlyphDefs('d')
  defs.setPaint('title', { fill: d.title.color })
  defs.setPaint('field', { fill: d.fieldStyle.color })
  // Độ mờ đặt trên từng glyph: svg2pdf (xuất PDF) bỏ qua opacity của cả nhóm <g>
  defs.setPaint('wm', { fill: d.watermark.color, opacity: d.watermark.opacity })
  const boxes: DecorBox[] = []
  let under = ''
  let over = ''

  // Ảnh nền: phủ kín (cắt bớt mép) hoặc vừa trang (giữ trọn ảnh), căn giữa
  const bg = d.background.assetId ? ctx.asset(d.background.assetId) : undefined
  if (bg) {
    const k = d.background.fit === 'cover' ? Math.max(W / bg.width, H / bg.height) : Math.min(W / bg.width, H / bg.height)
    const w = bg.width * k
    const h = bg.height * k
    under += imageTag(bg, (W - w) / 2, (H - h) / 2, w, h, d.background.opacity)
  }

  // Watermark: một dòng chéo giữa trang, hoặc lặp kín trang
  const wmFont = d.watermark.text.trim() ? ctx.fontFor(d.watermark.fontKey) : null
  if (wmFont) {
    const text = d.watermark.text.trim()
    const m = textMetrics(wmFont, text, d.watermark.sizeMm)
    let marks = ''
    if (d.watermark.tiled) {
      const stepX = m.w + d.watermark.sizeMm * 2
      const stepY = d.watermark.sizeMm * 4
      const span = Math.hypot(W, H)
      let row = 0
      for (let y = (H - span) / 2; y < (H + span) / 2; y += stepY, row++) {
        const offset = row % 2 ? stepX / 2 : 0
        for (let x = (W - span) / 2 - offset; x < (W + span) / 2; x += stepX) {
          marks += runUses(defs, wmFont, text, x, y + m.asc, m.s, 'wm')
        }
      }
    } else {
      marks = runUses(defs, wmFont, text, (W - m.w) / 2, H / 2 + m.asc - m.h / 2, m.s, 'wm')
    }
    over += `<g transform="rotate(${f(d.watermark.angle)} ${f(W / 2)} ${f(H / 2)})">${marks}</g>`
  }

  for (const logo of d.logos) {
    const a = ctx.asset(logo.assetId)
    if (!a) continue
    const w = logo.widthMm
    const h = (w * a.height) / a.width
    const x = logo.xFrac * W
    over += imageTag(a, x, logo.yMm, w, h, logo.opacity)
    boxes.push({ id: logo.id, kind: 'logo', x, y: logo.yMm, w, h })
  }

  if (ctx.showHeader) {
    const tf = ctx.fontFor(d.title.fontKey)
    if (tf && ctx.titleText) {
      const m = textMetrics(tf, ctx.titleText, d.title.sizeMm)
      const x = d.title.centered ? (W - m.w) / 2 : d.title.xFrac * W
      over += runUses(defs, tf, ctx.titleText, x, d.title.yMm + m.asc, m.s, 'title')
      boxes.push({ id: 'title', kind: 'title', x, y: d.title.yMm, w: m.w, h: m.h })
    }
    const ff = ctx.fontFor(d.fieldStyle.fontKey)
    if (ff) {
      for (const fld of d.fields) {
        const m = textMetrics(ff, fld.label, d.fieldStyle.sizeMm)
        const x = fld.xFrac * W
        const base = fld.yMm + m.asc
        const lineStart = x + m.w + (fld.label ? FIELD_GAP : 0)
        const lineEnd = lineStart + fld.lineFrac * W
        over += runUses(defs, ff, fld.label, x, base, m.s, 'field')
        over += `<path d="M${f(lineStart)} ${f(base + 0.6)}H${f(lineEnd)}" stroke="#8a8a96" stroke-width="0.25" stroke-dasharray="0.4 0.9" fill="none"/>`
        boxes.push({ id: fld.id, kind: 'field', x, y: fld.yMm, w: lineEnd - x, h: m.h })
      }
    }
  }

  const defsStr = defs.toString()
  return { under, over: defsStr + over, boxes }
}
