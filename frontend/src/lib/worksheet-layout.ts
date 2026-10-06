// Dàn trang: tính lưới ô li theo khổ giấy rồi xếp chữ mẫu / chữ mờ vào từng dòng viết.
// Mọi số đo tính bằng mm; chữ quy đổi từ đơn vị font sang mm qua `scale`.
import type { LoadedFont } from './font-engine'
import { paperById } from './paper-presets'
import { ALPHABET, DIGITS, upper } from './vietnamese-content'
import type { WorksheetSettings } from './worksheet-settings'

/** Vở ô li Việt Nam: mỗi dòng kẻ đậm cách nhau 4 ô li. */
export const O_LI_PER_UNIT = 4
const FOOTER_MM = 7

export type InkKind = 'solid' | 'trace'

export interface PlacedText {
  text: string
  x: number
  kind: InkKind
}

export interface WritingRow {
  baseline: number
  items: PlacedText[]
}

export interface PageModel {
  rows: WritingRow[]
}

export interface Geometry {
  width: number
  height: number
  margin: number
  oLi: number
  /** Khoảng giữa hai dòng kẻ đậm = 4 ô li; cũng là khoảng kẻ dọc (ô vuông) */
  unit: number
  gridLeft: number
  gridRight: number
  gridTop: number
  gridBottom: number
  marginLineX: number | null
  writeLeft: number
  writeRight: number
  baselines: number[]
  /** mm trên một đơn vị font */
  scale: number
}

export function computeGeometry(s: WorksheetSettings, font: LoadedFont): Geometry {
  const paper = paperById(s.paper)
  const width = s.landscape ? paper.height : paper.width
  const height = s.landscape ? paper.width : paper.height
  const margin = s.marginMm
  const oLi = s.oLiMm
  const unit = oLi * O_LI_PER_UNIT
  const headerH = s.headerHeightMm
  const footerH = s.showPageNumber ? FOOTER_MM : 0

  const gridLeft = margin
  const gridRight = gridLeft + Math.floor((width - 2 * margin) / unit) * unit
  const gridTop = margin + headerH
  const units = Math.max(2, Math.floor((height - margin - footerH - gridTop) / unit))
  const gridBottom = gridTop + units * unit

  // Lề đỏ cách mép lưới 2 ô vuông như vở; chữ bắt đầu ở đường kẻ dọc kế tiếp
  const marginLineX = s.marginLine ? gridLeft + 2 * unit : null
  const writeLeft = (marginLineX ?? gridLeft) + unit
  const writeRight = gridRight - unit / 2

  // Chân chữ nằm trên dòng kẻ đậm. Cỡ vừa: chữ cao 5 ô li (b, h, k, l…) cần trọn
  // một dòng kẻ phía trên → bắt đầu từ dòng đậm thứ 2. Nét dưới (g, y) sâu 3 ô li
  // nên dòng viết cuối phải cách đáy lưới ít nhất 1 dòng kẻ.
  const first = s.letterSize === 'vua' ? 2 : 1
  const step = s.skipRow ? 2 : 1
  const baselines: number[] = []
  for (let k = first; k <= units - 1; k += step) baselines.push(gridTop + k * unit)

  const xHeightOLi = s.letterSize === 'vua' ? 2 : 1
  const scale = (xHeightOLi * oLi) / font.xHeight

  return { width, height, margin, oLi, unit, gridLeft, gridRight, gridTop, gridBottom, marginLineX, writeLeft, writeRight, baselines, scale }
}

type RowPlan = PlacedText[]

const textWidth = (font: LoadedFont, g: Geometry, text: string) => font.shape(text).width * g.scale

/** Các vị trí đặt bản sao chữ trên một dòng, mỗi bản bắt đầu ở một đường kẻ dọc. */
function slotsFor(font: LoadedFont, g: Geometry, text: string, minGapMm: number): number[] {
  const w = textWidth(font, g, text)
  const step = Math.max(1, Math.ceil((w + minGapMm) / g.unit)) * g.unit
  const xs: number[] = []
  for (let x = g.writeLeft; x + w <= g.writeRight + 0.01 || xs.length === 0; x += step) xs.push(x)
  return xs
}

/** Khối luyện một chữ/vần/từ lặp lại kín dòng, theo kiểu bài đã chọn. */
function repeatedBlock(font: LoadedFont, g: Geometry, s: WorksheetSettings, text: string, gapMm: number): RowPlan[] {
  const xs = slotsFor(font, g, text, gapMm)
  const n = Math.max(1, s.rowsPerItem)
  const rows: RowPlan[] = []
  for (let r = 0; r < n; r++) {
    let traces: number
    if (s.pattern === 'to-kin') traces = xs.length - 1
    else if (s.pattern === 'mau-dau-dong') traces = 0
    else traces = n === 1 ? xs.length - 1 : Math.round((xs.length - 1) * (1 - r / (n - 1)))
    rows.push(
      xs.slice(0, 1 + traces).map((x, i) => ({ text, x, kind: i === 0 ? 'solid' : 'trace' }) as PlacedText),
    )
  }
  return rows
}

/** Ngắt câu dài thành nhiều dòng vừa bề ngang trang (ngắt theo từ). */
export function wrapText(font: LoadedFont, g: Geometry, text: string): string[] {
  const max = g.writeRight - g.writeLeft
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word
    if (cur && textWidth(font, g, next) > max) {
      lines.push(cur)
      cur = word
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}

/** Khối luyện một câu: dòng mẫu, rồi dòng tô (chữ mờ), còn lại dòng trống tự viết. */
function sentenceBlocks(font: LoadedFont, g: Geometry, s: WorksheetSettings, text: string): RowPlan[][] {
  const n = Math.max(1, s.rowsPerItem)
  return wrapText(font, g, text).map((line) => {
    const rows: RowPlan[] = []
    for (let r = 0; r < n; r++) {
      let kind: InkKind | null
      if (r === 0) kind = 'solid'
      else if (s.pattern === 'to-kin') kind = 'trace'
      else if (s.pattern === 'giam-dan') kind = r === 1 ? 'trace' : null
      else kind = null
      rows.push(kind ? [{ text: line, x: g.writeLeft, kind }] : [])
    }
    return rows
  })
}

/** Danh sách khối luyện (mỗi khối = vài dòng liền nhau) theo nội dung đã chọn. */
export function buildBlocks(font: LoadedFont, g: Geometry, s: WorksheetSettings): RowPlan[][] {
  const blocks: RowPlan[][] = []
  if (s.mode === 'letters') {
    const order = [...ALPHABET, ...DIGITS]
    const chosen = order.filter((c) => s.letters.includes(c))
    for (const c of chosen) {
      const isDigit = DIGITS.includes(c)
      const forms = isDigit ? [c] : s.letterCase === 'thuong' ? [c] : s.letterCase === 'hoa' ? [upper(c)] : [upper(c), c]
      for (const f of forms) blocks.push(repeatedBlock(font, g, s, f, g.unit * 0.3))
    }
  } else {
    const lines = s.text.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const line of lines) {
      const w = textWidth(font, g, line)
      const fitsTwice = 2 * w + g.unit <= g.writeRight - g.writeLeft
      if (s.repeatText && fitsTwice) blocks.push(repeatedBlock(font, g, s, line, g.unit))
      else blocks.push(...sentenceBlocks(font, g, s, line))
    }
  }
  return blocks
}

/** Xếp các khối vào trang; khối nào vừa một trang thì không bị cắt ngang sang trang sau. */
export function paginate(g: Geometry, blocks: RowPlan[][]): PageModel[] {
  const perPage = g.baselines.length
  const pages: RowPlan[][] = [[]]
  for (const block of blocks) {
    let page = pages[pages.length - 1]
    const left = perPage - page.length
    if (block.length > left && block.length <= perPage && page.length > 0) {
      page = []
      pages.push(page)
    }
    for (const row of block) {
      if (page.length >= perPage) {
        page = []
        pages.push(page)
      }
      page.push(row)
    }
  }
  return pages.map((rows) => ({
    rows: g.baselines.map((baseline, i) => ({ baseline, items: rows[i] ?? [] })),
  }))
}
