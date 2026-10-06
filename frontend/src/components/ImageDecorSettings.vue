<script setup lang="ts">
// Logo trường (nhiều logo, kéo thả trên trang) và ảnh nền chìm dưới trang.
import { ref } from 'vue'
import { ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import SettingsSection from './form/SettingsSection.vue'
import FieldLabel from './form/FieldLabel.vue'
import RangeField from './form/RangeField.vue'
import SegmentedControl from './form/SegmentedControl.vue'
import { decor, newId, selectedId } from '@/lib/decor-settings'
import { removeLogo } from '@/lib/decor-actions'
import { assets, importImages, removeAsset } from '@/lib/image-assets'
import { pageSize } from '@/lib/worksheet-store'
import { cn } from '@/lib/utils'

const busy = ref<'' | 'logo' | 'nen'>('')
const error = ref('')
const fits = [
  { value: 'cover' as const, label: 'Phủ kín trang' },
  { value: 'contain' as const, label: 'Vừa trang' },
]

async function addLogos() {
  error.value = ''
  busy.value = 'logo'
  try {
    const ids = await importImages('logo', true)
    ids.forEach((assetId, i) => {
      const id = newId('logo')
      // Logo mới xếp lần lượt từ góc trên trái, lệch nhau để không chồng khít
      decor.logos.push({ id, assetId, xFrac: 0.03 + i * 0.1, yMm: 4 + i * 2, widthMm: 18, opacity: 1 })
      selectedId.value = id
    })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = ''
  }
}

async function pickBackground() {
  error.value = ''
  busy.value = 'nen'
  try {
    const [id] = await importImages('nen', false)
    if (!id) return
    if (decor.background.assetId) removeAsset(decor.background.assetId)
    decor.background.assetId = id
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = ''
  }
}

function clearBackground() {
  if (decor.background.assetId) removeAsset(decor.background.assetId)
  decor.background.assetId = null
}

const pct = (n: number) => `${Math.round(n * 100)}%`
</script>

<template>
  <SettingsSection title="Logo và ảnh nền" collapsible id="logo-nen">
    <div>
      <FieldLabel label="Logo trường" :value="decor.logos.length ? `${decor.logos.length} logo` : ''" />
      <div class="grid grid-cols-4 gap-1.5">
        <div
          v-for="logo in decor.logos"
          :key="logo.id"
          :class="
            cn(
              'group relative flex aspect-square cursor-pointer items-center justify-center rounded-md border bg-white p-1',
              selectedId === logo.id ? 'border-primary ring-1 ring-primary' : 'hover:border-foreground/30',
            )
          "
          @click="selectedId = logo.id"
        >
          <img v-if="assets.get(logo.assetId)" :src="assets.get(logo.assetId)!.dataUrl" alt="" class="max-h-full max-w-full object-contain" />
          <span v-else class="text-[10px] text-muted-foreground">Mất ảnh</span>
          <button
            type="button"
            class="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full border bg-background shadow-sm hover:text-destructive group-hover:flex"
            aria-label="Xoá logo"
            @click.stop="removeLogo(logo.id)"
          >
            <Trash2 class="h-3 w-3" />
          </button>
        </div>
        <button
          type="button"
          class="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
          :disabled="!!busy"
          @click="addLogos"
        >
          <Loader2 v-if="busy === 'logo'" class="h-4 w-4 animate-spin" />
          <ImagePlus v-else class="h-4 w-4" />
          Thêm logo
        </button>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">Chọn được nhiều ảnh một lúc. PNG nền trong suốt là đẹp nhất.</p>
    </div>
    <template v-for="logo in decor.logos" :key="logo.id">
      <div v-if="selectedId === logo.id" class="space-y-3 rounded-md border p-3">
        <RangeField v-model="logo.widthMm" label="Cỡ logo" :display="`${Math.round(logo.widthMm)} mm`" :min="5" :max="Math.round(pageSize.width)" />
        <RangeField v-model="logo.opacity" label="Độ đậm" :display="pct(logo.opacity)" :min="0.1" :max="1" :step="0.05" />
      </div>
    </template>

    <div class="border-t pt-3">
      <FieldLabel label="Ảnh nền chìm" />
      <div class="flex items-center gap-2">
        <div class="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded border bg-white">
          <img
            v-if="decor.background.assetId && assets.get(decor.background.assetId)"
            :src="assets.get(decor.background.assetId)!.dataUrl"
            alt=""
            class="h-full w-full object-cover"
            :style="{ opacity: decor.background.opacity }"
          />
        </div>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs hover:bg-accent"
          :disabled="!!busy"
          @click="pickBackground"
        >
          <Loader2 v-if="busy === 'nen'" class="h-3.5 w-3.5 animate-spin" />
          <ImagePlus v-else class="h-3.5 w-3.5" />
          {{ decor.background.assetId ? 'Đổi ảnh' : 'Chọn ảnh nền' }}
        </button>
        <button
          v-if="decor.background.assetId"
          type="button"
          class="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
          @click="clearBackground"
        >
          <Trash2 class="h-3.5 w-3.5" /> Bỏ
        </button>
      </div>
    </div>
    <template v-if="decor.background.assetId">
      <RangeField v-model="decor.background.opacity" label="Độ đậm ảnh nền" :display="pct(decor.background.opacity)" :min="0.03" :max="1" :step="0.01" />
      <SegmentedControl v-model="decor.background.fit" :options="fits" />
    </template>
    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
  </SettingsSection>
</template>
