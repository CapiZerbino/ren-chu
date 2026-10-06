// Trạng thái dùng chung: danh mục font, font đã nạp, các trang đã dựng từ cài đặt.
import { computed, ref, shallowRef, triggerRef, watch } from 'vue'
import { fetchFontData, fontFromData, loadLabelFont, type LoadedFont } from './font-engine'
import { BUNDLED_FONTS, DEFAULT_FONT_KEY, pathFontKey, type FontEntry } from './font-catalog'
import { buildBlocks, computeGeometry, paginate } from './worksheet-layout'
import { renderPageSvg } from './worksheet-svg'
import { settings } from './worksheet-settings'
import { listSystemFonts, readFontFile } from './backend'
import type { PdfPage } from './pdf-export'

export const labelFont = shallowRef<LoadedFont | null>(null)
const loaded = shallowRef(new Map<string, LoadedFont>())
export const systemFonts = shallowRef<FontEntry[]>([])
export const addedFonts = shallowRef<FontEntry[]>(loadAddedFonts())
export const pages = shallowRef<PdfPage[]>([])
export const renderError = ref('')
export const fontError = ref('')
export const fontLoading = ref(false)
const systemScanned = ref(false)

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
export const currentFontEntry = computed(
  () => allFonts.value.find((f) => f.key === settings.fontKey) ?? BUNDLED_FONTS[0],
)
export const writingFont = computed<LoadedFont | null>(() => loaded.value.get(settings.fontKey) ?? null)

/** Chữ tiếng Việt font đang chọn không có — để cảnh báo người dùng. */
export const missingVietnamese = computed(() => writingFont.value?.missingVietnamese() ?? '')

async function loadEntry(entry: FontEntry): Promise<LoadedFont> {
  if (entry.url) return fontFromData(entry.key, entry.name, await fetchFontData(entry.url))
  if (entry.path) return fontFromData(entry.key, entry.name, await readFontFile(entry.path))
  throw new Error(`Font "${entry.name}" không còn trong phiên này, hãy thêm lại`)
}

/** Nạp font đang chọn (nếu chưa). Lỗi thì báo và quay về font mặc định. */
async function ensureCurrentFont() {
  const key = settings.fontKey
  if (loaded.value.has(key)) return
  const entry = allFonts.value.find((f) => f.key === key)
  if (!entry) {
    // Font trên máy: chờ danh sách quét xong; còn lại (font đã gỡ, xoá) thì về mặc định
    if (key.startsWith('file:') && !systemScanned.value) return
    settings.fontKey = DEFAULT_FONT_KEY
    return
  }
  fontLoading.value = true
  try {
    const font = await loadEntry(entry)
    loaded.value.set(key, font)
    triggerRef(loaded)
    fontError.value = ''
  } catch (e) {
    fontError.value = (e as Error).message
    if (key !== DEFAULT_FONT_KEY) settings.fontKey = DEFAULT_FONT_KEY
  } finally {
    fontLoading.value = false
  }
}

export async function initFonts() {
  try {
    labelFont.value = await loadLabelFont()
  } catch (e) {
    fontError.value = `Không nạp được font: ${(e as Error).message}`
    return
  }
  await ensureCurrentFont()
  listSystemFonts()
    .then((list) => {
      systemFonts.value = list.map((f) => ({ key: pathFontKey(f.path), name: f.name, path: f.path, group: 'tren-may' }))
    })
    .catch(() => {})
    .finally(() => {
      systemScanned.value = true
      ensureCurrentFont()
    })
}

watch(() => settings.fontKey, ensureCurrentFont)

/** Thêm font từ file người dùng chọn rồi dùng luôn làm chữ mẫu. */
export function addFontFromFile(name: string, data: string | ArrayBuffer, path?: string) {
  const key = path ? pathFontKey(path) : `upload:${name}:${Date.now()}`
  const font = fontFromData(key, name, data)
  loaded.value.set(key, font)
  triggerRef(loaded)
  if (!addedFonts.value.some((f) => f.key === key)) {
    addedFonts.value = [...addedFonts.value, { key, name, path, group: 'da-them' }]
    saveAddedFonts()
  }
  settings.fontKey = key
}

export function removeAddedFont(key: string) {
  addedFonts.value = addedFonts.value.filter((f) => f.key !== key)
  saveAddedFonts()
  if (settings.fontKey === key) settings.fontKey = DEFAULT_FONT_KEY
}

function rebuild() {
  const label = labelFont.value
  const writing = writingFont.value
  if (!label || !writing) return
  try {
    const weights = currentFontEntry.value.weights
    if (weights) writing.setWeight(weights[settings.weight])
    const g = computeGeometry(settings, writing)
    if (!g.baselines.length) throw new Error('Khổ giấy quá nhỏ so với cỡ ô li, không còn dòng nào để viết')
    const models = paginate(g, buildBlocks(writing, g, settings))
    pages.value = models.map((page, i) => ({
      svg: renderPageSvg({ s: settings, g, page, pageIndex: i, pageCount: models.length, label, writing }),
      width: g.width,
      height: g.height,
    }))
    renderError.value = ''
  } catch (e) {
    renderError.value = (e as Error).message
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch([() => JSON.stringify(settings), labelFont, writingFont], () => {
  clearTimeout(timer)
  timer = setTimeout(rebuild, 90)
})
