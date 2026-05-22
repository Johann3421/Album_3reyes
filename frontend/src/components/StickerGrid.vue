<template>
  <div class="grid-wrapper">
    <!-- All-done celebration -->
    <div v-if="filtered.length === 0 && category !== 'MISSING'" class="empty-state">
      <span class="empty-icon">🎉</span>
      <p>¡Sección vacía!</p>
    </div>
    <div v-else-if="filtered.length === 0 && category === 'MISSING'" class="empty-state complete">
      <span class="empty-icon">🏅</span>
      <p class="empty-title">¡Álbum completo!</p>
      <p class="empty-sub">Todas las figuritas están en tu poder.</p>
    </div>

    <template v-else>
      <!-- Section header -->
      <div class="section-header" :class="`sh-${category.toLowerCase()}`">
        <div class="sh-left">
          <span class="sh-icon">{{ catIcon }}</span>
          <span class="sh-title">{{ catLabel }}</span>
        </div>
        <div class="sh-stats">
          <span class="sh-got">{{ counts.got }}</span>
          <span class="sh-sep">/</span>
          <span class="sh-total">{{ counts.total }}</span>
          <div class="sh-mini-bar">
            <div class="sh-mini-fill" :style="{ width: `${counts.total ? Math.round(counts.got/counts.total*100) : 0}%` }"></div>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="sticker-grid">
        <StickerChip
          v-for="(s, i) in filtered"
          :key="s.id"
          :sticker="s"
          :idx="i + 1"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import StickerChip from './StickerChip.vue';
import type { Sticker } from '../api';

const props = defineProps<{ category: string }>();

const stickers = inject('stickers') as { value: Sticker[] } | undefined;
if (!stickers) throw new Error('stickers store not provided');

const filtered = computed(() =>
  props.category === 'MISSING'
    ? stickers.value.filter((s) => !s.got)
    : stickers.value.filter((s) => s.category === props.category),
);

const counts = computed(() => {
  if (props.category === 'MISSING') {
    return { total: stickers.value.length, got: stickers.value.filter((s) => s.got).length };
  }
  const list = stickers.value.filter((s) => s.category === props.category);
  return { total: list.length, got: list.filter((s) => s.got).length };
});

const catIcon = computed(() => {
  if (props.category === 'REGULAR')    return '🃏';
  if (props.category === 'ESPECIAL')   return '✨';
  if (props.category === 'TROQUELADO') return '🏆';
  return '🔍';
});

const catLabel = computed(() => {
  if (props.category === 'REGULAR')    return 'Figuritas Regulares';
  if (props.category === 'ESPECIAL')   return 'Figuritas Especiales';
  if (props.category === 'TROQUELADO') return 'Troquelados';
  if (props.category === 'MISSING')    return 'Figuritas Faltantes';
  return props.category;
});
</script>

<style scoped>
.grid-wrapper { padding-bottom: 24px; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: rgba(203,213,225,.5);
  text-align: center;
}
.empty-state.complete { color: rgba(203,213,225,.8); }
.empty-icon { font-size: 3rem; }
.empty-title { font-size: 1.3rem; font-weight: 800; color: #a5f3c4; }
.empty-sub { font-size: .9rem; color: rgba(165,243,196,.6); }

/* ── Section header ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  margin-bottom: 16px;
  border-left: 4px solid transparent;
}
.sh-regular    { background: rgba(251,191,36,.07); border-left-color: #fbbf24; }
.sh-especial   { background: rgba(244,114,182,.07); border-left-color: #f472b6; }
.sh-troquelado { background: rgba(34,211,238,.07);  border-left-color: #22d3ee; }
.sh-missing    { background: rgba(239,68,68,.07);   border-left-color: #ef4444; }

.sh-left  { display: flex; align-items: center; gap: 10px; }
.sh-icon  { font-size: 1.4rem; }
.sh-title { font-size: 1rem; font-weight: 700; color: #e2e8f0; letter-spacing: -.2px; }

.sh-stats  { display: flex; align-items: center; gap: 6px; }
.sh-got    { font-size: 1.5rem; font-weight: 800; color: #a5f3c4; line-height: 1; }
.sh-sep    { font-size: 1rem; color: rgba(255,255,255,.25); }
.sh-total  { font-size: .9rem; font-weight: 600; color: rgba(203,213,225,.5); }

.sh-mini-bar {
  width: 80px; height: 6px;
  background: rgba(255,255,255,.08);
  border-radius: 999px;
  overflow: hidden;
  margin-left: 8px;
}
.sh-mini-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #34d399, #10b981);
  transition: width .5s;
}
.sh-missing .sh-mini-fill { background: linear-gradient(90deg, #ef4444, #f87171); }

/* ── Sticker grid ── */
.sticker-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
}
</style>
