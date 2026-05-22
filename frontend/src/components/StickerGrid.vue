<template>
  <div class="section">
    <div class="section-header">
      <div class="section-title">{{ label }}</div>
      <div class="section-badge" :class="badgeClass">{{ counts.got }} / {{ counts.total }}</div>
    </div>

    <div class="chip-grid">
      <StickerChip v-for="(s, i) in filtered" :key="s.id" :sticker="s" :idx="i+1" />
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

const badgeClass = computed(() => {
  if (props.category === 'REGULAR') return 'badge-reg';
  if (props.category === 'ESPECIAL') return 'badge-esp';
  if (props.category === 'TROQUELADO') return 'badge-troq';
  return '';
});
</script>

<style scoped>
.chip-grid { display:grid; gap:10px; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); }
.section { margin-bottom:18px }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px }
.section-title { font-weight:800 }
.section-badge { padding:6px 10px; border-radius:999px; font-weight:700 }
.badge-reg { background:var(--color-reg); color:#8b5e2b }
.badge-esp { background:var(--color-esp); color:#8b3a5b }
.badge-troq { background:var(--color-troq); color:#04525c }
</style>
