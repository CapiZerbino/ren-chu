<script setup lang="ts">
// Watermark chữ chìm (tên trường, tên lớp…): một dòng chéo giữa trang hoặc lặp kín trang.
import { ref } from 'vue'
import SettingsSection from './form/SettingsSection.vue'
import FieldLabel from './form/FieldLabel.vue'
import RangeField from './form/RangeField.vue'
import ToggleRow from './form/ToggleRow.vue'
import ColorSwatches from './form/ColorSwatches.vue'
import FontPicker from './FontPicker.vue'
import { decor } from '@/lib/decor-settings'

const error = ref('')
</script>

<template>
  <SettingsSection title="Watermark" collapsible id="watermark" :default-open="false">
    <div>
      <FieldLabel label="Chữ chìm" />
      <input
        v-model="decor.watermark.text"
        type="text"
        maxlength="80"
        placeholder="Ví dụ: Trường Tiểu học Kim Đồng"
        class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
    <template v-if="decor.watermark.text.trim()">
      <div>
        <FieldLabel label="Font watermark" />
        <FontPicker v-model="decor.watermark.fontKey" @error="error = $event" />
        <p v-if="error" class="mt-1 text-xs text-destructive">{{ error }}</p>
      </div>
      <RangeField v-model="decor.watermark.sizeMm" label="Cỡ chữ" :display="`${decor.watermark.sizeMm} mm`" :min="4" :max="60" />
      <RangeField v-model="decor.watermark.opacity" label="Độ đậm" :display="`${Math.round(decor.watermark.opacity * 100)}%`" :min="0.03" :max="0.6" :step="0.01" />
      <RangeField v-model="decor.watermark.angle" label="Góc nghiêng" :display="`${decor.watermark.angle}°`" :min="-90" :max="90" />
      <ColorSwatches v-model="decor.watermark.color" />
      <div class="-my-1">
        <ToggleRow v-model="decor.watermark.tiled" label="Lặp kín trang" />
      </div>
    </template>
  </SettingsSection>
</template>
