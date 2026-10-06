// Trạng thái dùng chung: font đã nạp, lớp trang (lưới + chữ mẫu, dựng lại có trễ) và
// lớp trang trí (dựng ngay, để kéo thả mượt). Khi xuất thì ghép hai lớp thành trang hoàn chỉnh.
import { computed, ref, shallowRef, triggerRef, watch } from 'vue'
import { fetchFontData, fontFromData, type LoadedFont } from './font-engine'
import { BUNDLED_FONTS, DEFAULT_FONT_KEY, LABEL_FONT_KEY, pathFontKey, type FontEntry } from './font-catalog'
import { buildBlocks, computeGeometry, paginate } from './worksheet-layout'
import { renderBaseLayer } from './worksheet-svg'
import { renderDecor } from './decor-svg'
import { wrapPage } from './svg-glyphs'
import { autoTitle, settings } from './worksheet-settings'
import { decor } from './decor-settings'
import { assets, restoreAssets } from './image-assets'
import { listSystemFonts, readFontFile } from './backend'
import { paperById } from './paper-presets'
import type { PdfPage } from './pdf-export'

const loaded = shallowRef(new Map<string, LoadedFont>())
const loading = new Map<string, Promise<void>>()
export const systemFonts = shallowRef<FontEntry[]>([])
export const addedFonts = shallowRef<FontEntry[]>(loadAddedFonts())
/** Lớp trang của từng trang (chưa bọc <svg>) */
export const basePages = shallowRef<string[]>([])
export const renderError = ref('')
export const fontError = ref('')
export const fontLoading = ref(false)
const systemScanned = ref(false)
export const ready = ref(false)

const ADDED_KEY = 'renchu.addedFonts.v1'

function loadAddedFonts(): FontEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(ADDED_KEY) ?? '[]') as { name: string; path: string }[]
    return list.map((f) => ({ key: pathFontKey(f.path), name: f.name, path: f.path, group: 'da-them' }))
  } catch {
    return []
  }
}

function saveAddedFonts() {
  try {
    const list = addedFonts.value.filter((f) => f.path).map((f) => ({ name: f.name, path: f.path }))
    localStorage.setItem(ADDED_KEY, JSON.stringify(list))
  } catch {
    /* không lưu được thì chỉ mất danh sách ở lần mở sau */
  }
}

export const allFonts = computed<FontEntry[]>(() => [...BUNDLED_FONTS, ...addedFonts.value, ...systemFonts.value])
export const fontEntry = (key: string) => allFonts.value.find((f) => f.key === key) ?? BUNDLED_FONTS[0]
export const currentFontEntry = computed(() => fontEntry(settings.fontKey))

/** Font đã nạp theo khoá; chưa nạp xong thì tạm dùng font chữ in mặc định. */
export function fontFor(key: string): LoadedFont | null {
  return loaded.value.get(key) ?? loaded.value.get(LABEL_FONT_KEY) ?? null
}

export const writingFont = computed<LoadedFont | null>(() => loaded.value.get(settings.fontKey) ?? null)
export const missingVietnamese = computed(() => writingFont.value?.missingVietnamese() ?? '')

async function loadEntry(entry: FontEntry): Promise<LoadedFont> {
  if (entry.url) return fontFromData(entry.key, entry.name, await fetchFontData(entry.url))
  if (entry.path) return fontFromData(entry.key, entry.name, await readFontFile(entry.path))
  throw new Error(`Font "${entry.name}" không còn trong phiên này, hãy thêm lại`)
}

/** Nạp font (một lần). Trả về false nếu không nạp được. */
async function ensureFont(key: string): Promise<boolean> {
  if (loaded.value.has(key)) return true
  const entry = allFonts.value.find((f) => f.key === key)
  if (!entry) return false
  let p = loading.get(key)
  if (!p) {
    p = loadEntry(entry).then((font) => {
      loaded.value.set(key, font)
      triggerRef(loaded)
    })
    loading.set(key, p)
  }
  fontLoading.value = true
  try {
    await p
    return true
  } catch (e) {
    loading.delete(key)
    fontError.value = (e as Error).message
    return false
  } finally {
    fontLoading.value = loading.size > loaded.value.size
  }
}

/** Nạp mọi font đang dùng; font nào hỏng / mất thì về font mặc định của chỗ đó. */
async function ensureUsedFonts() {
  const slots: [string, (k: string) => void, string][] = [
    [settings.fontKey, (k) => (settings.fontKey = k), DEFAULT_FONT_KEY],
    [decor.title.fontKey, (k) => (decor.title.fontKey = k), LABEL_FONT_KEY],
    [decor.fieldStyle.fontKey, (k) => (decor.fieldStyle.fontKey = k), LABEL_FONT_KEY],
    [decor.watermark.fontKey, (k) => (decor.watermark.fontKey = k), LABEL_FONT_KEY],
  ]
  for (const [key, set, fallback] of slots) {
    const known = allFonts.value.some((f) => f.key === key)
    // Font trên máy: chờ quét xong danh sách rồi mới kết luận là mất
    if (!known && key.startsWith('file:') && !systemScanned.value) continue
    if (!(await ensureFont(key)) && key !== fallback) set(fallback)
  }
}

export async function initFonts() {
  if (!(await ensureFont(LABEL_FONT_KEY))) {
    fontError.value = `Không nạp được font: ${fontError.value}`
    return
  }
  ready.value = true
  ensureUsedFonts()
  restoreAssets([...decor.logos.map((l) => l.assetId), ...(decor.background.assetId ? [decor.background.assetId] : [])])
  listSystemFonts()
    .then((list) => {
      systemFonts.value = list.map((f) => ({ key: pathFontKey(f.path), name: f.name, path: f.path, group: 'tren-may' }))
    })
    .catch(() => {})
    .finally(() => {
      systemScanned.value = true
      ensureUsedFonts()
    })
}

watch(
  () => [settings.fontKey, decor.title.fontKey, decor.fieldStyle.fontKey, decor.watermark.fontKey],
  () => ready.value && ensureUsedFonts(),
)

/** Thêm font từ file người dùng chọn. Trả về khoá font để nơi gọi dùng luôn. */
export function addFontFromFile(name: string, data: string | ArrayBuffer, path?: string): string {
  const key = path ? pathFontKey(path) : `upload:${name}:${Date.now()}`
  const font = fontFromData(key, name, data)
  loaded.value.set(key, font)
  triggerRef(loaded)
  if (!addedFonts.value.some((f) => f.key === key)) {
    addedFonts.value = [...addedFonts.value, { key, name, path, group: 'da-them' }]
    saveAddedFonts()
  }
  return key
}

export function removeAddedFont(key: string) {
  addedFonts.value = addedFonts.value.filter((f) => f.key !== key)
  saveAddedFonts()
  if (settings.fontKey === key) settings.fontKey = DEFAULT_FONT_KEY
  for (const style of [decor.title, decor.fieldStyle, decor.watermark]) if (style.fontKey === key) style.fontKey = LABEL_FONT_KEY
}

/** Kích thước giấy hiện tại (mm). */
export const pageSize = computed(() => {
  const p = paperById(settings.paper)
  return settings.landscape ? { width: p.height, height: p.width } : { width: p.width, height: p.height }
})

export const titleText = computed(() => decor.title.text.trim() || autoTitle(settings))

/** Lớp trang trí, dựng ngay mỗi khi đổi (nhẹ: vài chữ và ảnh). */
export const decorLayer = computed(() => {
  void loaded.value // phụ thuộc: font nạp xong thì vẽ lại
  return renderDecor(decor, {
    ...pageSize.value,
    showHeader: settings.showHeader,
    titleText: titleText.value,
    fontFor,
    asset: (id) => assets.value.get(id),
  })
})

/** Ghép lớp nền + lớp trang + lớp trang trí thành các trang hoàn chỉnh để xuất file. */
export function composePages(): PdfPage[] {
  const { width, height } = pageSize.value
  const d = decorLayer.value
  return basePages.value.map((inner, i) => ({
    svg: wrapPage(width, height, [d.under, inner, d.over], { title: `${titleText.value} — trang ${i + 1}` }),
    width,
    height,
  }))
}

function rebuild() {
  const label = loaded.value.get(LABEL_FONT_KEY)
  const writing = writingFont.value
  if (!label || !writing) return
  try {
    const weights = currentFontEntry.value.weights
    if (weights) writing.setWeight(weights[settings.weight])
    const g = computeGeometry(settings, writing)
    if (!g.baselines.length) throw new Error('Khổ giấy quá nhỏ so với cỡ ô li, không còn dòng nào để viết')
    const models = paginate(g, buildBlocks(writing, g, settings))
    basePages.value = models.map((page, i) =>
      renderBaseLayer({ s: settings, g, page, pageIndex: i, pageCount: models.length, label, writing }),
    )
    renderError.value = ''
  } catch (e) {
    renderError.value = (e as Error).message
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch([() => JSON.stringify(settings), loaded, writingFont], () => {
  clearTimeout(timer)
  timer = setTimeout(rebuild, 90)
})
