<template>
  <div id="app">
    <header class="app-header">
      <div class="title">Álbum de Figuritas</div>
      <div class="progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ totalGot }} / {{ totalCount }}</div>
      </div>
    </header>

    <nav class="tabs">
      <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }}</button>
    </nav>

    <main class="content">
      <StickerGrid :category="activeTab" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue';
import StickerGrid from './components/StickerGrid.vue';
import { getStickers, getSummary, type Sticker, type Summary } from './api';

const stickers = ref<Sticker[]>([]);
const summary = ref<Summary[]>([]);

provide('stickers', stickers);

function updateStickerInStore(updated: Sticker) {
  const idx = stickers.value.findIndex((s) => s.id === updated.id);
  if (idx >= 0) {
    stickers.value.splice(idx, 1, updated);
  } else {
    stickers.value.push(updated);
  }
  // recompute summary from stickers
  const map = new Map<string, { total: number; got: number }>();
  for (const s of stickers.value) {
    const v = map.get(s.category) || { total: 0, got: 0 };
    v.total += 1;
    if (s.got) v.got += 1;
    map.set(s.category, v);
  }
  summary.value = Array.from(map.entries()).map(([category, v]) => ({ category, total: v.total, got: v.got, missing: v.total - v.got }));
}

provide('updateSticker', updateStickerInStore);

const tabs = [
  { key: 'REGULAR', label: 'REGULARES' },
  { key: 'ESPECIAL', label: 'ESPECIALES' },
  { key: 'TROQUELADO', label: 'TROQUELADOS' },
  { key: 'MISSING', label: 'FALTANTES' },
];

const activeTab = ref('REGULAR');

const totalCount = computed(() => stickers.value.length);
const totalGot = computed(() => stickers.value.filter((s) => s.got).length);
const progressPercent = computed(() => (totalCount.value ? Math.round((totalGot.value / totalCount.value) * 100) : 0));

onMounted(async () => {
  try {
    stickers.value = await getStickers();
    summary.value = await getSummary();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to load initial data', err);
  }
});
</script>

<style>
:root {
  --color-got: #27ae60;
  --color-missing: #cfcfcf;
  --color-reg: #f7f3e9;
  --color-esp: #fff4e6;
  --color-troq: #eef9ff;
  --text: #222;
  --bg: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-got: #2ecc71;
    --color-missing: #3a3a3a;
    --text: #eaeaea;
    --bg: #0f0f11;
  }
}

* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: var(--text); background: var(--bg); }

.app-header { display:flex; align-items:center; justify-content:space-between; padding:16px; gap:16px; }
.title { font-size:1.25rem; font-weight:700 }
.progress { display:flex; align-items:center; gap:12px; }
.progress-bar { width:180px; height:10px; background:rgba(0,0,0,0.08); border-radius:999px; overflow:hidden }
.progress-fill { height:100%; background:var(--color-got); transition:width .3s ease }
.progress-text { font-size:.9rem }

.tabs { display:flex; gap:8px; padding:8px 16px; }
.tabs button { background:transparent; border:1px solid rgba(0,0,0,0.06); padding:8px 12px; border-radius:8px; cursor:pointer }
.tabs button.active { background:var(--color-got); color:#fff; border-color:transparent }

.content { padding:16px }

/* Global grid style used by StickerGrid */
.sticker-grid { display:grid; gap:10px; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); }

</style>
