// Bộ dựng chữ: dùng HarfBuzz (WebAssembly) để ghép glyph đúng như font thiết kế
// (dấu tiếng Việt, nét nối calt của chữ viết tay) rồi lấy đường viền glyph dạng
// SVG path. Trang mẫu vẽ chữ bằng path nên bản xem trước, bản PDF và bản in
// giống hệt nhau, không phụ thuộc font cài trên máy.
import * as hb from 'harfbuzzjs'
import labelUrl from '@/assets/fonts/BeVietnamPro-Medium.ttf?url'

/** Một glyph sau khi ghép, toạ độ theo đơn vị font (y hướng lên). */
export interface ShapedGlyph {
  gid: number
  x: number
  y: number
}

export interface ShapedRun {
  glyphs: ShapedGlyph[]
  /** Tổng độ rộng (đơn vị font) */
  width: number
}

const VIETNAMESE_CHECK = 'aăâbcdđeêghiklmnoôơpqrstuưvxyAĂÂĐÊÔƠƯàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ'

export class LoadedFont {
  readonly upem: number
  /** Chiều cao chữ "x" (đơn vị font) — mốc để chữ thường cao đúng số ô li */
  readonly xHeight: number
  readonly hasWeightAxis: boolean
  private face: hb.Face
  private font: hb.Font
  private weight = 0
  private paths = new Map<number, string>()
  private runs = new Map<string, ShapedRun>()

  constructor(
    readonly key: string,
    readonly name: string,
    data: ArrayBuffer | Uint8Array,
  ) {
    // .ttc (bộ nhiều font) lấy font đầu tiên
    this.face = new hb.Face(new hb.Blob(data), 0)
    this.font = new hb.Font(this.face)
    this.upem = this.face.upem
    this.hasWeightAxis = 'wght' in (this.face.getAxisInfos() ?? {})
    const gx = this.font.glyph('x'.codePointAt(0)!)
    const ext = gx ? this.font.glyphExtents(gx) : undefined
    this.xHeight = ext && ext.yBearing > 0 ? ext.yBearing : this.upem * 0.5
  }

  /** Đổi độ đậm nét (chỉ font có trục wght). Xoá cache vì đường viền đổi theo. */
  setWeight(weight: number) {
    if (!this.hasWeightAxis || weight === this.weight) return
    this.weight = weight
    this.font.setVariations([new hb.Variation('wght', weight)])
    this.paths.clear()
    this.runs.clear()
  }

  /** Ghép chuỗi thành dãy glyph. Chuẩn hoá NFC để "ế" gõ tổ hợp vẫn ra glyph dựng sẵn. */
  shape(text: string): ShapedRun {
    const norm = text.normalize('NFC')
    const cached = this.runs.get(norm)
    if (cached) return cached
    const buf = new hb.Buffer()
    buf.addText(norm)
    buf.guessSegmentProperties()
    buf.setLanguage('vi')
    hb.shape(this.font, buf)
    let pen = 0
    const glyphs: ShapedGlyph[] = []
    for (const g of buf.getGlyphInfosAndPositions()) {
      glyphs.push({ gid: g.codepoint, x: pen + (g.xOffset ?? 0), y: g.yOffset ?? 0 })
      pen += g.xAdvance ?? 0
    }
    const run = { glyphs, width: pen }
    this.runs.set(norm, run)
    return run
  }

  /** Các chữ tiếng Việt font không có (rỗng = đủ dấu). */
  missingVietnamese(): string {
    return [...VIETNAMESE_CHECK].filter((c) => !this.font.glyph(c.codePointAt(0)!)).join('')
  }

  /** Đường viền glyph (SVG path, đơn vị font, y hướng lên). */
  glyphPath(gid: number): string {
    let d = this.paths.get(gid)
    if (d === undefined) {
      d = this.font.glyphToPath(gid)
      this.paths.set(gid, d)
    }
    return d
  }
}

export async function fetchFontData(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Không nạp được font (${res.status})`)
  return res.arrayBuffer()
}

/** Font chữ in cho tiêu đề, họ tên, số trang. */
export async function loadLabelFont(): Promise<LoadedFont> {
  return new LoadedFont('label', 'Be Vietnam Pro', await fetchFontData(labelUrl))
}

/** Dựng font từ dữ liệu (base64 từ Go hoặc ArrayBuffer). Báo lỗi nếu không có chữ Latin. */
export function fontFromData(key: string, name: string, data: string | ArrayBuffer): LoadedFont {
  const bytes =
    typeof data === 'string' ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0)) : new Uint8Array(data)
  let font: LoadedFont
  try {
    font = new LoadedFont(key, name, bytes)
  } catch {
    throw new Error(`Không đọc được font "${name}"`)
  }
  if (font.shape('a').glyphs.every((g) => g.gid === 0)) {
    throw new Error(`Font "${name}" không có chữ cái Latin, không dùng làm chữ mẫu được`)
  }
  return font
}
