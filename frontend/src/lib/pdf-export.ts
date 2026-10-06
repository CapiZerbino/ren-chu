// Xuất các trang SVG thành một file PDF nhiều trang (jsPDF + svg2pdf.js).
// Chữ đã là đường viền (path) nên PDF không cần nhúng font.
import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'

export interface PdfPage {
  svg: string
  width: number
  height: number
}

export async function buildPdf(pages: PdfPage[], title: string, onProgress?: (done: number) => void): Promise<string> {
  if (!pages.length) throw new Error('Chưa có trang nào để xuất')
  const first = pages[0]
  const doc = new jsPDF({
    unit: 'mm',
    format: [first.width, first.height],
    orientation: first.width > first.height ? 'landscape' : 'portrait',
    compress: true,
  })
  doc.setProperties({ title, creator: 'Rèn Chữ' })

  // svg2pdf cần phần tử SVG nằm trong DOM để đọc style kế thừa
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden'
  document.body.appendChild(host)
  try {
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      if (i > 0) doc.addPage([p.width, p.height], p.width > p.height ? 'landscape' : 'portrait')
      host.innerHTML = p.svg
      const el = host.firstElementChild as SVGSVGElement
      await svg2pdf(el, doc, { x: 0, y: 0, width: p.width, height: p.height })
      onProgress?.(i + 1)
      // nhường luồng cho giao diện cập nhật tiến độ
      await new Promise((r) => setTimeout(r, 0))
    }
  } finally {
    host.remove()
  }
  const uri = doc.output('datauristring')
  return uri.slice(uri.indexOf(',') + 1)
}
