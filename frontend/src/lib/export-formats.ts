// Các định dạng xuất: PDF, ảnh PNG/JPG, SVG, Word. Mỗi hàm trả về danh sách file (base64) để lưu.
import { buildPdf, type PdfPage } from './pdf-export'
import { rasterizePage } from './rasterize-page'
import { buildDocx } from './docx-builder'
import { bytesToB64, utf8 } from './binary-utils'
import type { ExportFile } from './backend'

export type ExportFormat = 'pdf' | 'docx' | 'png' | 'jpg' | 'svg'

export interface ExportFormatInfo {
  id: ExportFormat
  label: string
  hint: string
  ext: string
  mime: string
  filterName: string
  /** Mỗi trang một file */
  perPage: boolean
}

export const EXPORT_FORMATS: ExportFormatInfo[] = [
  { id: 'pdf', label: 'PDF', hint: 'In đẹp nhất, mọi máy đều mở được', ext: 'pdf', mime: 'application/pdf', filterName: 'PDF (*.pdf)', perPage: false },
  { id: 'docx', label: 'Word (.docx)', hint: 'Mở bằng Word, Google Docs để in hoặc ghép bài', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', filterName: 'Word (*.docx)', perPage: false },
  { id: 'png', label: 'Ảnh PNG', hint: 'Mỗi trang một ảnh nét 300 DPI, gửi Zalo, Facebook', ext: 'png', mime: 'image/png', filterName: 'Ảnh PNG (*.png)', perPage: true },
  { id: 'jpg', label: 'Ảnh JPG', hint: 'Mỗi trang một ảnh 300 DPI, file nhẹ hơn PNG', ext: 'jpg', mime: 'image/jpeg', filterName: 'Ảnh JPG (*.jpg)', perPage: true },
  { id: 'svg', label: 'SVG', hint: 'Mỗi trang một file vector, sửa tiếp bằng Canva, Illustrator', ext: 'svg', mime: 'image/svg+xml', filterName: 'SVG (*.svg)', perPage: true },
]

export const formatInfo = (id: ExportFormat) => EXPORT_FORMATS.find((f) => f.id === id)!

const IMAGE_DPI = 300
const DOCX_DPI = 220

function pageFileName(title: string, ext: string, i: number, total: number) {
  return total === 1 ? `${title}.${ext}` : `${title} - trang ${String(i + 1).padStart(String(total).length, '0')}.${ext}`
}

export async function buildExport(
  format: ExportFormat,
  pages: PdfPage[],
  title: string,
  onProgress: (done: number) => void,
): Promise<ExportFile[]> {
  if (!pages.length) throw new Error('Chưa có trang nào để xuất')
  const tick = (n: number) => {
    onProgress(n)
    return new Promise((r) => setTimeout(r, 0)) // nhường giao diện cập nhật tiến độ
  }
  switch (format) {
    case 'pdf':
      return [{ name: `${title}.pdf`, data: await buildPdf(pages, title, onProgress) }]
    case 'svg':
      return pages.map((p, i) => ({ name: pageFileName(title, 'svg', i, pages.length), data: bytesToB64(utf8(p.svg)) }))
    case 'png':
    case 'jpg': {
      const out: ExportFile[] = []
      for (let i = 0; i < pages.length; i++) {
        const img = await rasterizePage(pages[i], IMAGE_DPI, format === 'png' ? 'image/png' : 'image/jpeg')
        out.push({ name: pageFileName(title, format, i, pages.length), data: bytesToB64(img.bytes) })
        await tick(i + 1)
      }
      return out
    }
    case 'docx': {
      const docPages = []
      for (let i = 0; i < pages.length; i++) {
        const img = await rasterizePage(pages[i], DOCX_DPI, 'image/png')
        docPages.push({ png: img.bytes, widthMm: pages[i].width, heightMm: pages[i].height })
        await tick(i + 1)
      }
      return [{ name: `${title}.docx`, data: bytesToB64(buildDocx(docPages)) }]
    }
  }
}
