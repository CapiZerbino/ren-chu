package main

import (
	"encoding/base64"
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// Ảnh người dùng chèn (logo trường, ảnh nền) lưu ở thư mục cấu hình của app để
// lần mở sau vẫn còn: macOS ~/Library/Application Support/RenChu/assets,
// Windows %AppData%\RenChu\assets, Linux ~/.config/RenChu/assets.

const maxImageBytes = 25 << 20

var assetIDPattern = regexp.MustCompile(`^[a-z0-9-]{1,64}$`)

var imageExts = map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".webp": true, ".gif": true, ".svg": true, ".bmp": true}

// assetsDir có thể đổi trong test.
var assetsDir = func() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "RenChu", "assets"), nil
}

func assetPath(id string) (string, error) {
	if !assetIDPattern.MatchString(id) {
		return "", fmt.Errorf("mã ảnh không hợp lệ")
	}
	dir, err := assetsDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, id), nil
}

// SaveAsset lưu ảnh (data URL) theo mã.
func (a *App) SaveAsset(id, dataURL string) error {
	p, err := assetPath(id)
	if err != nil {
		return err
	}
	if len(dataURL) > maxImageBytes*4/3+1024 {
		return fmt.Errorf("ảnh quá lớn")
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	return os.WriteFile(p, []byte(dataURL), 0o644)
}

// LoadAsset đọc ảnh đã lưu; chuỗi rỗng nếu không còn.
func (a *App) LoadAsset(id string) (string, error) {
	p, err := assetPath(id)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(p)
	if os.IsNotExist(err) {
		return "", nil
	}
	return string(data), err
}

// DeleteAsset xoá ảnh không còn dùng.
func (a *App) DeleteAsset(id string) error {
	p, err := assetPath(id)
	if err != nil {
		return err
	}
	if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// PickedImage là ảnh người dùng chọn từ máy, dạng data URL.
type PickedImage struct {
	Name    string `json:"name"`
	DataURL string `json:"dataUrl"`
}

// PickImages mở hộp chọn nhiều ảnh (PNG, JPG, WebP, GIF, SVG, BMP).
func (a *App) PickImages(title string) ([]PickedImage, error) {
	paths, err := wruntime.OpenMultipleFilesDialog(a.ctx, wruntime.OpenDialogOptions{
		Title: title,
		Filters: []wruntime.FileFilter{{
			DisplayName: "Ảnh (*.png, *.jpg, *.webp, *.svg…)",
			Pattern:     "*.png;*.jpg;*.jpeg;*.webp;*.gif;*.svg;*.bmp;*.PNG;*.JPG;*.JPEG",
		}},
	})
	if err != nil {
		return nil, err
	}
	out := make([]PickedImage, 0, len(paths))
	for _, p := range paths {
		img, err := readImageFile(p)
		if err != nil {
			return nil, err
		}
		out = append(out, img)
	}
	return out, nil
}

func readImageFile(path string) (PickedImage, error) {
	ext := strings.ToLower(filepath.Ext(path))
	if !imageExts[ext] {
		return PickedImage{}, fmt.Errorf("%s không phải file ảnh", filepath.Base(path))
	}
	info, err := os.Stat(path)
	if err != nil {
		return PickedImage{}, err
	}
	if info.Size() > maxImageBytes {
		return PickedImage{}, fmt.Errorf("ảnh %s quá lớn (trên 25 MB)", filepath.Base(path))
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return PickedImage{}, fmt.Errorf("không đọc được %s: %w", filepath.Base(path), err)
	}
	mt := mime.TypeByExtension(ext)
	if ext == ".svg" {
		mt = "image/svg+xml"
	}
	if mt == "" {
		mt = "application/octet-stream"
	}
	return PickedImage{
		Name:    strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)),
		DataURL: "data:" + mt + ";base64," + base64.StdEncoding.EncodeToString(data),
	}, nil
}
