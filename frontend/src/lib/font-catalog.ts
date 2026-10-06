// Danh mục font chữ mẫu: font kèm sẵn (giấy phép OFL, đủ dấu tiếng Việt), font cài
// trên máy và font người dùng tự thêm. Font kèm sẵn chỉ tải khi được chọn.
import playwrite from '@/assets/fonts/PlaywriteVN.ttf?url'
import dancing from '@/assets/fonts/DancingScript.ttf?url'
import charm from '@/assets/fonts/Charm-Regular.ttf?url'
import andika from '@/assets/fonts/Andika-Regular.ttf?url'
import mali from '@/assets/fonts/Mali-Regular.ttf?url'
import itim from '@/assets/fonts/Itim-Regular.ttf?url'
import pangolin from '@/assets/fonts/Pangolin-Regular.ttf?url'
import patrick from '@/assets/fonts/PatrickHand-Regular.ttf?url'
import sriracha from '@/assets/fonts/Sriracha-Regular.ttf?url'
import grandstander from '@/assets/fonts/Grandstander.ttf?url'
import nunito from '@/assets/fonts/Nunito.ttf?url'
import lexend from '@/assets/fonts/Lexend.ttf?url'
import beVietnam from '@/assets/fonts/BeVietnamPro-Medium.ttf?url'

export type FontGroup = 'noi-net' | 'chu-in' | 'da-them' | 'tren-may'
export type WeightLevel = 'manh' | 'vua' | 'dam'

export const FONT_GROUP_LABELS: Record<FontGroup, string> = {
  'noi-net': 'Chữ viết tay nét nối',
  'chu-in': 'Chữ in cho bé',
  'da-them': 'Font đã thêm',
  'tren-may': 'Font trên máy',
}

export interface FontEntry {
  key: string
  name: string
  group: FontGroup
  hint?: string
  /** Font kèm sẵn: đường dẫn trong app */
  url?: string
  /** Font trên máy / font tự thêm (bản desktop): đường dẫn file */
  path?: string
  /** Độ đậm cho Mảnh / Vừa / Đậm (chỉ font có trục wght) */
  weights?: Record<WeightLevel, number>
}

export const DEFAULT_FONT_KEY = 'playwrite'
/** Font mặc định cho tiêu đề, ô thông tin, số trang */
export const LABEL_FONT_KEY = 'bevietnam'

export const BUNDLED_FONTS: FontEntry[] = [
  { key: 'playwrite', name: 'Playwrite Việt Nam', group: 'noi-net', hint: 'Giống mẫu chữ trường tiểu học', url: playwrite, weights: { manh: 200, vua: 300, dam: 400 } },
  { key: 'dancing', name: 'Dancing Script', group: 'noi-net', hint: 'Nét nối mềm, bay bướm', url: dancing, weights: { manh: 400, vua: 500, dam: 700 } },
  { key: 'charm', name: 'Charm', group: 'noi-net', hint: 'Chữ nghiêng kiểu bút máy', url: charm },
  { key: 'andika', name: 'Andika', group: 'chu-in', hint: 'Thiết kế cho trẻ tập đọc', url: andika },
  { key: 'mali', name: 'Mali', group: 'chu-in', hint: 'Tròn, thân thiện', url: mali },
  { key: 'itim', name: 'Itim', group: 'chu-in', hint: 'Chữ in nét bút dạ', url: itim },
  { key: 'pangolin', name: 'Pangolin', group: 'chu-in', hint: 'Chữ in viết tay', url: pangolin },
  { key: 'patrick', name: 'Patrick Hand', group: 'chu-in', hint: 'Chữ in viết tay, gọn', url: patrick },
  { key: 'sriracha', name: 'Sriracha', group: 'chu-in', hint: 'Nghiêng, nét bút', url: sriracha },
  { key: 'grandstander', name: 'Grandstander', group: 'chu-in', hint: 'Vui nhộn cho bé nhỏ', url: grandstander, weights: { manh: 250, vua: 450, dam: 650 } },
  { key: 'nunito', name: 'Nunito', group: 'chu-in', hint: 'Chữ in đầu tròn, dễ đọc', url: nunito, weights: { manh: 300, vua: 500, dam: 700 } },
  { key: 'bevietnam', name: 'Be Vietnam Pro', group: 'chu-in', hint: 'Chữ in rõ, hợp tiêu đề', url: beVietnam },
  { key: 'lexend', name: 'Lexend', group: 'chu-in', hint: 'Chữ in rõ, dễ đọc', url: lexend, weights: { manh: 250, vua: 400, dam: 550 } },
]

/** Khoá font cho font trên máy / font tự thêm theo đường dẫn. */
export const pathFontKey = (path: string) => `file:${path}`

/** Đăng ký font kèm sẵn cho CSS để ô chọn font hiện tên bằng chính font đó. */
let cssRegistered = false
export function registerBundledFontsForCss() {
  if (cssRegistered || typeof FontFace === 'undefined') return
  cssRegistered = true
  for (const f of BUNDLED_FONTS) {
    try {
      const face = new FontFace(cssFamily(f.key), `url(${f.url})`)
      document.fonts.add(face)
      face.load().catch(() => {})
    } catch {
      /* trình duyệt cũ: hiện tên bằng font giao diện */
    }
  }
}

export const cssFamily = (key: string) => `rc-${key}`
