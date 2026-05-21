<template>
  <div :class="['sticker-chip', sticker.got ? 'got' : 'missing', { animate: anim }]" @click="onClick">
    <span class="number">{{ sticker.number }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { toggleSticker } from '../api';
import type { Sticker } from '../api';
import { inject } from 'vue';

const props = defineProps<{ sticker: Sticker }>();

const updateSticker = inject('updateSticker') as ((s: Sticker) => void) | undefined;
if (!updateSticker) throw new Error('updateSticker not provided');

const anim = ref(false);
const loading = ref(false);

watch(() => props.sticker.got, () => {
  anim.value = true;
  setTimeout(() => (anim.value = false), 180);
});

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
.sticker-chip { display:flex; align-items:center; justify-content:center; height:64px; border-radius:8px; cursor:pointer; user-select:none; font-weight:700; transition:transform .18s ease, opacity .18s ease, background-color .18s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.sticker-chip .number { font-size:1rem }
.sticker-chip.got { background:var(--color-got); color:#fff }
.sticker-chip.missing { background:var(--color-missing); color:#333 }
.sticker-chip.animate { transform:scale(1.06) }
</style>
