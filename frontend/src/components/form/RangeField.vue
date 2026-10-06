<script setup lang="ts">
// Thanh trượt có nhãn và giá trị hiển thị.
import FieldLabel from './FieldLabel.vue'
defineProps<{ label: string; display: string; min: number; max: number; step?: number }>()
const model = defineModel<number>({ required: true })
</script>

<template>
  <div>
    <FieldLabel :label="label" :value="display" />
    <input
      v-model.number="model"
      type="range"
      :min="min"
      :max="max"
      :step="step ?? 1"
      :aria-label="label"
      class="w-full accent-[hsl(var(--primary))]"
    />
  </div>
</template>
