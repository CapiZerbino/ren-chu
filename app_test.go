package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSanitizeFileName(t *testing.T) {
	cases := map[string]string{
		"Luyện viết: chữ a/b": "Luyện viết- chữ a-b",
		"   ":                 "mau-luyen-viet",
		"Mẫu?*":               "Mẫu--",
	}
	for in, want := range cases {
		if got := sanitizeFileName(in); got != want {
			t.Errorf("sanitizeFileName(%q) = %q, muốn %q", in, got, want)
		}
	}
}

func TestUniquePath(t *testing.T) {
	dir := t.TempDir()
	p := filepath.Join(dir, "mau.png")
	if got := uniquePath(p); got != p {
		t.Fatalf("file chưa có thì giữ nguyên, được %q", got)
	}
	os.WriteFile(p, []byte("x"), 0o644)
	if got := uniquePath(p); got != filepath.Join(dir, "mau (2).png") {
		t.Fatalf("trùng tên phải thêm (2), được %q", got)
	}
}

func TestScanFontDirs(t *testing.T) {
	dir := t.TempDir()
	os.MkdirAll(filepath.Join(dir, "sub"), 0o755)
	for _, n := range []string{"HP001_4-hang.ttf", "sub/Arial.TTF", "readme.txt", ".hidden.otf", "sub/hp001 4 hang.otf"} {
		os.WriteFile(filepath.Join(dir, n), []byte("x"), 0o644)
	}
	got := scanFontDirs([]string{dir, filepath.Join(dir, "khong-co")})
	if len(got) != 2 || got[0].Name != "Arial" || got[1].Name != "HP001 4 hang" {
		t.Fatalf("danh sách font sai: %+v", got)
	}
}

func TestReadFontFileRejectsNonFont(t *testing.T) {
	p := filepath.Join(t.TempDir(), "a.txt")
	os.WriteFile(p, []byte("x"), 0o644)
	if _, err := (&App{}).ReadFontFile(p); err == nil {
		t.Fatal("phải từ chối file không phải font")
	}
}
