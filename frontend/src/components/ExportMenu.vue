<script setup lang="ts">
// Nút "Xuất file" + menu chọn định dạng (PDF, Word, PNG, JPG, SVG).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown, FileDown, FileImage, FileText, FileType2, Loader2, PenTool } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { EXPORT_FORMATS, type ExportFormat } from '@/lib/export-formats'

defineProps<{ busy: boolean; label: string; pageCount: number }>()
const emit = defineEmits<{ export: [format: ExportFormat] }>()

const icons = { pdf: FileText, docx: FileType2, png: FileImage, jpg: FileImage, svg: PenTool }
const open = ref(false)
const root = ref<HTMLElement>()

function pick(f: ExportFormat) {
  open.value = false
  emit('export', f)
}
const onDoc = (e: MouseEvent) => open.value && !root.value?.contains(e.target as Node) && (open.value = false)
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (open.value = false)
onMounted(() => {
  document.addEventListener('mousedown', onDoc)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDoc)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="relative">
    <Button size="sm" :disabled="busy || !pageCount" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
      <Loader2 v-if="busy" class="h-4 w-4 animate-spin" />
      <FileDown v-else class="h-4 w-4" />
      {{ label }}
      <ChevronDown v-if="!busy" class="-mr-1 h-3.5 w-3.5 opacity-80" />
    </Button>
    <div
      v-if="open"
      role="menu"
      class="absolute right-0 top-full z-40 mt-1.5 w-80 overflow-hidden rounded-lg border bg-popover py-1 shadow-xl"
    >
      <button
        v-for="f in EXPORT_FORMATS"
        :key="f.id"
        role="menuitem"
        class="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        @click="pick(f.id)"
      >
        <component :is="icons[f.id]" class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span class="min-w-0">
          <span class="block text-sm font-medium">
            {{ f.label }}
            <span v-if="f.perPage && pageCount > 1" class="font-normal text-muted-foreground">· {{ pageCount }} file</span>
          </span>
          <span class="block text-xs text-muted-foreground">{{ f.hint }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
