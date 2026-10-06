// Thao tác trên phần tử trang trí đang chọn: di chuyển, đổi cỡ, nhích bằng phím, xoá.
import { decor, removeField, selectedId } from './decor-settings'
import type { DecorBox } from './decor-svg'
import { removeAsset } from './image-assets'

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))
/** Tiêu đề kéo tới gần giữa trang trong khoảng này (mm) thì tự hít vào giữa */
export const CENTER_SNAP_MM = 1.5

/** Ảnh chụp giá trị lúc bắt đầu kéo, để tính theo độ lệch chuột (không cộng dồn sai số). */
export function snapshot(box: DecorBox) {
  return {
    size: decor.title.sizeMm,
    lineFrac: decor.fields.find((f) => f.id === box.id)?.lineFrac ?? 0.3,
    widthMm: decor.logos.find((l) => l.id === box.id)?.widthMm ?? 18,
  }
}

/** Đặt mép trái-trên của phần tử tại (x, y) mm. Trả về true nếu tiêu đề đang hít vào giữa. */
export function moveTo(box: DecorBox, x: number, y: number, page: { width: number; height: number }): boolean {
  const nx = clamp(x, 0, page.width - box.w)
  const ny = clamp(y, 0, page.height - box.h)
  if (box.kind === 'title') {
    const centered = Math.abs(nx + box.w / 2 - page.width / 2) < CENTER_SNAP_MM
    decor.title.centered = centered
    if (!centered) decor.title.xFrac = nx / page.width
    decor.title.yMm = ny
    return centered
  }
  const el = box.kind === 'field' ? decor.fields.find((f) => f.id === box.id) : decor.logos.find((l) => l.id === box.id)
  if (el) {
    el.xFrac = nx / page.width
    el.yMm = ny
  }
  return false
}

/** Kéo góc phải dưới: logo đổi bề rộng, tiêu đề đổi cỡ chữ, ô thông tin đổi độ dài dòng chấm. */
export function resizeBy(box: DecorBox, start: ReturnType<typeof snapshot>, dx: number, page: { width: number }) {
  if (box.kind === 'title') {
    decor.title.sizeMm = clamp((start.size * (box.w + dx)) / box.w, 3, 30)
  } else if (box.kind === 'field') {
    const fld = decor.fields.find((f) => f.id === box.id)
    if (fld) fld.lineFrac = clamp(start.lineFrac * page.width + dx, 5, page.width) / page.width
  } else {
    const logo = decor.logos.find((l) => l.id === box.id)
    if (logo) logo.widthMm = clamp(start.widthMm + dx, 5, page.width)
  }
}

export function removeLogo(id: string) {
  const logo = decor.logos.find((l) => l.id === id)
  decor.logos = decor.logos.filter((l) => l.id !== id)
  if (logo) removeAsset(logo.assetId)
  if (selectedId.value === id) selectedId.value = null
}

/** Xoá phần tử đang chọn (tiêu đề không xoá được, chỉ ẩn bằng công tắc). */
export function removeSelected() {
  const id = selectedId.value
  if (!id || id === 'title') return
  if (decor.fields.some((f) => f.id === id)) removeField(id)
  else removeLogo(id)
}

export function selectedKind(): DecorBox['kind'] | null {
  const id = selectedId.value
  if (!id) return null
  if (id === 'title') return 'title'
  if (decor.fields.some((f) => f.id === id)) return 'field'
  if (decor.logos.some((l) => l.id === id)) return 'logo'
  return null
}
