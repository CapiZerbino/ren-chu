// Vẽ trang SVG thành ảnh PNG/JPG theo DPI, ghi DPI vào file để in ra đúng kích thước giấy.
import { concatBytes, crc32 } from './binary-utils'
import type { PdfPage } from './pdf-export'

export type ImageType = 'image/png' | 'image/jpeg'

export interface RasterImage {
  bytes: Uint8Array
  widthPx: number
  heightPx: number
}

async function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    // giữ URL tới khi ảnh đã giải mã xong
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export async function rasterizePage(page: PdfPage, dpi: number, type: ImageType): Promise<RasterImage> {
  const widthPx = Math.round((page.width / 25.4) * dpi)
  const heightPx = Math.round((page.height / 25.4) * dpi)
  const img = await loadSvgImage(page.svg)
  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Máy không vẽ được ảnh (canvas)')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, widthPx, heightPx)
  ctx.drawImage(img, 0, 0, widthPx, heightPx)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.92))
  if (!blob) throw new Error('Không tạo được ảnh, thử giảm cỡ giấy hoặc số trang')
  const raw = new Uint8Array(await blob.arrayBuffer())
  const bytes = type === 'image/png' ? setPngDpi(raw, dpi) : setJpegDpi(raw, dpi)
  return { bytes, widthPx, heightPx }
}

/** Chèn khối pHYs (mật độ điểm ảnh) ngay sau IHDR của PNG. */
export function setPngDpi(png: Uint8Array, dpi: number): Uint8Array {
  const ihdrEnd = 8 + 4 + 4 + 13 + 4 // chữ ký + độ dài + "IHDR" + dữ liệu + CRC
  const chunk = new Uint8Array(4 + 4 + 9 + 4)
  const v = new DataView(chunk.buffer)
  const ppm = Math.round(dpi / 0.0254)
  v.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4) // "pHYs"
  v.setUint32(8, ppm)
  v.setUint32(12, ppm)
  chunk[16] = 1 // đơn vị: mét
  v.setUint32(17, crc32(chunk, 4, 17))
  return concatBytes([png.subarray(0, ihdrEnd), chunk, png.subarray(ihdrEnd)])
}

/** Ghi DPI vào khối JFIF (APP0) của JPEG nếu có. */
export function setJpegDpi(jpg: Uint8Array, dpi: number): Uint8Array {
  const isJfif = jpg[2] === 0xff && jpg[3] === 0xe0 && String.fromCharCode(...jpg.subarray(6, 10)) === 'JFIF'
  if (!isJfif) return jpg
  const out = jpg.slice()
  const v = new DataView(out.buffer)
  out[13] = 1 // đơn vị: điểm/inch
  v.setUint16(14, dpi)
  v.setUint16(16, dpi)
  return out
}
