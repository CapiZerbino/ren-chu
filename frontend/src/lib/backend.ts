// Cầu nối tới hàm Go (Wails). Khi mở bằng trình duyệt thường (npm run dev) thì
// dùng cách của trình duyệt: tải file xuống, mở PDF ở tab mới, chọn font bằng <input>.

export interface ExportFile {
  name: string
  /** base64 */
  data: string
}

interface GoApp {
  SaveExport(files: ExportFile[], filterName: string, ext: string): Promise<string>
  OpenPDFForPrint(dataB64: string, name: string): Promise<void>
  PickFont(): Promise<{ name: string; path: string; data: string } | null>
  ListSystemFonts(): Promise<{ name: string; path: string }[] | null>
  ReadFontFile(path: string): Promise<string>
}

const goApp = (): GoApp | undefined =>
  (window as unknown as { go?: { main?: { App?: GoApp } } }).go?.main?.App

/** Đang chạy trong app desktop (có hộp lưu file, font trên máy). */
export const isDesktop = () => !!goApp()

function b64ToBlob(b64: string, type: string): Blob {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type })
}

/** Lưu các file xuất ra. Trả về đường dẫn file/thư mục (desktop) hoặc tên file (trình duyệt); '' nếu huỷ. */
export async function saveExport(files: ExportFile[], filterName: string, ext: string, mime: string): Promise<string> {
  const app = goApp()
  if (app) return app.SaveExport(files, filterName, ext)
  for (const f of files) {
    const url = URL.createObjectURL(b64ToBlob(f.data, mime))
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    await new Promise((r) => setTimeout(r, 150)) // trình duyệt chặn tải nhiều file dồn dập
  }
  return 'thư mục Tải về'
}

/** Mở PDF bằng trình xem của máy để in. */
export async function openPdfForPrint(b64: string, name: string): Promise<void> {
  const app = goApp()
  if (app) return app.OpenPDFForPrint(b64, name)
  window.open(URL.createObjectURL(b64ToBlob(b64, 'application/pdf')), '_blank')
}

/** Chọn file font .ttf/.otf/.ttc. Trả về null nếu huỷ. */
export async function pickFont(): Promise<{ name: string; path?: string; data: string | ArrayBuffer } | null> {
  const app = goApp()
  if (app) return app.PickFont()
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ttf,.otf,.ttc'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      resolve({ name: file.name.replace(/\.(ttf|otf|ttc)$/i, ''), data: await file.arrayBuffer() })
    }
    input.click()
  })
}

/** Font cài trên máy (chỉ bản desktop). */
export async function listSystemFonts(): Promise<{ name: string; path: string }[]> {
  return (await goApp()?.ListSystemFonts()) ?? []
}

export async function readFontFile(path: string): Promise<string> {
  const app = goApp()
  if (!app) throw new Error('Chỉ đọc được font trên máy ở bản desktop')
  return app.ReadFontFile(path)
}

// ---- Ảnh (logo, ảnh nền) ----

export interface PickedImage {
  name: string
  dataUrl: string
}

interface GoImages {
  PickImages(title: string): Promise<PickedImage[] | null>
  SaveAsset(id: string, dataUrl: string): Promise<void>
  LoadAsset(id: string): Promise<string>
  DeleteAsset(id: string): Promise<void>
}

const goImages = () => goApp() as unknown as GoImages | undefined
const ASSET_PREFIX = 'renchu.asset.'

/** Chọn một hoặc nhiều ảnh từ máy. */
export async function pickImages(title: string, multiple: boolean): Promise<PickedImage[]> {
  const app = goImages()
  if (app) {
    const list = (await app.PickImages(title)) ?? []
    return multiple ? list : list.slice(0, 1)
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = multiple
    input.onchange = async () => {
      const files = [...(input.files ?? [])]
      const out = await Promise.all(
        files.map(
          (file) =>
            new Promise<PickedImage>((res, rej) => {
              const r = new FileReader()
              r.onload = () => res({ name: file.name.replace(/\.[^.]+$/, ''), dataUrl: r.result as string })
              r.onerror = () => rej(r.error)
              r.readAsDataURL(file)
            }),
        ),
      )
      resolve(out)
    }
    input.click()
  })
}

/** Lưu ảnh để lần mở sau còn (desktop: thư mục cấu hình của app; trình duyệt: localStorage). */
export async function saveAsset(id: string, dataUrl: string): Promise<void> {
  const app = goImages()
  if (app) return app.SaveAsset(id, dataUrl)
  try {
    localStorage.setItem(ASSET_PREFIX + id, dataUrl)
  } catch {
    /* hết chỗ lưu: ảnh vẫn dùng được trong phiên này */
  }
}

export async function loadAsset(id: string): Promise<string> {
  const app = goImages()
  if (app) return app.LoadAsset(id)
  try {
    return localStorage.getItem(ASSET_PREFIX + id) ?? ''
  } catch {
    return ''
  }
}

export async function deleteAsset(id: string): Promise<void> {
  const app = goImages()
  if (app) return app.DeleteAsset(id)
  try {
    localStorage.removeItem(ASSET_PREFIX + id)
  } catch {
    /* bỏ qua */
  }
}
