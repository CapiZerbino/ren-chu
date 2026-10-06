<script setup lang="ts">
// Chọn nội dung luyện viết: chữ cái / chữ số, hoặc vần · từ · câu tự nhập.
import { computed } from 'vue'
import SegmentedControl from './form/SegmentedControl.vue'
import ToggleRow from './form/ToggleRow.vue'
import FieldLabel from './form/FieldLabel.vue'
import SettingsSection from './form/SettingsSection.vue'
import { settings, type ContentMode, type LetterCase, type PracticePattern } from '@/lib/worksheet-settings'
import { ALPHABET, DIGITS, TEXT_PRESETS, upper } from '@/lib/vietnamese-content'
import { cn } from '@/lib/utils'

const modes: { value: ContentMode; label: string }[] = [
  { value: 'letters', label: 'Chữ cái · chữ số' },
  { value: 'text', label: 'Vần · từ · câu' },
]
const cases: { value: LetterCase; label: string }[] = [
  { value: 'thuong', label: 'Thường' },
  { value: 'hoa', label: 'Hoa' },
  { value: 'ca-hai', label: 'Hoa + thường' },
]
const patterns: { value: PracticePattern; label: string; title: string }[] = [
  { value: 'giam-dan', label: 'Mờ giảm dần', title: 'Dòng đầu tô kín, các dòng sau chữ mờ ít dần' },
  { value: 'to-kin', label: 'Tô kín dòng', title: 'Dòng nào cũng có chữ mẫu và chữ mờ kín dòng' },
  { value: 'mau-dau-dong', label: 'Mẫu đầu dòng', title: 'Chỉ có chữ mẫu đầu dòng, còn lại để trống tự viết' },
]

const VOWELS = ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y']
const selected = computed(() => new Set(settings.letters))

function toggle(c: string) {
  settings.letters = selected.value.has(c) ? settings.letters.filter((x) => x !== c) : [...settings.letters, c]
}
const setLetters = (list: string[]) => (settings.letters = [...list])
const showUpper = computed(() => settings.letterCase === 'hoa')

const textLines = computed(() => settings.text.split('\n').filter((l) => l.trim()).length)

function applyPreset(i: number) {
  const p = TEXT_PRESETS[i]
  if (!p) return
  settings.text = p.lines.join('\n')
  settings.repeatText = p.repeat
}
</script>

<template>
  <SettingsSection title="Nội dung">
    <SegmentedControl v-model="settings.mode" :options="modes" />

    <template v-if="settings.mode === 'letters'">
      <div>
        <FieldLabel label="Chọn chữ" :value="`${settings.letters.length} đã chọn`" />
        <div class="grid grid-cols-8 gap-1">
          <button
            v-for="c in ALPHABET"
            :key="c"
            type="button"
            :aria-pressed="selected.has(c)"
            :class="
              cn(
                'font-hand flex h-9 items-center justify-center rounded-md border text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected.has(c)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent',
              )
            "
            @click="toggle(c)"
          >
            {{ showUpper ? upper(c) : c }}
          </button>
        </div>
        <div class="mt-1 grid grid-cols-10 gap-1">
          <button
            v-for="d in DIGITS"
            :key="d"
            type="button"
            :aria-pressed="selected.has(d)"
            :class="
              cn(
                'font-hand flex h-8 items-center justify-center rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected.has(d)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent',
              )
            "
            @click="toggle(d)"
          >
            {{ d }}
          </button>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5 text-xs">
          <button class="rounded-full border px-2.5 py-0.5 hover:bg-accent" @click="setLetters(ALPHABET)">Cả bảng chữ cái</button>
          <button class="rounded-full border px-2.5 py-0.5 hover:bg-accent" @click="setLetters(VOWELS)">Nguyên âm</button>
          <button class="rounded-full border px-2.5 py-0.5 hover:bg-accent" @click="setLetters(DIGITS)">Chữ số</button>
          <button class="rounded-full border px-2.5 py-0.5 text-muted-foreground hover:bg-accent" @click="setLetters([])">
            Bỏ chọn
          </button>
        </div>
      </div>
      <div>
        <FieldLabel label="Kiểu chữ cái" />
        <SegmentedControl v-model="settings.letterCase" :options="cases" />
      </div>
    </template>

    <template v-else>
      <div>
        <FieldLabel label="Mỗi dòng một vần, từ hoặc câu" :value="`${textLines} dòng`" />
        <textarea
          v-model="settings.text"
          rows="6"
          spellcheck="false"
          class="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Ví dụ:&#10;Có công mài sắt, có ngày nên kim."
        />
        <select
          class="mt-1.5 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value=""
          @change="applyPreset(Number(($event.target as HTMLSelectElement).value)); ($event.target as HTMLSelectElement).value = ''"
        >
          <option value="" disabled>Dùng nội dung mẫu…</option>
          <option v-for="(p, i) in TEXT_PRESETS" :key="p.label" :value="i">{{ p.label }}</option>
        </select>
      </div>
      <ToggleRow v-model="settings.repeatText" label="Lặp lại cho kín dòng" hint="Hợp với vần, từ ngắn" />
    </template>

    <div>
      <FieldLabel label="Kiểu bài" />
      <SegmentedControl v-model="settings.pattern" :options="patterns" />
    </div>
    <div>
      <FieldLabel label="Số dòng luyện mỗi chữ / câu" :value="`${settings.rowsPerItem} dòng`" />
      <input v-model.number="settings.rowsPerItem" type="range" min="1" max="8" class="w-full accent-[hsl(var(--primary))]" />
    </div>
  </SettingsSection>
</template>
