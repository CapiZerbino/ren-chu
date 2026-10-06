package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App là các hàm Go mà giao diện gọi được (window.go.main.App.*).
type App struct {
	ctx context.Context
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

// ExportFile là một file xuất ra từ giao diện (PDF, ảnh, SVG, Word), dữ liệu base64.
type ExportFile struct {
	Name string `json:"name"`
	Data string `json:"data"`
}

// SaveExport lưu file xuất. Một file: hỏi chỗ lưu như thường. Nhiều file (mỗi trang
// một ảnh): hỏi thư mục rồi ghi cả loạt, trùng tên thì thêm số. Trả về đường dẫn
// file hoặc thư mục đã lưu; chuỗi rỗng nếu người dùng bấm Huỷ.
func (a *App) SaveExport(files []ExportFile, filterName, ext string) (string, error) {
	if len(files) == 0 {
		return "", fmt.Errorf("không có gì để lưu")
	}
	ext = strings.ToLower(strings.TrimPrefix(ext, "."))
	if len(files) == 1 {
		f := files[0]
		path, err := wruntime.SaveFileDialog(a.ctx, wruntime.SaveDialogOptions{
			Title:           "Lưu mẫu luyện viết",
			DefaultFilename: sanitizeFileName(strings.TrimSuffix(f.Name, "."+ext)) + "." + ext,
			Filters:         []wruntime.FileFilter{{DisplayName: filterName, Pattern: "*." + ext}},
		})
		if err != nil || path == "" {
			return "", err
		}
		if !strings.HasSuffix(strings.ToLower(path), "."+ext) {
			path += "." + ext
		}
		return path, writeB64(path, f.Data)
	}
	dir, err := wruntime.OpenDirectoryDialog(a.ctx, wruntime.OpenDialogOptions{
		Title:                "Chọn thư mục để lưu " + fmt.Sprint(len(files)) + " file",
		CanCreateDirectories: true,
	})
	if err != nil || dir == "" {
		return "", err
	}
	for _, f := range files {
		name := sanitizeFileName(strings.TrimSuffix(f.Name, "."+ext)) + "." + ext
		if err := writeB64(uniquePath(filepath.Join(dir, name)), f.Data); err != nil {
			return "", err
		}
	}
	return dir, nil
}

func writeB64(path, dataB64 string) error {
	data, err := base64.StdEncoding.DecodeString(dataB64)
	if err != nil {
		return fmt.Errorf("dữ liệu file hỏng: %w", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("không ghi được %s: %w", filepath.Base(path), err)
	}
	return nil
}

// uniquePath thêm " (2)", " (3)"… nếu file đã có, để không ghi đè file cũ của người dùng.
func uniquePath(path string) string {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return path
	}
	ext := filepath.Ext(path)
	base := strings.TrimSuffix(path, ext)
	for i := 2; ; i++ {
		p := fmt.Sprintf("%s (%d)%s", base, i, ext)
		if _, err := os.Stat(p); os.IsNotExist(err) {
			return p
		}
	}
}

// OpenPDFForPrint ghi PDF ra thư mục tạm rồi mở bằng trình xem PDF mặc định
// của máy (Preview, Edge, ...) để người dùng in với hộp in quen thuộc.
func (a *App) OpenPDFForPrint(dataB64, name string) error {
	data, err := base64.StdEncoding.DecodeString(dataB64)
	if err != nil {
		return fmt.Errorf("dữ liệu PDF hỏng: %w", err)
	}
	dir := filepath.Join(os.TempDir(), "ren-chu")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	path := filepath.Join(dir, fmt.Sprintf("%s-%d.pdf", sanitizeFileName(name), time.Now().Unix()))
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("không ghi được file tạm: %w", err)
	}
	return openWithSystem(path)
}

// FontFile là font người dùng tự chọn (ví dụ bộ font chữ mẫu tiểu học của trường).
type FontFile struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Data string `json:"data"` // base64
}

// PickFont mở hộp chọn file .ttf/.otf, trả về tên + nội dung base64.
// Trả về nil nếu người dùng bấm Huỷ.
func (a *App) PickFont() (*FontFile, error) {
	path, err := wruntime.OpenFileDialog(a.ctx, wruntime.OpenDialogOptions{
		Title:   "Chọn font chữ mẫu",
		Filters: []wruntime.FileFilter{{DisplayName: "Font (*.ttf, *.otf, *.ttc)", Pattern: "*.ttf;*.otf;*.ttc;*.TTF;*.OTF;*.TTC"}},
	})
	if err != nil || path == "" {
		return nil, err
	}
	data, err := a.ReadFontFile(path)
	if err != nil {
		return nil, err
	}
	return &FontFile{Name: fontNameFromPath(path), Path: path, Data: data}, nil
}

func openWithSystem(path string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", path)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", path)
	default:
		cmd = exec.Command("xdg-open", path)
	}
	return cmd.Start()
}

// sanitizeFileName bỏ ký tự không hợp lệ trong tên file trên Windows/macOS/Linux.
func sanitizeFileName(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Map(func(r rune) rune {
		if strings.ContainsRune(`<>:"/\|?*`, r) || r < 32 {
			return '-'
		}
		return r
	}, s)
	if s == "" {
		return "mau-luyen-viet"
	}
	if len([]rune(s)) > 80 {
		s = string([]rune(s)[:80])
	}
	return s
}
