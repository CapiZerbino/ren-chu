<script setup lang="ts">
// Ô chọn font chữ mẫu: font kèm sẵn (xem trước bằng chính font đó), font đã thêm,
// font cài trên máy (tìm theo tên), thêm font từ file. Dùng v-model = khoá font.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown, FilePlus2, Loader2, Search, X } from 'lucide-vue-next'
import { addFontFromFile, addedFonts, fontEntry, fontLoading, removeAddedFont, systemFonts } from '@/lib/worksheet-store'
import {
  BUNDLED_FONTS,
  FONT_GROUP_LABELS,
  cssFamily,
  registerBundledFontsForCss,
  type FontEntry,
  type FontGroup,
} from '@/lib/font-catalog'
import { isDesktop, pickFont } from '@/lib/backend'
import { cn } from '@/lib/utils'

const model = defineModel<string>({ required: true })
const emit = defineEmits<{ error: [message: string] }>()
const currentFontEntry = computed(() => fontEntry(model.value))

const open = ref(false)
const query = ref('')
const root = ref<HTMLElement>()
const searchEl = ref<HTMLInputElement>()
const SYSTEM_LIMIT = 150

const isBundled = (f: FontEntry) => !!f.url
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

const groups = computed(() => {
  const q = norm(query.value.trim())
  const match = (f: FontEntry) => !q || norm(f.name).includes(q) || norm(f.hint ?? '').includes(q)
  const list: { id: FontGroup; items: FontEntry[]; more: number }[] = []
  const push = (id: FontGroup, all: FontEntry[], limit = Infinity) => {
    const items = all.filter(match)
    if (items.length) list.push({ id, items: items.slice(0, limit), more: Math.max(0, items.length - limit) })
  }
  push('noi-net', BUNDLED_FONTS.filter((f) => f.group === 'noi-net'))
  push('chu-in', BUNDLED_FONTS.filter((f) => f.group === 'chu-in'))
  push('da-them', addedFonts.value)
  push('tren-may', systemFonts.value, SYSTEM_LIMIT)
  return list
})

async function toggle() {
  open.value = !open.value
  if (open.value) {
    registerBundledFontsForCss()
    query.value = ''
    await nextTick()
    searchEl.value?.focus()
    root.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
  }
}

function choose(f: FontEntry) {
  model.value = f.key
  open.value = false
}

async function addFromFile() {
  open.value = false
  try {
    const f = await pickFont()
    if (f) model.value = addFontFromFile(f.name, f.data, f.path)
  } catch (e) {
    emit('error', (e as Error).message || 'Không mở được font này')
  }
}

function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (open.value = false)
onMounted(() => {
  registerBundledFontsForCss()
  document.addEventListener('mousedown', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      class="flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="toggle"
    >
      <span class="min-w-0 flex-1">
        <span
          class="block truncate text-[15px] leading-tight"
          :style="isBundled(currentFontEntry) ? { fontFamily: `${cssFamily(currentFontEntry.key)}, system-ui, sans-serif` } : {}"
        >
          {{ currentFontEntry.name }}
        </span>
        <span class="block truncate text-[11px] text-muted-foreground">
          {{ currentFontEntry.hint ?? FONT_GROUP_LABELS[currentFontEntry.group] }}
        </span>
      </span>
      <Loader2 v-if="fontLoading" class="h-4 w-4 animate-spin text-muted-foreground" />
      <ChevronDown class="h-4 w-4 text-muted-foreground" />
    </button>

    <div
      v-if="open"
      class="absolute left-0 right-0 top-full z-30 mt-1 flex max-h-[460px] flex-col overflow-hidden rounded-lg border bg-popover shadow-xl"
    >
      <div class="flex items-center gap-2 border-b px-3">
        <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref="searchEl"
          v-model="query"
          type="text"
          placeholder="Tìm font…"
          class="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto py-1" role="listbox">
        <div v-for="g in groups" :key="g.id" class="py-1">
          <div class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {{ FONT_GROUP_LABELS[g.id] }}
            <span v-if="g.id === 'tren-may'" class="font-normal normal-case tracking-normal">· {{ systemFonts.length }} font</span>
          </div>
          <div
            v-for="f in g.items"
            :key="f.key"
            role="option"
            :aria-selected="model === f.key"
            :class="
              cn(
                'group flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-accent',
                model === f.key && 'bg-primary/5',
              )
            "
            @click="choose(f)"
          >
            <Check class="h-3.5 w-3.5 shrink-0 text-primary" :class="model === f.key ? '' : 'invisible'" />
            <span class="min-w-0 flex-1">
              <span
                v-if="isBundled(f)"
                class="block truncate text-lg leading-snug"
                :style="{ fontFamily: `${cssFamily(f.key)}, system-ui, sans-serif` }"
              >
                {{ f.name }} · Bé tập viết
              </span>
              <span v-else class="block truncate text-sm">{{ f.name }}</span>
              <span v-if="f.hint" class="block truncate text-[11px] text-muted-foreground">{{ f.hint }}</span>
            </span>
            <button
              v-if="g.id === 'da-them'"
              type="button"
              class="invisible rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground group-hover:visible"
              :aria-label="`Bỏ font ${f.name} khỏi danh sách`"
              title="Bỏ khỏi danh sách"
              @click.stop="removeAddedFont(f.key)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
          <p v-if="g.more" class="px-3 py-1 text-xs text-muted-foreground">Còn {{ g.more }} font nữa — gõ tên để tìm.</p>
        </div>
        <p v-if="!groups.length" class="px-3 py-6 text-center text-sm text-muted-foreground">Không thấy font nào tên như vậy.</p>
        <p v-if="!isDesktop()" class="px-3 py-2 text-xs text-muted-foreground">
          Font cài trên máy chỉ hiện ở bản desktop.
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 border-t px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
        @click="addFromFile"
      >
        <FilePlus2 class="h-4 w-4" /> Thêm font từ file (.ttf, .otf, .ttc)…
      </button>
    </div>
  </div>
</template>
