<script setup lang="ts">
defineProps<{ label: string; value?: string }>()
</script>

<template>
  <div class="mb-1.5 flex items-baseline justify-between text-xs">
    <span class="font-medium text-foreground/80">{{ label }}</span>
    <span v-if="value" class="tabular-nums text-muted-foreground">{{ value }}</span>
  </div>
</template>
