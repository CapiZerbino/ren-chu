// Đóng gói zip không nén (store) — đủ cho file Word .docx (ảnh PNG vốn đã nén).
import { concatBytes, crc32, utf8 } from './binary-utils'

export interface ZipEntry {
  name: string
  data: Uint8Array
}

const DOS_DATE_1980 = 0x21 // 01/01/1980

export function zipStore(entries: ZipEntry[]): Uint8Array {
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const e of entries) {
    const name = utf8(e.name)
    const crc = crc32(e.data)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x0800, true) // tên file UTF-8
    lv.setUint16(12, DOS_DATE_1980, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, e.data.length, true)
    lv.setUint32(22, e.data.length, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)

    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(14, DOS_DATE_1980, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, e.data.length, true)
    cv.setUint32(24, e.data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    central.set(name, 46)

    locals.push(local, e.data)
    centrals.push(central)
    offset += local.length + e.data.length
  }
  const cd = concatBytes(centrals)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, cd.length, true)
  ev.setUint32(16, offset, true)
  return concatBytes([...locals, cd, end])
}
