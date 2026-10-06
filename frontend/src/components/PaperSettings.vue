<script setup lang="ts">
// Khổ giấy, dòng kẻ ô li, đầu trang.
import SegmentedControl from './form/SegmentedControl.vue'
import ToggleRow from './form/ToggleRow.vue'
import FieldLabel from './form/FieldLabel.vue'
import SettingsSection from './form/SettingsSection.vue'
import { settings } from '@/lib/worksheet-settings'
import { LINE_COLORS, PAPERS, type PaperId } from '@/lib/paper-presets'
import { cn } from '@/lib/utils'

const orientations = [
  { value: false, label: 'Dọc' },
  { value: true, label: 'Ngang' },
]
const oLiSizes = [
  { value: 2, label: '2 mm', title: 'Cỡ vở ô li phổ biến' },
  { value: 2.5, label: '2,5 mm', title: 'Ô to hơn một chút' },
  { value: 3, label: '3 mm', title: 'Ô to cho bé mới tập tô' },
]
const pick = (id: PaperId) => (settings.paper = id)
</script>

<template>
  <SettingsSection title="Giấy và dòng kẻ">
    <div>
      <FieldLabel label="Khổ giấy" />
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="p in PAPERS"
          :key="p.id"
          type="button"
          :aria-pressed="settings.paper === p.id"
          :class="
            cn(
              'rounded-md border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              settings.paper === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input hover:bg-accent',
            )
          "
          @click="pick(p.id)"
        >
          <span class="block text-sm font-medium">{{ p.label }}</span>
          <span class="block text-[11px] text-muted-foreground">{{ p.hint }}</span>
        </button>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel label="Hướng giấy" />
        <SegmentedControl v-model="settings.landscape" :options="orientations" />
      </div>
      <div>
        <FieldLabel label="Lề trang" :value="`${settings.marginMm} mm`" />
        <input v-model.number="settings.marginMm" type="range" min="6" max="25" class="mt-1.5 w-full accent-[hsl(var(--primary))]" />
      </div>
    </div>
    <div>
      <FieldLabel label="Cỡ ô li" />
      <SegmentedControl v-model="settings.oLiMm" :options="oLiSizes" />
    </div>
    <div>
      <FieldLabel label="Màu dòng kẻ" />
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="c in LINE_COLORS"
          :key="c.id"
          type="button"
          :aria-pressed="settings.lineColor === c.id"
          :class="
            cn(
              'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              settings.lineColor === c.id ? 'border-primary ring-1 ring-primary' : 'border-input hover:bg-accent',
            )
          "
          @click="settings.lineColor = c.id"
        >
          <!-- mẫu dòng kẻ: màu của giấy in, không phải màu giao diện -->
          <span
            class="h-4 w-6 shrink-0 rounded-sm border bg-white"
            :style="{
              backgroundImage: `linear-gradient(${c.bold} 1px, transparent 1px), linear-gradient(${c.thin} 1px, transparent 1px)`,
              backgroundSize: '100% 16px, 100% 4px',
            }"
          />
          {{ c.label }}
        </button>
      </div>
    </div>
    <div class="-my-1">
      <ToggleRow v-model="settings.skipRow" label="Viết cách một dòng" hint="Chữ cao không chạm chữ dòng dưới" />
      <ToggleRow v-model="settings.verticalLines" label="Kẻ dọc (ô vuông)" />
      <ToggleRow v-model="settings.marginLine" label="Đường lề đỏ" />
    </div>
  </SettingsSection>

  <SettingsSection title="Đầu trang">
    <div class="-my-1">
      <ToggleRow v-model="settings.showHeader" label="Tiêu đề, họ tên, lớp, ngày" />
      <ToggleRow v-model="settings.showPageNumber" label="Số trang" />
    </div>
    <div v-if="settings.showHeader">
      <FieldLabel label="Tiêu đề" />
      <input
        v-model="settings.title"
        type="text"
        maxlength="80"
        :placeholder="settings.mode === 'letters' ? 'Luyện viết chữ cái' : 'Luyện viết'"
        class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  </SettingsSection>
</template>
