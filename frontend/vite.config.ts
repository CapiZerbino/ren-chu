import { writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const OUT_DIR = 'dist'

// Vite xoá sạch thư mục build mỗi lần build → ghi lại file giữ chỗ để `go build`
// (go:embed all:frontend/<OUT_DIR>) luôn có ít nhất một file.
function keepOutPlaceholder(): Plugin {
  return {
    name: 'renchu-keep-out-placeholder',
    apply: 'build',
    closeBundle() {
      writeFileSync(r(`./${OUT_DIR}/gitkeep`), '')
    },
  }
}

// Chỉ khi chạy dev: CSP cho phép websocket/HTTP localhost (HMR của Vite, IPC của `wails dev`).
function devCSP(): Plugin {
  return {
    name: 'renchu-dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("connect-src 'self'", "connect-src 'self' ws://localhost:* http://localhost:*")
    },
  }
}

export default defineConfig({
  plugins: [vue(), keepOutPlaceholder(), devCSP()],
  resolve: { alias: { '@': r('./src') } },
  // harfbuzzjs dùng top-level await để nạp wasm
  build: { outDir: OUT_DIR, emptyOutDir: true, target: 'esnext' },
  optimizeDeps: { exclude: ['harfbuzzjs'] },
  server: { port: 5391, strictPort: true },
})
