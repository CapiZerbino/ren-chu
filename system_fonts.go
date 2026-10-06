package main

import (
	"encoding/base64"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
)

// SystemFont là một file font cài trên máy (để chọn làm chữ mẫu).
type SystemFont struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

const maxFontBytes = 30 << 20

var fontExts = map[string]bool{".ttf": true, ".otf": true, ".ttc": true}

// fontDirs là các thư mục font chuẩn của từng hệ điều hành.
func fontDirs() []string {
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "darwin":
		return []string{"/System/Library/Fonts", "/Library/Fonts", filepath.Join(home, "Library/Fonts")}
	case "windows":
		dirs := []string{filepath.Join(os.Getenv("WINDIR"), "Fonts")}
		if la := os.Getenv("LOCALAPPDATA"); la != "" {
			dirs = append(dirs, filepath.Join(la, "Microsoft", "Windows", "Fonts"))
		}
		return dirs
	default:
		return []string{"/usr/share/fonts", "/usr/local/share/fonts", filepath.Join(home, ".local/share/fonts"), filepath.Join(home, ".fonts")}
	}
}

// ListSystemFonts liệt kê font .ttf/.otf/.ttc cài trên máy, sắp theo tên.
// Bỏ qua thư mục không đọc được; font trùng tên chỉ giữ một.
func (a *App) ListSystemFonts() []SystemFont {
	return scanFontDirs(fontDirs())
}

func scanFontDirs(dirs []string) []SystemFont {
	seen := map[string]bool{}
	var out []SystemFont
	for _, dir := range dirs {
		_ = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				if d != nil && d.IsDir() {
					return fs.SkipDir
				}
				return nil
			}
			if d.IsDir() || !fontExts[strings.ToLower(filepath.Ext(path))] || strings.HasPrefix(d.Name(), ".") {
				return nil
			}
			name := fontNameFromPath(path)
			if seen[strings.ToLower(name)] {
				return nil
			}
			seen[strings.ToLower(name)] = true
			out = append(out, SystemFont{Name: name, Path: path})
			return nil
		})
	}
	sort.Slice(out, func(i, j int) bool { return strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name) })
	return out
}

// ReadFontFile đọc một file font (chỉ nhận đuôi font, tối đa 30 MB), trả base64.
func (a *App) ReadFontFile(path string) (string, error) {
	if !fontExts[strings.ToLower(filepath.Ext(path))] {
		return "", fmt.Errorf("không phải file font (.ttf, .otf, .ttc)")
	}
	info, err := os.Stat(path)
	if err != nil {
		return "", fmt.Errorf("không tìm thấy font: %w", err)
	}
	if info.Size() > maxFontBytes {
		return "", fmt.Errorf("file font quá lớn (trên 30 MB)")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("không đọc được font: %w", err)
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// fontNameFromPath: "HP001 4 hang-Regular.ttf" → "HP001 4 hang Regular".
func fontNameFromPath(path string) string {
	name := strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
	name = strings.NewReplacer("_", " ", "-", " ").Replace(name)
	return strings.Join(strings.Fields(name), " ")
}
