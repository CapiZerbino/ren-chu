<script setup lang="ts">
// Thanh cài đặt bên trái: thanh tab dọc (Nội dung · Chữ · Giấy · Trang trí), mỗi lần hiện một bảng.
import type { Component } from 'vue'
import { CaseSensitive, Grid3x3, Move, Palette, PenLine, RotateCcw } from 'lucide-vue-next'
import ContentSettings from './ContentSettings.vue'
import LetterStyleSettings from './LetterStyleSettings.vue'
import PaperSettings from './PaperSettings.vue'
import HeaderDecorSettings from './HeaderDecorSettings.vue'
import ImageDecorSettings from './ImageDecorSettings.vue'
import WatermarkSettings from './WatermarkSettings.vue'
import { resetSettings } from '@/lib/worksheet-settings'
import { remembered } from '@/lib/ui-memory'
import { cn } from '@/lib/utils'

type Tab = 'noi-dung' | 'chu' | 'giay' | 'trang-tri'
const TABS: { id: Tab; label: string; title: string; icon: Component }[] = [
  { id: 'noi-dung', label: 'Nội dung', title: 'Chữ cái, vần, từ, câu và kiểu bài', icon: PenLine },
  { id: 'chu', label: 'Chữ', title: 'Font, cỡ chữ, chữ để tô, màu mực', icon: CaseSensitive },
  { id: 'giay', label: 'Giấy', title: 'Khổ giấy và dòng kẻ', icon: Grid3x3 },
  { id: 'trang-tri', label: 'Trang trí', title: 'Tiêu đề, ô thông tin, logo, ảnh nền, watermark', icon: Palette },
]
const tab = remembered<Tab>('sidebar.tab', 'noi-dung')
const current = () => TABS.find((t) => t.id === tab.value) ?? TABS[0]
</script>

<template>
  <aside class="flex shrink-0 border-r bg-background">
    <nav class="flex w-[68px] shrink-0 flex-col items-stretch gap-1 border-r bg-muted/40 px-1.5 py-2" aria-label="Nhóm cài đặt">
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        :title="t.title"
        :aria-current="tab === t.id ? 'page' : undefined"
        :class="
          cn(
            'flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tab === t.id ? 'bg-background text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
          )
        "
        @click="tab = t.id"
      >
        <component :is="t.icon" class="h-[18px] w-[18px]" />
        {{ t.label }}
      </button>
      <button
        type="button"
        class="mt-auto flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] leading-tight text-muted-foreground hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Về cài đặt mặc định (giữ logo, tiêu đề, ô thông tin)"
        @click="resetSettings"
      >
        <RotateCcw class="h-4 w-4" />
        Mặc định
      </button>
    </nav>

    <div class="flex w-[300px] flex-col">
      <header class="border-b px-4 py-3">
        <h2 class="text-sm font-semibold">{{ current().label }}</h2>
        <p class="text-xs text-muted-foreground">{{ current().title }}</p>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <ContentSettings v-if="tab === 'noi-dung'" />
        <LetterStyleSettings v-else-if="tab === 'chu'" />
        <PaperSettings v-else-if="tab === 'giay'" />
        <template v-else>
          <p class="mx-4 mt-3 flex items-start gap-1.5 rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
            <Move class="mt-px h-3.5 w-3.5 shrink-0" />
            Kéo tiêu đề, ô thông tin, logo trên trang để đổi chỗ; kéo góc để đổi cỡ.
          </p>
          <HeaderDecorSettings />
          <ImageDecorSettings />
          <WatermarkSettings />
        </template>
      </div>
    </div>
  </aside>
</template>
