# Rèn Chữ

Phần mềm desktop tạo **mẫu luyện viết chữ tiếng Việt** cho học sinh tiểu học: vở ô li tím, lề đỏ,
chữ mẫu theo kiểu chữ viết trường học, chữ mờ / nét đứt / chấm chấm để bé tô, in ra hoặc lưu PDF.

**[Tải bản mới nhất](https://github.com/CapiZerbino/ren-chu/releases/latest)** — macOS (.dmg), Windows (bộ cài .exe hoặc .zip chạy ngay), Linux (.tar.gz).
App chưa ký số: lần đầu mở trên macOS vào Cài đặt hệ thống → Quyền riêng tư & Bảo mật → **Vẫn mở**; Windows bấm **Thông tin thêm** → **Vẫn chạy**.

Cùng stack với [Sano](https://github.com/CapiZerbino/sano-sach-noi): Wails v2 (Go) + Vue 3 + Tailwind (token shadcn-vue).

## Làm được gì

- **Nội dung**: 29 chữ cái tiếng Việt + chữ số (thường, hoa, hoa + thường); hoặc vần, từ, câu tự nhập
  (mỗi dòng một mục), có sẵn mẫu vần, từ ngữ, tục ngữ, ca dao, câu ứng dụng lớp 1. Câu dài tự ngắt dòng.
- **Kiểu bài**: mờ giảm dần · tô kín dòng · chỉ mẫu đầu dòng; chọn số dòng luyện mỗi chữ/câu.
- **Khổ giấy**: A4, vở học sinh 170×240, B5, A5, Letter; dọc/ngang; lề trang.
- **Dòng kẻ vở 4 ô li**: ô li 2 / 2,5 / 3 mm, kẻ dọc ô vuông, lề đỏ, viết cách dòng; màu tím vở, xanh, xám (in trắng đen), rất nhạt.
- **Font chữ mẫu**: 12 font kèm sẵn, đủ dấu tiếng Việt (giấy phép OFL):
  - Viết tay nét nối: Playwrite Việt Nam (giống mẫu chữ trường học), Dancing Script, Charm
  - Chữ in cho bé: Andika, Mali, Itim, Pangolin, Patrick Hand, Sriracha, Grandstander, Nunito, Lexend
  - Font cài trên máy (bản desktop tự quét, tìm theo tên) — dùng được font mẫu chữ tiểu học trường đang có (HP001…)
  - Thêm font từ file .ttf/.otf/.ttc (bản desktop nhớ cho lần sau). Font thiếu dấu tiếng Việt thì app cảnh báo.
- **Chữ mẫu**: cỡ vừa (chữ thường 2 ô li, chữ cao 5 ô li) hoặc cỡ nhỏ (1 ô li); nét mảnh/vừa/đậm (font có trục độ đậm);
  độ nghiêng; mực xanh/đen/tím.
- **Đầu trang**: tiêu đề, ô thông tin (Họ và tên, Lớp, Ngày, thêm Trường, Điểm, Lời phê… hoặc ô tự đặt), số trang;
  tiêu đề và ô thông tin chọn font, cỡ, màu riêng; khoảng trống đầu trang chỉnh được.
- **Logo trường**: thêm nhiều logo (PNG, JPG, SVG, WebP…), ảnh lưu lại cho lần mở sau.
- **Kéo thả trên trang**: kéo tiêu đề, ô thông tin, logo để đổi chỗ; kéo góc để đổi cỡ (logo, cỡ tiêu đề, độ dài dòng chấm);
  tiêu đề tự hít vào giữa trang; phím mũi tên nhích 0,5 mm (Shift: 2 mm), Delete xoá, Esc bỏ chọn.
- **Ảnh nền chìm** dưới lưới ô li (phủ kín hoặc vừa trang, chỉnh độ đậm) và **watermark** chữ (font, cỡ, màu, góc, độ mờ, lặp kín trang).
- **Xuất file**: PDF · Word (.docx, mỗi trang mẫu một trang Word cùng khổ) · ảnh PNG / JPG 300 DPI (mỗi trang một ảnh,
  có ghi DPI để in đúng cỡ) · SVG (vector, sửa tiếp bằng Canva/Illustrator). Nhiều file thì chọn thư mục, trùng tên không ghi đè.
- **In**: mở PDF bằng trình xem của máy. Chữ vẽ bằng đường viền nên bản in giống hệt xem trước.

## Cách hoạt động

`frontend/src/lib/`

| File | Vai trò |
|---|---|
| `font-engine.ts` | HarfBuzz (wasm) ghép chữ + lấy đường viền glyph |
| `worksheet-layout.ts` | Lưới ô li theo khổ giấy, xếp chữ vào dòng, chia trang |
| `worksheet-svg.ts` | Vẽ lớp trang: lưới, chữ mẫu, số trang (SVG, mm) |
| `decor-settings.ts`, `decor-svg.ts`, `decor-actions.ts` | Trang trí: tiêu đề, ô thông tin, logo, nền, watermark; vẽ + khung kéo thả |
| `image-assets.ts` | Nhập ảnh (thu nhỏ, chuẩn hoá PNG/JPEG), lưu và nạp lại |
| `svg-glyphs.ts` | Vẽ chữ thành `<path>`/`<use>`, bọc lớp thành trang SVG |
| `font-catalog.ts` | Danh mục font kèm sẵn (tải khi chọn), độ đậm từng font |
| `export-formats.ts` | Chọn định dạng xuất → danh sách file |
| `pdf-export.ts` | SVG → PDF (jsPDF + svg2pdf.js) |
| `rasterize-page.ts` | SVG → PNG/JPG theo DPI (ghi DPI vào file) |
| `docx-builder.ts`, `zip-store.ts` | Đóng gói Word .docx (zip không nén) |
| `worksheet-settings.ts`, `worksheet-store.ts` | Cài đặt (nhớ lần trước) + dựng trang khi đổi |
| `paper-presets.ts`, `vietnamese-content.ts` | Khổ giấy, màu; bảng chữ cái, nội dung mẫu |

Go: `app.go` lưu file xuất (một file / cả thư mục), mở PDF để in, chọn font; `system_fonts.go` quét và đọc font cài trên máy;
`image_assets.go` chọn ảnh, lưu ảnh logo/nền vào thư mục cấu hình của app.

## Chạy

```sh
make dev     # wails dev (Vite :5391)
make build   # → build/bin/Rèn Chữ.app
make test
```

Phát hành: thêm mục mới vào `CHANGELOG.md` → `git tag vX.Y.Z && git push origin vX.Y.Z`. GitHub Actions
(`.github/workflows/release.yml`) build macOS / Windows / Linux, đóng gói, tạo SHA256SUMS và GitHub Release.

Mở `frontend` bằng `npm run dev` cũng chạy được trong trình duyệt (tải PDF xuống thay cho hộp lưu).

## Giấy phép font

Playwrite Việt Nam, Be Vietnam Pro: SIL Open Font License (`frontend/src/assets/fonts/OFL-*.txt`).
