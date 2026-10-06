<script setup lang="ts" generic="T extends string | number | boolean">
// Nhóm nút chọn một trong vài lựa chọn (thay cho select khi ít lựa chọn).
import { cn } from '@/lib/utils'

defineProps<{ options: { value: T; label: string; title?: string }[]; cols?: number }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    class="grid gap-1 rounded-md bg-muted p-1"
    :style="{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }"
    role="radiogroup"
  >
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :title="o.title"
      :class="
        cn(
          'h-7 truncate rounded px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          model === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )
      "
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
