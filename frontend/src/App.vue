<template>
  <div id="app">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="app-wrapper">

      <!-- ═══ HEADER ═══ -->
      <header class="header-card">
        <div class="header-left">
          <div class="album-icon">🌟</div>
          <div>
            <h1 class="header-title">Álbum de Figuritas</h1>
            <p class="header-sub">Reyes Magos · Colección 2025</p>
          </div>
        </div>
        <div class="header-right">
          <div class="ring-wrap">
            <svg class="ring-svg" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" class="ring-bg"/>
              <circle cx="22" cy="22" r="18" class="ring-fill"
                :style="{ strokeDashoffset: ringOffset }" />
            </svg>
            <div class="ring-text">{{ progressPercent }}<span class="ring-pct">%</span></div>
          </div>
          <div class="header-stats">
            <div class="hstat">
              <span class="hstat-val got-val">{{ totalGot }}</span>
              <span class="hstat-lbl">Tengo</span>
            </div>
            <span class="hstat-sep">·</span>
            <div class="hstat">
              <span class="hstat-val">{{ totalCount - totalGot }}</span>
              <span class="hstat-lbl">Faltan</span>
            </div>
            <span class="hstat-sep">·</span>
            <div class="hstat">
              <span class="hstat-val">{{ totalCount }}</span>
              <span class="hstat-lbl">Total</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ═══ PROGRESS BAR ═══ -->
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }">
          <div class="progress-glow"></div>
        </div>
        <span class="progress-pct">{{ progressPercent }}%</span>
      </div>

      <!-- ═══ SUMMARY CHIPS ═══ -->
      <div class="summary-row">
        <div v-for="s in summary" :key="s.category" class="sum-chip" :class="`sum-${s.category.toLowerCase()}`">
          <span class="sum-icon">{{ catIcon(s.category) }}</span>
          <span class="sum-name">{{ catLabel(s.category) }}</span>
          <span class="sum-count">{{ s.got }}<span class="sum-total">/{{ s.total }}</span></span>
          <div class="sum-bar-track"><div class="sum-bar-fill" :style="{ width: `${s.total ? Math.round(s.got/s.total*100) : 0}%` }"></div></div>
        </div>
      </div>

      <!-- ═══ TABS ═══ -->
      <nav class="tabs">
        <button v-for="tab in tabs" :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-lbl">{{ tab.label }}</span>
          <span v-if="tabMissing(tab.key)" class="tab-badge">{{ tabMissing(tab.key) }}</span>
        </button>
      </nav>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-if="error" class="error-banner">
        ⚠️ No se pudo conectar al servidor. <button @click="reload">Reintentar</button>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando figuritas…</p>
      </div>

      <!-- ═══ CONTENT ═══ -->
      <main v-else class="content">
        <StickerGrid :category="activeTab" :key="activeTab" />
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue';
import StickerGrid from './components/StickerGrid.vue';
import { getStickers, getSummary, type Sticker, type Summary } from './api';

const stickers = ref<Sticker[]>([]);
const summary  = ref<Summary[]>([]);
const loading  = ref(true);
const error    = ref(false);

provide('stickers', stickers);

function updateStickerInStore(updated: Sticker) {
  const idx = stickers.value.findIndex((s) => s.id === updated.id);
  if (idx >= 0) stickers.value.splice(idx, 1, updated);
  else          stickers.value.push(updated);

  const map = new Map<string, { total: number; got: number }>();
  for (const s of stickers.value) {
    const v = map.get(s.category) ?? { total: 0, got: 0 };
    v.total++;
    if (s.got) v.got++;
    map.set(s.category, v);
  }
  summary.value = Array.from(map.entries()).map(([category, v]) => ({
    category, total: v.total, got: v.got, missing: v.total - v.got,
  }));
}
provide('updateSticker', updateStickerInStore);

const tabs = [
  { key: 'REGULAR',    label: 'Regulares',   icon: '🃏' },
  { key: 'ESPECIAL',   label: 'Especiales',  icon: '✨' },
  { key: 'TROQUELADO', label: 'Troquelados', icon: '🏆' },
  { key: 'MISSING',    label: 'Faltantes',   icon: '🔍' },
];

const activeTab      = ref('REGULAR');
const totalCount     = computed(() => stickers.value.length);
const totalGot       = computed(() => stickers.value.filter((s) => s.got).length);
const progressPercent = computed(() =>
  totalCount.value ? Math.round((totalGot.value / totalCount.value) * 100) : 0,
);

const CIRC = 2 * Math.PI * 18; // r=18
const ringOffset = computed(() =>
  CIRC - (progressPercent.value / 100) * CIRC,
);

function catIcon(c: string) {
  if (c === 'REGULAR')    return '🃏';
  if (c === 'ESPECIAL')   return '✨';
  if (c === 'TROQUELADO') return '🏆';
  return '📌';
}
function catLabel(c: string) {
  if (c === 'REGULAR')    return 'Regulares';
  if (c === 'ESPECIAL')   return 'Especiales';
  if (c === 'TROQUELADO') return 'Troquelados';
  return c;
}
function tabMissing(key: string) {
  if (key === 'MISSING') return stickers.value.filter((s) => !s.got).length || null;
  return null;
}

async function reload() {
  loading.value = true;
  error.value   = false;
  try {
    [stickers.value, summary.value] = await Promise.all([getStickers(), getSummary()]);
  } catch (e) {
    console.error('Failed to load initial data', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(reload);
</script>

<style>
/* ── Reset & fonts ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #08091a;
  color: #e2e8f0;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Ambient orbs ── */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,.35) 0%, transparent 70%); top: -150px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(236,72,153,.25) 0%, transparent 70%); top: 30%; right: -80px; }
.orb-3 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(6,182,212,.2)  0%, transparent 70%); bottom: 0; left: 20%; }

/* ── Wrapper ── */
.app-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1140px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* ── Glass mixin (reused) ── */
.glass {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ── Header ── */
.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px 28px;
  border-radius: 20px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(99,102,241,.18) 0%, rgba(236,72,153,.12) 100%);
  border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.08);
}
.header-left { display: flex; align-items: center; gap: 16px; }
.album-icon {
  font-size: 2.8rem;
  filter: drop-shadow(0 0 12px rgba(253,224,71,.6));
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.header-title {
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(90deg, #f8fafc, #c7d2fe, #f8fafc);
  background-size: 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
  letter-spacing: -.5px;
}
@keyframes shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.header-sub { font-size: .8rem; color: rgba(199,210,254,.6); margin-top: 3px; letter-spacing: .5px; text-transform: uppercase; }
.header-right { display: flex; align-items: center; gap: 24px; }

/* Circular progress ring */
.ring-wrap { position: relative; width: 72px; height: 72px; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg   { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 4; }
.ring-fill {
  fill: none;
  stroke: url(#ring-grad);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 113.1;
  stroke-dashoffset: 113.1;
  transition: stroke-dashoffset .6s cubic-bezier(.4,0,.2,1);
  filter: drop-shadow(0 0 6px rgba(99,102,241,.8));
}
.ring-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 800; color: #e0e7ff;
}
.ring-pct { font-size: .65rem; font-weight: 600; color: rgba(199,210,254,.7); margin-left: 1px; }

.header-stats { display: flex; align-items: center; gap: 12px; }
.hstat { display: flex; flex-direction: column; align-items: center; }
.hstat-val { font-size: 1.4rem; font-weight: 800; line-height: 1; }
.hstat-lbl { font-size: .68rem; color: rgba(199,210,254,.55); text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
.hstat-sep { font-size: 1.4rem; color: rgba(255,255,255,.15); font-weight: 300; }
.got-val { background: linear-gradient(90deg, #34d399, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

/* ── Progress bar ── */
.progress-track {
  position: relative;
  height: 10px;
  background: rgba(255,255,255,.06);
  border-radius: 999px;
  overflow: visible;
  margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,.06);
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1, #ec4899, #06b6d4);
  transition: width .5s cubic-bezier(.4,0,.2,1);
  position: relative;
  overflow: hidden;
}
.progress-glow {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.4) 50%, transparent 100%);
  animation: sweep 2.5s linear infinite;
}
@keyframes sweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
.progress-pct {
  position: absolute;
  right: 0; top: 50%;
  transform: translate(calc(100% + 8px), -50%);
  font-size: .75rem;
  font-weight: 700;
  color: rgba(199,210,254,.7);
}

/* ── Summary chips ── */
.summary-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.sum-chip {
  flex: 1;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.09);
  backdrop-filter: blur(8px);
  transition: transform .2s, box-shadow .2s;
}
.sum-chip:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.sum-icon { font-size: 1.2rem; }
.sum-name { font-size: .7rem; color: rgba(203,213,225,.55); text-transform: uppercase; letter-spacing: .5px; font-weight: 600; }
.sum-count { font-size: 1.2rem; font-weight: 800; line-height: 1; }
.sum-total { font-size: .75rem; font-weight: 500; color: rgba(203,213,225,.45); }
.sum-bar-track { height: 4px; background: rgba(255,255,255,.08); border-radius: 999px; overflow: hidden; margin-top: 2px; }
.sum-bar-fill  { height: 100%; border-radius: 999px; transition: width .5s; }
.sum-regular   .sum-count { color: #fbbf24; }
.sum-regular   .sum-bar-fill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.sum-especial  .sum-count { color: #f472b6; }
.sum-especial  .sum-bar-fill { background: linear-gradient(90deg, #ec4899, #f9a8d4); }
.sum-troquelado .sum-count { color: #22d3ee; }
.sum-troquelado .sum-bar-fill { background: linear-gradient(90deg, #06b6d4, #67e8f9); }

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05);
  color: rgba(203,213,225,.65);
  cursor: pointer;
  font-size: .85rem;
  font-weight: 600;
  font-family: inherit;
  transition: all .2s;
  position: relative;
}
.tab-btn:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }
.tab-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 20px rgba(99,102,241,.45);
}
.tab-icon { font-size: 1rem; }
.tab-lbl  { letter-spacing: .3px; }
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: .7rem;
  font-weight: 800;
  animation: pulse-badge .8s ease-in-out infinite alternate;
}
@keyframes pulse-badge {
  from { transform: scale(1); }
  to   { transform: scale(1.12); }
}

/* ── Error / Loading ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 14px;
  background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.3);
  color: #fca5a5;
  font-size: .9rem;
  margin-bottom: 20px;
}
.error-banner button {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(239,68,68,.4);
  background: rgba(239,68,68,.2);
  color: #fca5a5;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  color: rgba(203,213,225,.5);
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Content ── */
.content { padding: 0; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .header-card { flex-direction: column; align-items: flex-start; }
  .header-right { flex-direction: row; flex-wrap: wrap; }
  .progress-pct { display: none; }
  .app-wrapper { padding: 16px 12px 40px; }
}
</style>
