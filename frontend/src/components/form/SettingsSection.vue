<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section class="space-y-3 border-b px-5 py-4 last:border-b-0">
    <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ title }}</h2>
    <slot />
  </section>
</template>
