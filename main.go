// Rèn Chữ — phần mềm tạo mẫu luyện viết chữ tiếng Việt cho học sinh tiểu học.
// Vỏ Wails v2: Go ở đây (lưu file, mở PDF để in, đọc font), giao diện Vue ở frontend/.
package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

// frontend/dist do `wails build` / `npm run build` sinh ra.
//
//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()
	err := wails.Run(&options.App{
		Title:            "Rèn Chữ",
		Width:            1280,
		Height:           820,
		MinWidth:         1040,
		MinHeight:        640,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.startup,
		Mac: &mac.Options{
			TitleBar:   mac.TitleBarHiddenInset(),
			Appearance: mac.DefaultAppearance,
			About: &mac.AboutInfo{
				Title:   "Rèn Chữ",
				Message: "Tạo mẫu luyện viết chữ tiếng Việt cho học sinh tiểu học.",
			},
		},
		Bind: []interface{}{app},
	})
	if err != nil {
		log.Fatal(err)
	}
}
