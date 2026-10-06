<script setup lang="ts">
// Xem trước các trang như tờ giấy trên bàn. Mỗi trang chồng 3 lớp: ảnh nền → lưới + chữ mẫu
// → trang trí (watermark, logo, tiêu đề, ô thông tin), trên cùng là lớp tay nắm kéo thả.
import { computed, ref } from 'vue'
import { AlertTriangle, Loader2, Minus, Plus } from 'lucide-vue-next'
import DecorOverlay from './DecorOverlay.vue'
import SelectionToolbar from './SelectionToolbar.vue'
import { basePages, decorLayer, fontError, pageSize, ready, renderError, writingFont } from '@/lib/worksheet-store'
import { wrapPage } from '@/lib/svg-glyphs'

const MM_TO_PX = 96 / 25.4
const zoom = ref(0.8)
const zoomPct = computed(() => `${Math.round(zoom.value * 100)}%`)
const setZoom = (z: number) => (zoom.value = Math.min(2, Math.max(0.3, Math.round(z * 10) / 10)))
const pxPerMm = computed(() => MM_TO_PX * zoom.value)

const layer = (inner: string) => wrapPage(pageSize.value.width, pageSize.value.height, [inner], { background: false })
const underSvg = computed(() => (decorLayer.value.under ? layer(decorLayer.value.under) : ''))
const overSvg = computed(() => layer(decorLayer.value.over))
const pageSvgs = computed(() => basePages.value.map(layer))
const LAYER = 'pointer-events-none absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full'
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col bg-desk">
    <SelectionToolbar />
    <div class="flex-1 overflow-auto">
      <div v-if="!ready && fontError" class="m-8 flex items-start gap-2 rounded-lg border border-destructive/40 bg-background p-4 text-sm">
        <AlertTriangle class="mt-0.5 h-4 w-4 text-destructive" />
        {{ fontError }}
      </div>
      <div v-else-if="!ready || (!writingFont && !basePages.length)" class="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 class="h-4 w-4 animate-spin" /> Đang nạp chữ mẫu…
      </div>
      <div v-else class="flex flex-col items-center gap-6 px-8 py-8">
        <div
          v-if="renderError"
          class="flex items-start gap-2 rounded-lg border border-destructive/40 bg-background p-3 text-sm"
          role="alert"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          {{ renderError }}
        </div>
        <figure v-for="(svg, i) in pageSvgs" :key="i" class="flex flex-col items-center gap-2">
          <div
            class="relative bg-white shadow-md ring-1 ring-black/5"
            :style="{ width: `${pageSize.width * pxPerMm}px`, height: `${pageSize.height * pxPerMm}px` }"
          >
            <div v-if="underSvg" :class="LAYER" v-html="underSvg" />
            <div :class="LAYER" v-html="svg" />
            <div :class="LAYER" v-html="overSvg" />
            <DecorOverlay :px-per-mm="pxPerMm" />
          </div>
          <figcaption class="text-xs tabular-nums text-muted-foreground">Trang {{ i + 1 }} / {{ pageSvgs.length }}</figcaption>
        </figure>
      </div>
    </div>

    <div
      class="absolute bottom-4 right-6 flex items-center gap-1 rounded-full border bg-background/95 px-1.5 py-1 shadow-sm backdrop-blur"
    >
      <button
        class="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent"
        aria-label="Thu nhỏ"
        @click="setZoom(zoom - 0.1)"
      >
        <Minus class="h-3.5 w-3.5" />
      </button>
      <button class="w-12 text-xs tabular-nums text-muted-foreground" title="Về 80%" @click="setZoom(0.8)">{{ zoomPct }}</button>
      <button
        class="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent"
        aria-label="Phóng to"
        @click="setZoom(zoom + 0.1)"
      >
        <Plus class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>
