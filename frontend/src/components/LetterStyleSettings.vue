<script setup lang="ts">
// Font chữ mẫu, cỡ chữ theo ô li, nét, độ nghiêng, màu mực, kiểu chữ mờ để tô.
import { ref } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import FontPicker from './FontPicker.vue'
import SegmentedControl from './form/SegmentedControl.vue'
import FieldLabel from './form/FieldLabel.vue'
import SettingsSection from './form/SettingsSection.vue'
import MoreOptions from './form/MoreOptions.vue'
import { settings, type LetterSize, type TraceStyle } from '@/lib/worksheet-settings'
import { INKS } from '@/lib/paper-presets'
import { currentFontEntry, fontError, missingVietnamese } from '@/lib/worksheet-store'
import type { WeightLevel } from '@/lib/font-catalog'
import { cn } from '@/lib/utils'

const sizes: { value: LetterSize; label: string; title: string }[] = [
  { value: 'vua', label: 'Cỡ vừa', title: 'Chữ thường cao 2 ô li, chữ hoa và b, h, k, l cao 5 ô li (lớp 1)' },
  { value: 'nho', label: 'Cỡ nhỏ', title: 'Chữ thường cao 1 ô li (lớp 2 trở lên)' },
]
const weights: { value: WeightLevel; label: string }[] = [
  { value: 'manh', label: 'Mảnh' },
  { value: 'vua', label: 'Vừa' },
  { value: 'dam', label: 'Đậm' },
]
const traces: { value: TraceStyle; label: string; title?: string }[] = [
  { value: 'mo', label: 'Chữ mờ', title: 'Chữ màu nhạt để bé tô đè lên' },
  { value: 'net-dut', label: 'Nét đứt' },
  { value: 'cham', label: 'Chấm', title: 'Viền chữ bằng chấm chấm' },
]

const pickerError = ref('')
</script>

<template>
  <SettingsSection>
    <div>
      <FieldLabel label="Font chữ" />
      <FontPicker v-model="settings.fontKey" @error="pickerError = $event" />
      <p v-if="pickerError || fontError" class="mt-1 text-xs text-destructive">{{ pickerError || fontError }}</p>
      <p v-else-if="missingVietnamese" class="mt-1.5 flex gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle class="mt-px h-3.5 w-3.5 shrink-0" />
        <span>Font này thiếu {{ missingVietnamese.length }} chữ tiếng Việt ({{ missingVietnamese.slice(0, 12) }}…), chữ thiếu sẽ hiện ô trống.</span>
      </p>
    </div>
    <div>
      <FieldLabel label="Cỡ chữ" />
      <SegmentedControl v-model="settings.letterSize" :options="sizes" />
    </div>
    <div>
      <FieldLabel label="Chữ để tô" />
      <SegmentedControl v-model="settings.traceStyle" :options="traces" />
    </div>
    <div>
      <FieldLabel label="Màu mực" />
      <div class="flex gap-1.5">
        <button
          v-for="ink in INKS"
          :key="ink.id"
          type="button"
          :aria-pressed="settings.ink === ink.id"
          :class="
            cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              settings.ink === ink.id ? 'border-primary ring-1 ring-primary' : 'border-input hover:bg-accent',
            )
          "
          @click="settings.ink = ink.id"
        >
          <span class="h-3 w-3 rounded-full" :style="{ background: ink.solid }" />
          {{ ink.label.replace('Mực ', '').replace(/^./, (c) => c.toUpperCase()) }}
        </button>
      </div>
    </div>
    <MoreOptions id="chu">
      <div v-if="currentFontEntry.weights">
        <FieldLabel label="Nét chữ" />
        <SegmentedControl v-model="settings.weight" :options="weights" />
      </div>
      <div>
        <FieldLabel label="Độ nghiêng" :value="settings.slant === 0 ? 'Chữ đứng' : `${settings.slant}°`" />
        <input v-model.number="settings.slant" type="range" min="-10" max="20" step="1" class="w-full accent-[hsl(var(--primary))]" />
      </div>
      <p class="text-xs text-muted-foreground">Có font mẫu chữ của trường? Mở ô Font chữ, chọn trong "Font trên máy" hoặc thêm từ file.</p>
    </MoreOptions>
  </SettingsSection>
</template>
