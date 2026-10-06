package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAssetRoundTrip(t *testing.T) {
	dir := t.TempDir()
	old := assetsDir
	assetsDir = func() (string, error) { return dir, nil }
	defer func() { assetsDir = old }()

	a := &App{}
	if err := a.SaveAsset("logo-1", "data:image/png;base64,AAAA"); err != nil {
		t.Fatal(err)
	}
	got, err := a.LoadAsset("logo-1")
	if err != nil || got != "data:image/png;base64,AAAA" {
		t.Fatalf("đọc lại sai: %q %v", got, err)
	}
	if err := a.DeleteAsset("logo-1"); err != nil {
		t.Fatal(err)
	}
	if got, _ := a.LoadAsset("logo-1"); got != "" {
		t.Fatal("xoá rồi vẫn còn")
	}
	for _, bad := range []string{"../x", "A B", "", "a/b"} {
		if err := a.SaveAsset(bad, "x"); err == nil {
			t.Errorf("phải từ chối mã %q", bad)
		}
	}
}

func TestReadImageFile(t *testing.T) {
	dir := t.TempDir()
	p := filepath.Join(dir, "logo truong.PNG")
	os.WriteFile(p, []byte{1, 2, 3}, 0o644)
	img, err := readImageFile(p)
	if err != nil || img.Name != "logo truong" || !strings.HasPrefix(img.DataURL, "data:image/png;base64,") {
		t.Fatalf("đọc ảnh sai: %+v %v", img, err)
	}
	txt := filepath.Join(dir, "a.txt")
	os.WriteFile(txt, []byte("x"), 0o644)
	if _, err := readImageFile(txt); err == nil {
		t.Fatal("phải từ chối file không phải ảnh")
	}
}
