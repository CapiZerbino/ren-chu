// Tạo file Word (.docx): mỗi trang mẫu là một ảnh PNG đặt kín một trang Word cùng khổ giấy,
// lề 0 (trang mẫu đã có lề riêng). Mở được bằng Word, Google Docs, LibreOffice, WPS.
import { utf8 } from './binary-utils'
import { zipStore } from './zip-store'

export interface DocxPage {
  png: Uint8Array
  widthMm: number
  heightMm: number
}

const EMU_PER_MM = 36000
const TWIP_PER_MM = 1440 / 25.4
// Ảnh thấp hơn trang một chút để Word không đẩy dấu đoạn sang trang trắng kế tiếp
const SAFETY_MM = 1.2

const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'

function pageParagraph(p: DocxPage, i: number): string {
  const h = p.heightMm - SAFETY_MM
  const w = (p.widthMm * h) / p.heightMm
  const cx = Math.round(w * EMU_PER_MM)
  const cy = Math.round(h * EMU_PER_MM)
  const id = i + 1
  return (
    `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/>` +
    (i > 0 ? '<w:pageBreakBefore/>' : '') +
    `</w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Trang ${id}"/>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>` +
    `<pic:nvPicPr><pic:cNvPr id="${id}" name="trang-${id}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rId${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
  )
}

export function buildDocx(pages: DocxPage[]): Uint8Array {
  if (!pages.length) throw new Error('Chưa có trang nào để xuất')
  const first = pages[0]
  const landscape = first.widthMm > first.heightMm
  const sect =
    `<w:sectPr><w:pgSz w:w="${Math.round(first.widthMm * TWIP_PER_MM)}" w:h="${Math.round(first.heightMm * TWIP_PER_MM)}"` +
    (landscape ? ' w:orient="landscape"' : '') +
    `/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`
  const document =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>` +
    pages.map(pageParagraph).join('') +
    sect +
    `</w:body></w:document>`

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    pages
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/trang-${i + 1}.png"/>`,
      )
      .join('') +
    `</Relationships>`

  return zipStore([
    {
      name: '[Content_Types].xml',
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
          `<Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>` +
          `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
      ),
    },
    {
      name: '_rels/.rels',
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
      ),
    },
    { name: 'word/document.xml', data: utf8(document) },
    { name: 'word/_rels/document.xml.rels', data: utf8(rels) },
    ...pages.map((p, i) => ({ name: `word/media/trang-${i + 1}.png`, data: p.png })),
  ])
}
