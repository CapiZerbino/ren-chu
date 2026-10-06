<script setup lang="ts">
// Lớp tay nắm đặt chồng lên một trang: bấm để chọn, kéo để di chuyển, kéo ô vuông
// ở góc để đổi cỡ. Mọi trang dùng chung bố cục nên kéo ở trang nào cũng được.
import { ref } from 'vue'
import { selectedId } from '@/lib/decor-settings'
import { decorLayer, pageSize } from '@/lib/worksheet-store'
import { moveTo, resizeBy, snapshot } from '@/lib/decor-actions'
import type { DecorBox } from '@/lib/decor-svg'

const props = defineProps<{ pxPerMm: number }>()
const showGuide = ref(false)

function startDrag(e: PointerEvent, box: DecorBox, mode: 'move' | 'resize') {
  if (e.button !== 0) return
  e.preventDefault()
  e.stopPropagation()
  selectedId.value = box.id
  const sx = e.clientX
  const sy = e.clientY
  const start = snapshot(box)
  const page = pageSize.value
  const onMove = (ev: PointerEvent) => {
    const dx = (ev.clientX - sx) / props.pxPerMm
    const dy = (ev.clientY - sy) / props.pxPerMm
    if (mode === 'move') showGuide.value = moveTo(box, box.x + dx, box.y + dy, page)
    else resizeBy(box, start, dx, page)
  }
  const onUp = () => {
    showGuide.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

const LABELS: Record<DecorBox['kind'], string> = { title: 'Tiêu đề', field: 'Ô thông tin', logo: 'Logo' }
</script>

<template>
  <div class="absolute inset-0 touch-none" @pointerdown.self="selectedId = null">
    <div
      v-if="showGuide"
      class="pointer-events-none absolute bottom-0 top-0 w-px bg-primary/70"
      :style="{ left: `${(pageSize.width / 2) * pxPerMm}px` }"
    />
    <div
      v-for="b in decorLayer.boxes"
      :key="b.id"
      :title="`${LABELS[b.kind]} — kéo để di chuyển`"
      class="absolute cursor-move rounded-[2px]"
      :class="
        selectedId === b.id
          ? 'z-10 outline outline-2 outline-offset-2 outline-primary'
          : 'hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-dashed hover:outline-primary/70'
      "
      :style="{ left: `${b.x * pxPerMm}px`, top: `${b.y * pxPerMm}px`, width: `${b.w * pxPerMm}px`, height: `${b.h * pxPerMm}px` }"
      @pointerdown="startDrag($event, b, 'move')"
    >
      <div
        v-if="selectedId === b.id"
        class="absolute -bottom-2.5 -right-2.5 h-3 w-3 cursor-nwse-resize rounded-sm border-2 border-background bg-primary shadow"
        :title="b.kind === 'field' ? 'Kéo để đổi độ dài dòng chấm' : 'Kéo để đổi cỡ'"
        @pointerdown="startDrag($event, b, 'resize')"
      />
    </div>
  </div>
</template>
