<script setup lang="ts">
// "Tuỳ chọn thêm": gom tuỳ chọn ít dùng, gập sẵn để bảng cài đặt gọn.
import { ChevronRight } from 'lucide-vue-next'
import { remembered } from '@/lib/ui-memory'

const props = withDefaults(defineProps<{ id: string; label?: string }>(), { label: 'Tuỳ chọn thêm' })
const open = remembered(`more.${props.id}`, false)
</script>

<template>
  <div class="rounded-md border border-dashed">
    <button
      type="button"
      class="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-expanded="open"
      @click="open = !open"
    >
      <ChevronRight class="h-3.5 w-3.5 transition-transform duration-150" :class="open ? 'rotate-90' : ''" />
      {{ label }}
    </button>
    <div v-if="open" class="space-y-3 border-t border-dashed px-3 py-3">
      <slot />
    </div>
  </div>
</template>
