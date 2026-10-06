// Kho ảnh trong phiên: logo, ảnh nền. Ảnh chọn vào được thu nhỏ (logo 1200 px, nền 2400 px),
// chuyển thành PNG (ảnh có thể trong suốt) hoặc JPEG (ảnh chụp) để PDF nhúng được và file gọn.
import { shallowRef, triggerRef } from 'vue'
import { deleteAsset, loadAsset, pickImages, saveAsset } from './backend'
import { newId } from './decor-settings'

export interface ImageAsset {
  dataUrl: string
  width: number
  height: number
}

export const assets = shallowRef(new Map<string, ImageAsset>())

function setAsset(id: string, a: ImageAsset) {
  assets.value.set(id, a)
  triggerRef(assets)
}

async function decode(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  return img
}

/** Thu nhỏ + chuẩn hoá ảnh (SVG, WebP, GIF… đều thành PNG/JPEG mà PDF nhúng được). */
async function normalize(dataUrl: string, maxPx: number): Promise<ImageAsset> {
  const img = await decode(dataUrl)
  let w = img.naturalWidth || 1000
  let h = img.naturalHeight || 1000
  const k = Math.min(1, maxPx / Math.max(w, h))
  w = Math.max(1, Math.round(w * k))
  h = Math.max(1, Math.round(h * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Máy không xử lý được ảnh')
  ctx.drawImage(img, 0, 0, w, h)
  const isPhoto = /^data:image\/jpe?g/i.test(dataUrl)
  return { dataUrl: canvas.toDataURL(isPhoto ? 'image/jpeg' : 'image/png', 0.9), width: w, height: h }
}

/** Chọn ảnh từ máy, lưu lại, trả về mã ảnh. */
export async function importImages(kind: 'logo' | 'nen', multiple: boolean): Promise<string[]> {
  const picked = await pickImages(kind === 'logo' ? 'Chọn logo trường' : 'Chọn ảnh nền', multiple)
  const ids: string[] = []
  for (const p of picked) {
    let asset: ImageAsset
    try {
      asset = await normalize(p.dataUrl, kind === 'logo' ? 1200 : 2400)
    } catch {
      throw new Error(`Không mở được ảnh "${p.name}"`)
    }
    const id = newId(kind)
    setAsset(id, asset)
    await saveAsset(id, asset.dataUrl)
    ids.push(id)
  }
  return ids
}

/** Nạp lại ảnh đã lưu ở lần trước. Mã nào mất file thì bỏ qua. */
export async function restoreAssets(ids: string[]) {
  await Promise.all(
    ids
      .filter((id) => !assets.value.has(id))
      .map(async (id) => {
        try {
          const dataUrl = await loadAsset(id)
          if (!dataUrl) return
          const img = await decode(dataUrl)
          setAsset(id, { dataUrl, width: img.naturalWidth, height: img.naturalHeight })
        } catch {
          /* ảnh hỏng: coi như không có */
        }
      }),
  )
}

export async function removeAsset(id: string) {
  assets.value.delete(id)
  triggerRef(assets)
  await deleteAsset(id).catch(() => {})
}
