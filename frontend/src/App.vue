<template>
  <div id="app">
    <div class="app-wrapper">
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
  --color-missing: #f1f3f5;
  --color-reg: #fffaf0;
  --color-esp: #fff6fb;
  --color-troq: #f0fbff;
  --text: #222;
  --bg: #f7f8fa;
  --muted: #6b7280;
  --card-bg: #ffffff;
  --accent: #2563eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-got: #2ecc71;
    --color-missing: #3a3a3a;
    --text: #eaeaea;
    --bg: #0b1220;
    --card-bg: #071026;
  }
}

* { box-sizing: border-box; }

body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: var(--text); background: linear-gradient(180deg, var(--bg) 0%, #eef2ff 100%); }

.app-wrapper { max-width:1100px; margin:24px auto; padding:16px; }
.app-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; gap:16px; background:var(--card-bg); border-radius:12px; box-shadow:0 4px 14px rgba(16,24,40,0.06); }
.title { font-size:1.3rem; font-weight:700 }
.progress { display:flex; align-items:center; gap:12px }
.progress-bar { width:240px; height:12px; background:rgba(0,0,0,0.06); border-radius:999px; overflow:hidden }
.progress-fill { height:100%; background:var(--accent); transition:width .35s cubic-bezier(.2,.9,.2,1) }
.progress-text { font-size:.95rem; color:var(--muted) }

.tabs { display:flex; gap:10px; padding:12px 0; }
.tabs button { background:transparent; border:1px solid rgba(16,24,40,0.06); padding:10px 14px; border-radius:999px; cursor:pointer; color:var(--muted); font-weight:600 }
.tabs button.active { background:var(--accent); color:#fff; border-color:transparent; box-shadow:0 6px 18px rgba(37,99,235,0.12) }

.content { padding:16px; background:transparent }

/* Global grid style used by StickerGrid */
.sticker-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); }

.section { margin-bottom:18px; background:var(--card-bg); padding:12px; border-radius:10px; box-shadow:0 6px 18px rgba(16,24,40,0.04) }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px }
.section-title { font-weight:800 }
.section-badge { padding:6px 10px; border-radius:999px; font-weight:700 }
.badge-reg { background:#fff5e6; color:#9a6b1b }
.badge-esp { background:#fff0f6; color:#8b3a5b }
.badge-troq { background:#eff8ff; color:#055160 }


</style>
