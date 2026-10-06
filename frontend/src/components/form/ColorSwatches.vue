<script setup lang="ts">
// Chọn màu chữ in trên giấy (màu của trang in, không phải màu giao diện).
import { TEXT_COLORS } from '@/lib/decor-settings'
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex gap-1.5" role="radiogroup">
    <button
      v-for="c in TEXT_COLORS"
      :key="c.value"
      type="button"
      role="radio"
      :aria-checked="model === c.value"
      :aria-label="c.label"
      :title="c.label"
      class="h-6 w-6 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :class="model === c.value ? 'scale-110 border-primary' : 'border-transparent hover:scale-105'"
      :style="{ background: c.value }"
      @click="model = c.value"
    />
  </div>
</template>
