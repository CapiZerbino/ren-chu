<script setup lang="ts">
// Xem trước các trang như tờ giấy trên bàn; phóng to / thu nhỏ.
import { computed, ref } from 'vue'
import { AlertTriangle, Loader2, Minus, Plus } from 'lucide-vue-next'
import { pages, renderError, labelFont, writingFont, fontError } from '@/lib/worksheet-store'

const MM_TO_PX = 96 / 25.4
const zoom = ref(0.8)
const zoomPct = computed(() => `${Math.round(zoom.value * 100)}%`)
const setZoom = (z: number) => (zoom.value = Math.min(2, Math.max(0.3, Math.round(z * 10) / 10)))
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col bg-desk">
    <div class="flex-1 overflow-auto">
      <div v-if="!labelFont && fontError" class="m-8 flex items-start gap-2 rounded-lg border border-destructive/40 bg-background p-4 text-sm">
        <AlertTriangle class="mt-0.5 h-4 w-4 text-destructive" />
        {{ fontError }}
      </div>
      <div v-else-if="!labelFont || (!writingFont && !pages.length)" class="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
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
        <figure v-for="(p, i) in pages" :key="i" class="flex flex-col items-center gap-2">
          <div
            class="bg-white shadow-md ring-1 ring-black/5 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
            :style="{ width: `${p.width * MM_TO_PX * zoom}px`, height: `${p.height * MM_TO_PX * zoom}px` }"
            v-html="p.svg"
          />
          <figcaption class="text-xs tabular-nums text-muted-foreground">Trang {{ i + 1 }} / {{ pages.length }}</figcaption>
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
