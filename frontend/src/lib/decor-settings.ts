// Trang trí trang mẫu: tiêu đề, ô thông tin (Họ và tên, Lớp…), logo, ảnh nền, watermark.
// Dùng chung cho mọi trang. Vị trí ngang lưu theo tỉ lệ bề ngang giấy (đổi khổ giấy vẫn
// giữ bố cục), vị trí dọc và kích thước lưu bằng mm. Tách khỏi worksheet-settings để
// kéo thả không làm dựng lại toàn bộ lưới và chữ mẫu.
import { reactive, ref, watch } from 'vue'
import { LABEL_FONT_KEY } from './font-catalog'

export interface TextStyle {
  fontKey: string
  sizeMm: number
  color: string
}

export interface TitleDecor extends TextStyle {
  /** Để trống = tự đặt theo nội dung ("Luyện viết chữ cái", "Luyện viết") */
  text: string
  xFrac: number
  yMm: number
  /** Căn giữa trang (kéo lệch khỏi giữa thì tự tắt) */
  centered: boolean
}

export interface FieldDecor {
  id: string
  label: string
  xFrac: number
  yMm: number
  /** Độ dài dòng chấm để điền, theo tỉ lệ bề ngang giấy */
  lineFrac: number
}

export interface LogoDecor {
  id: string
  assetId: string
  xFrac: number
  yMm: number
  widthMm: number
  opacity: number
}

export interface BackgroundDecor {
  assetId: string | null
  opacity: number
  fit: 'cover' | 'contain'
}

export interface WatermarkDecor extends TextStyle {
  text: string
  opacity: number
  angle: number
  tiled: boolean
}

export interface Decor {
  title: TitleDecor
  fieldStyle: TextStyle
  fields: FieldDecor[]
  logos: LogoDecor[]
  background: BackgroundDecor
  watermark: WatermarkDecor
}

export const TEXT_COLORS = [
  { value: '#2b2b33', label: 'Đen' },
  { value: '#1f3f99', label: 'Xanh' },
  { value: '#5b2a9a', label: 'Tím' },
  { value: '#c0392b', label: 'Đỏ' },
  { value: '#127a52', label: 'Xanh lá' },
  { value: '#9a9aa6', label: 'Xám' },
]

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/** Ô thông tin mặc định, đặt cho khổ A4 lề 12 mm (khổ khác tự co theo tỉ lệ). */
export function defaultFields(): FieldDecor[] {
  return [
    { id: 'ho-ten', label: 'Họ và tên:', xFrac: 0.057, yMm: 23, lineFrac: 0.39 },
    { id: 'lop', label: 'Lớp:', xFrac: 0.562, yMm: 23, lineFrac: 0.095 },
    { id: 'ngay', label: 'Ngày:', xFrac: 0.724, yMm: 23, lineFrac: 0.165 },
  ]
}

export function defaultDecor(): Decor {
  return {
    title: { text: '', fontKey: LABEL_FONT_KEY, sizeMm: 6.2, color: '#2b2b33', xFrac: 0.3, yMm: 11, centered: true },
    fieldStyle: { fontKey: LABEL_FONT_KEY, sizeMm: 3.8, color: '#2b2b33' },
    fields: defaultFields(),
    logos: [],
    background: { assetId: null, opacity: 0.15, fit: 'cover' },
    watermark: { text: '', fontKey: LABEL_FONT_KEY, sizeMm: 14, color: '#9a9aa6', opacity: 0.12, angle: -30, tiled: false },
  }
}

const STORAGE_KEY = 'renchu.decor.v1'

function loadSaved(): Decor {
  const base = defaultDecor()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw) as Partial<Decor>
      return {
        ...base,
        ...d,
        title: { ...base.title, ...d.title },
        fieldStyle: { ...base.fieldStyle, ...d.fieldStyle },
        background: { ...base.background, ...d.background },
        watermark: { ...base.watermark, ...d.watermark },
      }
    }
    // Bản 0.1.0 lưu tiêu đề trong cài đặt chung
    const old = JSON.parse(localStorage.getItem('renchu.settings.v1') ?? '{}') as { title?: string }
    if (old.title) base.title.text = old.title
  } catch {
    /* dữ liệu hỏng: dùng mặc định */
  }
  return base
}

export const decor = reactive<Decor>(loadSaved())

/** Phần tử đang chọn trên trang ('title', id ô thông tin, id logo) */
export const selectedId = ref<string | null>(null)

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  decor,
  () => {
    // Kéo thả đổi liên tục → gom lại mới ghi
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decor))
      } catch {
        /* không lưu được: chỉ mất bố cục ở lần mở sau */
      }
    }, 300)
  },
  { deep: true },
)

/** Đặt lại vị trí tiêu đề và ô thông tin về mặc định (giữ nội dung, font, logo). */
export function resetHeaderLayout() {
  const d = defaultDecor()
  Object.assign(decor.title, { xFrac: d.title.xFrac, yMm: d.title.yMm, centered: true })
  const defaults = new Map(d.fields.map((f) => [f.id, f]))
  decor.fields.forEach((fld, i) => {
    const def = defaults.get(fld.id)
    Object.assign(fld, def ? { xFrac: def.xFrac, yMm: def.yMm, lineFrac: def.lineFrac } : { xFrac: 0.057, yMm: 30 + i * 6 })
  })
}

export function addField(label: string) {
  const id = newId('o')
  decor.fields.push({ id, label, xFrac: 0.057, yMm: 30, lineFrac: 0.3 })
  selectedId.value = id
}

export function removeField(id: string) {
  decor.fields = decor.fields.filter((f) => f.id !== id)
  if (selectedId.value === id) selectedId.value = null
}
