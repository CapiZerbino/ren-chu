<script setup lang="ts">
// Thanh nổi phía trên vùng xem trước khi đang chọn một phần tử trang trí:
// chỉnh nhanh cỡ, độ đậm, căn giữa, xoá. Phím: mũi tên nhích 0,5 mm (Shift: 2 mm), Delete xoá, Esc bỏ chọn.
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AlignCenter, Trash2, X } from 'lucide-vue-next'
import { decor, selectedId } from '@/lib/decor-settings'
import { decorLayer, pageSize } from '@/lib/worksheet-store'
import { moveTo, removeSelected, selectedKind } from '@/lib/decor-actions'

const kind = computed(() => selectedKind())
const field = computed(() => decor.fields.find((f) => f.id === selectedId.value))
const logo = computed(() => decor.logos.find((l) => l.id === selectedId.value))
const name = computed(() =>
  kind.value === 'title' ? 'Tiêu đề' : kind.value === 'field' ? `Ô “${field.value?.label.replace(/:$/, '')}”` : 'Logo',
)
const lineMm = computed({
  get: () => Math.round((field.value?.lineFrac ?? 0) * pageSize.value.width),
  set: (v: number) => field.value && (field.value.lineFrac = v / pageSize.value.width),
})

function onKey(e: KeyboardEvent) {
  if (!selectedId.value) return
  const t = e.target as HTMLElement
  if (t.closest('input, textarea, select, [contenteditable]')) return
  if (e.key === 'Escape') {
    selectedId.value = null
    return
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    removeSelected()
    return
  }
  const step = e.shiftKey ? 2 : 0.5
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
  const box = decorLayer.value.boxes.find((b) => b.id === selectedId.value)
  if (!d || !box) return
  e.preventDefault()
  moveTo(box, box.x + d[0], box.y + d[1], pageSize.value)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    v-if="kind"
    class="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background/95 py-1 pl-4 pr-1.5 text-xs shadow-md backdrop-blur"
  >
    <span class="max-w-40 truncate font-medium">{{ name }}</span>
    <template v-if="kind === 'title'">
      <label class="flex items-center gap-1.5 text-muted-foreground">
        Cỡ
        <input v-model.number="decor.title.sizeMm" type="range" min="3" max="20" step="0.2" class="w-24 accent-[hsl(var(--primary))]" />
      </label>
      <button
        class="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-accent disabled:opacity-40"
        :disabled="decor.title.centered"
        @click="decor.title.centered = true"
      >
        <AlignCenter class="h-3.5 w-3.5" /> Căn giữa
      </button>
    </template>
    <template v-else-if="kind === 'field' && field">
      <label class="flex items-center gap-1.5 text-muted-foreground">
        Dòng chấm
        <input v-model.number="lineMm" type="range" min="5" :max="Math.round(pageSize.width)" class="w-24 accent-[hsl(var(--primary))]" />
        <span class="w-10 tabular-nums">{{ lineMm }} mm</span>
      </label>
    </template>
    <template v-else-if="kind === 'logo' && logo">
      <label class="flex items-center gap-1.5 text-muted-foreground">
        Cỡ
        <input v-model.number="logo.widthMm" type="range" min="5" :max="Math.round(pageSize.width)" class="w-24 accent-[hsl(var(--primary))]" />
      </label>
      <label class="flex items-center gap-1.5 text-muted-foreground">
        Đậm
        <input v-model.number="logo.opacity" type="range" min="0.1" max="1" step="0.05" class="w-16 accent-[hsl(var(--primary))]" />
      </label>
    </template>
    <button
      v-if="kind !== 'title'"
      class="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive"
      aria-label="Xoá"
      title="Xoá (Delete)"
      @click="removeSelected"
    >
      <Trash2 class="h-3.5 w-3.5" />
    </button>
    <button
      class="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      aria-label="Bỏ chọn"
      title="Bỏ chọn (Esc)"
      @click="selectedId = null"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
</template>
