<script setup lang="ts">
// Màn chính: thanh tiêu đề + bảng cài đặt bên trái + xem trước trang bên phải.
import { computed, onMounted, ref } from 'vue'
import { CheckCircle2, Loader2, Printer, RotateCcw, AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ContentSettings from '@/components/ContentSettings.vue'
import PaperSettings from '@/components/PaperSettings.vue'
import LetterStyleSettings from '@/components/LetterStyleSettings.vue'
import WorksheetPreview from '@/components/WorksheetPreview.vue'
import HeaderDecorSettings from '@/components/HeaderDecorSettings.vue'
import ImageDecorSettings from '@/components/ImageDecorSettings.vue'
import WatermarkSettings from '@/components/WatermarkSettings.vue'
import ExportMenu from '@/components/ExportMenu.vue'
import { basePages, composePages, initFonts, titleText } from '@/lib/worksheet-store'
import { resetSettings } from '@/lib/worksheet-settings'
import { buildPdf } from '@/lib/pdf-export'
import { isDesktop, openPdfForPrint, saveExport } from '@/lib/backend'
import { buildExport, formatInfo, type ExportFormat } from '@/lib/export-formats'

onMounted(initFonts)

const isMac = navigator.userAgent.includes('Mac')
const busy = ref<'' | 'save' | 'print'>('')
const progress = ref(0)
const notice = ref<{ ok: boolean; text: string } | null>(null)
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const pageCount = computed(() => basePages.value.length)

function notify(ok: boolean, text: string) {
  notice.value = { ok, text }
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = null), ok ? 5000 : 9000)
}

async function exportFile(format: ExportFormat) {
  if (busy.value || !pageCount.value) return
  busy.value = 'save'
  progress.value = 0
  try {
    const info = formatInfo(format)
    const title = titleText.value
    const files = await buildExport(format, composePages(), title, (n) => (progress.value = n))
    const where = await saveExport(files, info.filterName, info.ext, info.mime)
    if (where) {
      // Bản desktop trả về đường dẫn đã lưu; trình duyệt trả về "thư mục Tải về"
      const what = files.length > 1 ? `${files.length} file ${info.label}` : files[0].name
      notify(true, isDesktop() && files.length === 1 ? `Đã lưu ${where}` : `Đã lưu ${what} vào ${where}`)
    }
  } catch (e) {
    notify(false, `Không xuất được file: ${(e as Error).message}`)
  } finally {
    busy.value = ''
  }
}

async function printPdf() {
  if (busy.value || !pageCount.value) return
  busy.value = 'print'
  progress.value = 0
  try {
    const [pdf] = await buildExport('pdf', composePages(), titleText.value, (n) => (progress.value = n))
    await openPdfForPrint(pdf.data, titleText.value)
    notify(true, `Đã mở file PDF — bấm ${isMac ? '⌘P' : 'Ctrl+P'} để in, nhớ chọn tỉ lệ 100%`)
  } catch (e) {
    notify(false, `Không tạo được PDF: ${(e as Error).message}`)
  } finally {
    busy.value = ''
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <header
      class="flex h-12 shrink-0 items-center gap-3 border-b bg-background pr-3"
      :class="isMac ? 'pl-24' : 'pl-4'"
      style="--wails-draggable: drag"
    >
      <span class="font-hand text-lg leading-none text-primary">Rèn Chữ</span>
      <span class="text-xs text-muted-foreground">Mẫu luyện viết chữ tiếng Việt · tiểu học</span>
      <div class="ml-auto flex items-center gap-2" style="--wails-draggable: no-drag">
        <span class="mr-1 text-xs tabular-nums text-muted-foreground">{{ pageCount }} trang</span>
        <Button variant="outline" size="sm" :disabled="!!busy || !pageCount" @click="printPdf">
          <Loader2 v-if="busy === 'print'" class="h-4 w-4 animate-spin" />
          <Printer v-else class="h-4 w-4" />
          {{ busy === 'print' ? `Đang chuẩn bị ${progress}/${pageCount}` : 'In' }}
        </Button>
        <ExportMenu
          :busy="busy === 'save'"
          :page-count="pageCount"
          :label="busy === 'save' ? `Đang xuất ${progress}/${pageCount}` : 'Xuất file'"
          @export="exportFile"
        />
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="flex w-[360px] shrink-0 flex-col border-r bg-background">
        <div class="min-h-0 flex-1 overflow-y-auto">
          <ContentSettings />
          <LetterStyleSettings />
          <PaperSettings />
          <HeaderDecorSettings />
          <ImageDecorSettings />
          <WatermarkSettings />
        </div>
        <div class="border-t px-5 py-2.5">
          <button
            class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            @click="resetSettings"
          >
            <RotateCcw class="h-3.5 w-3.5" /> Về cài đặt mặc định
          </button>
        </div>
      </aside>

      <WorksheetPreview />
    </div>

    <transition
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150"
    >
      <div
        v-if="notice"
        class="fixed bottom-5 left-1/2 z-50 flex max-w-xl -translate-x-1/2 items-start gap-2 rounded-lg border bg-popover px-4 py-2.5 text-sm shadow-xl"
        role="status"
      >
        <CheckCircle2 v-if="notice.ok" class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <AlertTriangle v-else class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <span class="break-all">{{ notice.text }}</span>
      </div>
    </transition>
  </div>
</template>
