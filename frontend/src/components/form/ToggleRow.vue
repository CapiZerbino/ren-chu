<script setup lang="ts">
// Một dòng bật/tắt: nhãn bên trái, công tắc bên phải.
defineProps<{ label: string; hint?: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="flex cursor-pointer items-center justify-between gap-3 py-1">
    <span class="min-w-0">
      <span class="block text-sm">{{ label }}</span>
      <span v-if="hint" class="block text-xs text-muted-foreground">{{ hint }}</span>
    </span>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-label="label"
      class="relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :class="model ? 'bg-primary' : 'bg-input'"
      @click="model = !model"
    >
      <span
        class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform duration-150"
        :class="model ? 'translate-x-4' : ''"
      />
    </button>
  </label>
</template>
