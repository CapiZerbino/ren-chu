<script setup lang="ts">
// Tiêu đề và ô thông tin (Họ và tên, Lớp, Ngày…): chữ, font, cỡ, màu; thêm/xoá ô.
// Vị trí chỉnh bằng cách kéo thả trên trang.
import { ref } from 'vue'
import { Move, Plus, RotateCcw, X } from 'lucide-vue-next'
import SettingsSection from './form/SettingsSection.vue'
import FieldLabel from './form/FieldLabel.vue'
import ToggleRow from './form/ToggleRow.vue'
import RangeField from './form/RangeField.vue'
import ColorSwatches from './form/ColorSwatches.vue'
import FontPicker from './FontPicker.vue'
import { settings, autoTitle } from '@/lib/worksheet-settings'
import { addField, decor, removeField, resetHeaderLayout, selectedId } from '@/lib/decor-settings'

const FIELD_PRESETS = ['Trường:', 'Điểm:', 'Lời phê của thầy cô:', 'Số báo danh:', 'Tuần:']
const error = ref('')
const mm = (n: number) => `${n.toFixed(1).replace('.', ',')} mm`
</script>

<template>
  <SettingsSection title="Tiêu đề và ô thông tin">
    <div class="-my-1">
      <ToggleRow v-model="settings.showHeader" label="Hiện tiêu đề và ô thông tin" />
    </div>
    <p class="flex items-start gap-1.5 rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
      <Move class="mt-px h-3.5 w-3.5 shrink-0" />
      Kéo tiêu đề, ô thông tin, logo trên trang để đổi chỗ; kéo ô vuông ở góc để đổi cỡ. Chọn rồi dùng phím mũi tên để nhích.
    </p>
    <RangeField v-model="settings.headerHeightMm" label="Khoảng trống đầu trang" :display="`${settings.headerHeightMm} mm`" :min="0" :max="80" />

    <template v-if="settings.showHeader">
      <div>
        <FieldLabel label="Tiêu đề" />
        <input
          v-model="decor.title.text"
          type="text"
          maxlength="100"
          :placeholder="autoTitle(settings)"
          class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @focus="selectedId = 'title'"
        />
      </div>
      <div>
        <FieldLabel label="Font tiêu đề" />
        <FontPicker v-model="decor.title.fontKey" @error="error = $event" />
      </div>
      <RangeField v-model="decor.title.sizeMm" label="Cỡ tiêu đề" :display="mm(decor.title.sizeMm)" :min="3" :max="20" :step="0.2" />
      <div class="flex items-center justify-between gap-3">
        <ColorSwatches v-model="decor.title.color" />
        <button
          type="button"
          class="shrink-0 rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
          :disabled="decor.title.centered"
          @click="decor.title.centered = true"
        >
          Căn giữa
        </button>
      </div>

      <div class="space-y-1.5 border-t pt-3">
        <FieldLabel label="Ô thông tin" :value="`${decor.fields.length} ô`" />
        <div v-for="fld in decor.fields" :key="fld.id" class="flex items-center gap-1.5">
          <input
            v-model="fld.label"
            type="text"
            maxlength="40"
            class="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="selectedId === fld.id ? 'ring-1 ring-primary' : ''"
            @focus="selectedId = fld.id"
          />
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            :aria-label="`Xoá ô ${fld.label}`"
            @click="removeField(fld.id)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 pt-1 text-xs">
          <button
            v-for="p in FIELD_PRESETS"
            :key="p"
            type="button"
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 hover:bg-accent"
            @click="addField(p)"
          >
            <Plus class="h-3 w-3" />{{ p.replace(':', '') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 hover:bg-accent"
            @click="addField('Ô mới:')"
          >
            <Plus class="h-3 w-3" />Ô khác
          </button>
        </div>
      </div>
      <div>
        <FieldLabel label="Font ô thông tin" />
        <FontPicker v-model="decor.fieldStyle.fontKey" @error="error = $event" />
      </div>
      <RangeField v-model="decor.fieldStyle.sizeMm" label="Cỡ chữ ô thông tin" :display="mm(decor.fieldStyle.sizeMm)" :min="2.5" :max="8" :step="0.1" />
      <ColorSwatches v-model="decor.fieldStyle.color" />
      <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        @click="resetHeaderLayout"
      >
        <RotateCcw class="h-3.5 w-3.5" /> Xếp lại vị trí tiêu đề và ô thông tin
      </button>
    </template>
    <div class="-my-1 border-t pt-2">
      <ToggleRow v-model="settings.showPageNumber" label="Số trang" />
    </div>
  </SettingsSection>
</template>
