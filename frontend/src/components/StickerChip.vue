<template>
  <div :class="chipClasses" @click="onClick">
    <div class="chip-idx">#{{ idx }}</div>
    <div class="chip-num">{{ sticker.number }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { toggleSticker } from '../api';
import type { Sticker } from '../api';
import { inject } from 'vue';

const props = defineProps<{ sticker: Sticker; idx?: number }>();
const idx = props.idx || 0;

const updateSticker = inject('updateSticker') as ((s: Sticker) => void) | undefined;
if (!updateSticker) throw new Error('updateSticker not provided');

const anim = ref(false);
const loading = ref(false);

watch(() => props.sticker.got, () => {
  anim.value = true;
  setTimeout(() => (anim.value = false), 200);
});

const categoryClass = computed(() => {
  const c = (props.sticker.category || '').toLowerCase();
  if (c === 'regular') return 'chip-reg';
  if (c === 'especial') return 'chip-esp';
  if (c === 'troquelado') return 'chip-troq';
  return '';
});

const chipClasses = computed(() => ({
  'chip': true,
  [categoryClass.value]: true,
  'got': props.sticker.got,
  'missing': !props.sticker.got,
  'animate': anim.value
}));

async function onClick() {
  if (loading.value) return;
  loading.value = true;
  try {
    const updated = await toggleSticker(props.sticker.id);
    updateSticker(updated);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Toggle failed', err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.chip { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; height:84px; border-radius:10px; cursor:pointer; user-select:none; font-weight:700; transition:transform .18s ease, opacity .18s ease, background-color .18s ease, box-shadow .18s ease; box-shadow: 0 6px 18px rgba(2,6,23,0.06); padding:8px }
.chip-idx { position:absolute; top:6px; left:8px; font-size:11px; color:var(--muted) }
.chip-num { font-size:1.1rem }
.chip.got { background:var(--color-got); color:#fff; box-shadow:0 8px 22px rgba(37,99,235,0.08); }
.chip.missing { background:var(--color-missing); color:var(--muted); border:1px dashed rgba(0,0,0,0.04) }
.chip.animate { transform:scale(1.05) }

.chip-reg.got { background: linear-gradient(180deg, #fffbeb, #fff8e6); color:#2b3a00 }
.chip-esp.got { background: linear-gradient(180deg,#fff0f6,#fff9fb); color:#5b1033 }
.chip-troq.got { background: linear-gradient(180deg,#f0fbff,#eef7ff); color:#003b47 }

.chip-reg.missing { background:var(--color-reg) }
.chip-esp.missing { background:var(--color-esp) }
.chip-troq.missing { background:var(--color-troq) }
</style>
