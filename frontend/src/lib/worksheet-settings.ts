// Cài đặt của một trang mẫu luyện viết + lưu lại lần dùng trước (localStorage).
import { reactive, watch } from 'vue'
import type { InkId, LineColorId, PaperId } from './paper-presets'
import { DEFAULT_FONT_KEY, type WeightLevel } from './font-catalog'

export type ContentMode = 'letters' | 'text'
export type LetterCase = 'thuong' | 'hoa' | 'ca-hai'
/** Cách bố trí mỗi khối luyện:
 *  to-kin: dòng nào cũng mẫu + chữ mờ kín dòng
 *  giam-dan: chữ mờ ít dần qua từng dòng, dòng cuối chỉ còn mẫu
 *  mau-dau-dong: mỗi dòng chỉ có chữ mẫu đầu dòng, còn lại để trống tự viết */
export type PracticePattern = 'to-kin' | 'giam-dan' | 'mau-dau-dong'
export type TraceStyle = 'mo' | 'net-dut' | 'cham'
/** Cỡ chữ theo mẫu chữ tiểu học: vừa = chữ thường cao 2 ô li, nhỏ = 1 ô li */
export type LetterSize = 'vua' | 'nho'

export interface WorksheetSettings {
  // Nội dung
  mode: ContentMode
  letters: string[]
  letterCase: LetterCase
  text: string
  repeatText: boolean
  pattern: PracticePattern
  rowsPerItem: number
  // Giấy và dòng kẻ
  paper: PaperId
  landscape: boolean
  marginMm: number
  oLiMm: number
  skipRow: boolean
  verticalLines: boolean
  marginLine: boolean
  lineColor: LineColorId
  // Chữ
  fontKey: string
  letterSize: LetterSize
  weight: WeightLevel
  slant: number
  ink: InkId
  traceStyle: TraceStyle
  // Trang
  showHeader: boolean
  /** Khoảng trống đầu trang (mm) dành cho tiêu đề, ô thông tin, logo */
  headerHeightMm: number
  showPageNumber: boolean
}

export const DEFAULT_SETTINGS: WorksheetSettings = {
  mode: 'letters',
  letters: ['a', 'ă', 'â'],
  letterCase: 'thuong',
  text: 'Có công mài sắt, có ngày nên kim.\nĂn quả nhớ kẻ trồng cây.',
  repeatText: false,
  pattern: 'giam-dan',
  rowsPerItem: 3,
  paper: 'a4',
  landscape: false,
  marginMm: 12,
  oLiMm: 2,
  skipRow: true,
  verticalLines: true,
  marginLine: true,
  lineColor: 'tim',
  fontKey: DEFAULT_FONT_KEY,
  letterSize: 'vua',
  weight: 'vua',
  slant: 0,
  ink: 'xanh',
  traceStyle: 'mo',
  showHeader: true,
  headerHeightMm: 21,
  showPageNumber: true,
}

const STORAGE_KEY = 'renchu.settings.v1'

function loadSaved(): Partial<WorksheetSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const saved = raw ? (JSON.parse(raw) as Partial<WorksheetSettings>) : {}
    // Bản đầu lưu độ đậm bằng số (200/300/400)
    if (typeof saved.weight === 'number') {
      const n = saved.weight as number
      saved.weight = n <= 200 ? 'manh' : n >= 400 ? 'dam' : 'vua'
    }
    // Bản 0.1.0: tắt đầu trang thì không chừa khoảng trống
    if (saved.showHeader === false && saved.headerHeightMm === undefined) saved.headerHeightMm = 0
    delete (saved as { title?: string }).title
    return saved
  } catch {
    return {}
  }
}

/** Cài đặt dùng chung toàn app, tự lưu khi đổi. */
export const settings = reactive<WorksheetSettings>({ ...DEFAULT_SETTINGS, ...loadSaved() })

watch(
  settings,
  (s) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* chế độ riêng tư / bị chặn lưu: bỏ qua, app vẫn chạy */
    }
  },
  { deep: true },
)

export function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS)
}

/** Tiêu đề tự đặt theo nội dung khi người dùng để trống. */
export function autoTitle(s: WorksheetSettings): string {
  return s.mode === 'letters' ? 'Luyện viết chữ cái' : 'Luyện viết'
}
