# HP001 Rèn Chữ — dựng lại font

Font HP001 gốc (HP Design VN) cất sẵn chữ ghép có nét nối (ói, ơi, ôm, oa…) ở các mã lạ (ā, ő, Ơ…),
nên phải dùng công cụ "chuyển mã"; một số cặp chữ (sau "s", sau chữ hoa B, C, D, O, T…) còn hở nét.
Bản Rèn Chữ thêm OpenType `calt` (chữ ghép phụ âm đôi, chữ ghép o/ô/ơ, chọn dạng chữ theo chữ đứng
trước/sau) và `kern` (đặt chữ sau theo đầu nét ra của chữ trước) để gõ chữ Unicode bình thường là ra chữ
liền nét.

- `hp001-connection-rules.json`: quy tắc theo mã ký tự
  - `ligatures`: chuỗi chữ → mã glyph chữ ghép trong HP001 (ch, kh, nh, gh, ph, th; o/ô/ơ + chữ sau)
  - `medial`: e, ê (kèm dấu thanh) đứng sau một chữ khác → dạng thanh ngang bắt đầu ở giữa thân
  - `beforeLetter`: b, v, o còn chữ khác theo sau → dạng nét ra thấp (b, v chỉ khi trước e, ê, a, o…)
  - `afterHigh`: i, u, ư, y (kèm dấu thanh) đứng sau b, v → dạng bắt đầu từ đỉnh nét sổ
  Bảng này được lập bằng cách so hình glyph, đọc cấu trúc glyph ghép (gốc + dấu thanh) và đo chỗ nối
  (biến thể nào nối liền mạch nhất sau khi kéo sát), rồi kiểm bằng mắt.
- `build-hp001-calt.py`: đọc font gốc + bảng quy tắc, thêm GSUB; vẽ glyph ở độ phân giải cao, rút về
  đường xương để tìm đầu nét ra, rồi thêm GPOS kern đặt chữ sau theo đầu nét; nới bề rộng N/V/S/P; đổi tên.

```sh
python3 build-hp001-calt.py HP001_4_hang_normal.ttf hp001-connection-rules.json HP001-RenChu-Regular.ttf "HP001 Rèn Chữ" Regular
python3 build-hp001-calt.py HP001_4_hang_bold.ttf   hp001-connection-rules.json HP001-RenChu-Bold.ttf    "HP001 Rèn Chữ" Bold
```

Cần `fonttools`, `numpy`, `scipy`, `Pillow`, `scikit-image`. Font gốc không kèm trong repo; kết quả nằm ở `frontend/src/assets/fonts/`.
