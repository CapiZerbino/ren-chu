<script setup lang="ts">
import { computed } from 'vue'
// Khổ giấy, dòng kẻ ô li, đầu trang.
import SegmentedControl from './form/SegmentedControl.vue'
import ToggleRow from './form/ToggleRow.vue'
import FieldLabel from './form/FieldLabel.vue'
import SettingsSection from './form/SettingsSection.vue'
import MoreOptions from './form/MoreOptions.vue'
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
const paperShort: Record<PaperId, string> = { a4: 'A4', vo: 'Vở', b5: 'B5', a5: 'A5', letter: 'Letter' }
const lineColorLabel = computed(() => LINE_COLORS.find((c) => c.id === settings.lineColor)?.label ?? '')
const currentPaper = computed(() => PAPERS.find((p) => p.id === settings.paper) ?? PAPERS[0])
const rulings = [
  { value: 'o-li' as const, label: 'Ô li', title: 'Kẻ ngang từng ô li, kẻ dọc mỗi 4 ô li (vở 4 ô li)' },
  { value: 'o-vuong' as const, label: 'Ô vuông', title: 'Kẻ cả ngang lẫn dọc từng ô li thành ô vuông nhỏ (vở ô li lớp 1)' },
]
</script>

<template>
  <SettingsSection>
    <div>
      <FieldLabel label="Khổ giấy" :value="currentPaper.hint" />
      <div class="grid grid-cols-5 gap-1 rounded-md bg-muted p-1" role="radiogroup">
        <button
          v-for="p in PAPERS"
          :key="p.id"
          type="button"
          role="radio"
          :aria-checked="settings.paper === p.id"
          :title="`${p.label} — ${p.hint}`"
          :class="
            cn(
              'h-7 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              settings.paper === p.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )
          "
          @click="pick(p.id)"
        >
          {{ paperShort[p.id] }}
        </button>
      </div>
    </div>
    <div>
      <FieldLabel label="Hướng giấy" />
      <SegmentedControl v-model="settings.landscape" :options="orientations" />
    </div>
    <div>
      <FieldLabel label="Kiểu dòng kẻ" />
      <SegmentedControl v-model="settings.ruling" :options="rulings" />
    </div>
    <div>
      <FieldLabel label="Cỡ ô li" />
      <SegmentedControl v-model="settings.oLiMm" :options="oLiSizes" />
    </div>
    <div>
      <FieldLabel label="Màu dòng kẻ" :value="lineColorLabel" />
      <div class="flex gap-1.5" role="radiogroup">
        <button
          v-for="c in LINE_COLORS"
          :key="c.id"
          type="button"
          role="radio"
          :aria-checked="settings.lineColor === c.id"
          :aria-label="c.label"
          :title="c.label"
          :class="
            cn(
              'h-8 flex-1 rounded-md border bg-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              settings.lineColor === c.id ? 'border-primary ring-2 ring-primary' : 'border-input hover:border-foreground/30',
            )
          "
          :style="{
            backgroundImage: `linear-gradient(${c.bold} 1px, transparent 1px), linear-gradient(${c.thin} 1px, transparent 1px)`,
            backgroundSize: '100% 16px, 100% 4px',
            backgroundPosition: '0 3px',
          }"
          @click="settings.lineColor = c.id"
        />
      </div>
    </div>
    <div class="-my-1">
      <ToggleRow v-model="settings.skipRow" label="Viết cách một dòng" />
    </div>
    <MoreOptions id="giay">
      <div>
        <FieldLabel label="Lề trang" :value="`${settings.marginMm} mm`" />
        <input v-model.number="settings.marginMm" type="range" min="6" max="25" class="w-full accent-[hsl(var(--primary))]" />
      </div>
      <div class="-my-1">
        <ToggleRow v-if="settings.ruling === 'o-li'" v-model="settings.verticalLines" label="Kẻ dọc (ô vuông lớn)" />
        <ToggleRow v-model="settings.marginLine" label="Đường lề đỏ" />
      </div>
    </MoreOptions>
  </SettingsSection>
</template>
