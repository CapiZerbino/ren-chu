<script setup lang="ts">
// Một nhóm cài đặt. Có `title` + `collapsible` thì thành mục gập/mở (nhớ trạng thái theo `id`).
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { remembered } from '@/lib/ui-memory'

const props = withDefaults(defineProps<{ title?: string; collapsible?: boolean; id?: string; defaultOpen?: boolean }>(), {
  defaultOpen: true,
})
const open = props.collapsible ? remembered(`section.${props.id ?? props.title}`, props.defaultOpen) : ref(true)
</script>

<template>
  <section class="border-b last:border-b-0">
    <button
      v-if="title && collapsible"
      type="button"
      class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ title }}
      <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform duration-150" :class="open ? 'rotate-180' : ''" />
    </button>
    <h2 v-else-if="title" class="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {{ title }}
    </h2>
    <div v-if="open" class="space-y-3 px-4 pb-4" :class="title ? 'pt-1' : 'pt-4'">
      <slot />
    </div>
  </section>
</template>
