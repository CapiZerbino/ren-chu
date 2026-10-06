// Khổ giấy, màu dòng kẻ, màu mực — các lựa chọn quen thuộc ở trường tiểu học Việt Nam.

export type PaperId = 'a4' | 'a5' | 'b5' | 'vo' | 'letter'

export interface PaperPreset {
  id: PaperId
  label: string
  hint: string
  /** Kích thước khổ dọc (mm) */
  width: number
  height: number
}

export const PAPERS: PaperPreset[] = [
  { id: 'a4', label: 'A4', hint: '210 × 297 mm · in văn phòng', width: 210, height: 297 },
  { id: 'vo', label: 'Vở học sinh', hint: '170 × 240 mm · cỡ vở ô li', width: 170, height: 240 },
  { id: 'b5', label: 'B5', hint: '176 × 250 mm', width: 176, height: 250 },
  { id: 'a5', label: 'A5', hint: '148 × 210 mm · nửa tờ A4', width: 148, height: 210 },
  { id: 'letter', label: 'Letter', hint: '216 × 279 mm', width: 215.9, height: 279.4 },
]

export function paperById(id: PaperId): PaperPreset {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0]
}

export type LineColorId = 'tim' | 'xanh' | 'xam' | 'nhat'

export interface LineColorPreset {
  id: LineColorId
  label: string
  /** Dòng kẻ ô li mảnh */
  thin: string
  /** Dòng kẻ đậm (đường kẻ chân chữ) */
  bold: string
  /** Kẻ dọc */
  vertical: string
}

// Tím: màu dòng kẻ vở ô li quen thuộc. Xám: in đen trắng cho rõ mà vẫn tiết kiệm mực.
export const LINE_COLORS: LineColorPreset[] = [
  { id: 'tim', label: 'Tím vở', thin: '#c9b8e6', bold: '#7b55b8', vertical: '#c9b8e6' },
  { id: 'xanh', label: 'Xanh', thin: '#b5d2ef', bold: '#3f7cc0', vertical: '#b5d2ef' },
  { id: 'xam', label: 'Xám (in trắng đen)', thin: '#c4c4c4', bold: '#6d6d6d', vertical: '#c4c4c4' },
  { id: 'nhat', label: 'Rất nhạt', thin: '#e3e3e3', bold: '#a8a8a8', vertical: '#e8e8e8' },
]

export const MARGIN_RED = '#e0525a'

export type InkId = 'xanh' | 'den' | 'tim'

export interface InkPreset {
  id: InkId
  label: string
  /** Chữ mẫu đậm */
  solid: string
  /** Chữ mờ để tô */
  faded: string
  /** Viền nét đứt/chấm */
  outline: string
}

export const INKS: InkPreset[] = [
  { id: 'xanh', label: 'Mực xanh', solid: '#1f3f99', faded: '#c3cde8', outline: '#6f86c4' },
  { id: 'den', label: 'Mực đen', solid: '#1c1c1c', faded: '#cfcfcf', outline: '#7a7a7a' },
  { id: 'tim', label: 'Mực tím', solid: '#5b2a9a', faded: '#d8c9ec', outline: '#9a7cc6' },
]

export const lineColorById = (id: LineColorId) => LINE_COLORS.find((c) => c.id === id) ?? LINE_COLORS[0]
export const inkById = (id: InkId) => INKS.find((c) => c.id === id) ?? INKS[0]
