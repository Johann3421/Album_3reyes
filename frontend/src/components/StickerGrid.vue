<template>
  <div>
    <div class="grid-header">
      <div class="badge">{{ counts.got }} / {{ counts.total }}</div>
      <div class="category-label">{{ label }}</div>
    </div>
    <div class="sticker-grid">
      <StickerChip v-for="s in filtered" :key="s.id" :sticker="s" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import StickerChip from './StickerChip.vue';
import type { Sticker } from '../api';

const props = defineProps<{ category: string }>();

const stickers = inject('stickers') as { value: Sticker[] } | undefined;
if (!stickers) throw new Error('stickers store not provided');

const filtered = computed(() => {
  if (props.category === 'MISSING') return stickers.value.filter((s) => !s.got);
  return stickers.value.filter((s) => s.category === props.category);
});

const counts = computed(() => {
  if (props.category === 'MISSING') {
    const total = stickers.value.length;
    const got = stickers.value.filter((s) => s.got).length;
    return { total, got };
  }
  const list = stickers.value.filter((s) => s.category === props.category);
  return { total: list.length, got: list.filter((s) => s.got).length };
});

const label = computed(() => {
  if (props.category === 'MISSING') return 'Faltantes';
  if (props.category === 'REGULAR') return 'Regulares';
  if (props.category === 'ESPECIAL') return 'Especiales';
  if (props.category === 'TROQUELADO') return 'Troquelados';
  return props.category;
});
</script>

<style scoped>
.grid-header { display:flex; align-items:center; gap:12px; margin-bottom:10px }
.badge { background:var(--color-got); color:#fff; padding:4px 8px; border-radius:999px; font-weight:600 }
.category-label { font-weight:700 }
.sticker-grid { display:grid; gap:10px; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); }
</style>
