<template>
  <div
    :class="chipClasses"
    :style="chipStyle"
    @click="onClick"
    :title="`#${sticker.number} – ${sticker.category}`"
  >
    <!-- Holographic overlay for 'got' stickers -->
    <div v-if="sticker.got" class="holo"></div>

    <!-- Checkmark (got) -->
    <div v-if="sticker.got" class="chip-check">✓</div>

    <!-- Number -->
    <div class="chip-number">{{ sticker.number }}</div>

    <!-- Loading indicator -->
    <div v-if="loading" class="chip-loading"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { toggleSticker } from '../api';
import type { Sticker } from '../api';
import { inject } from 'vue';

const props = defineProps<{ sticker: Sticker; idx?: number }>();

const updateSticker = inject('updateSticker') as ((s: Sticker) => void) | undefined;
if (!updateSticker) throw new Error('updateSticker not provided');

const loading = ref(false);
const bouncing = ref(false);

const chipClasses = computed(() => {
  const cat = (props.sticker.category || '').toLowerCase();
  return {
    'chip': true,
    [`chip-${cat}`]: true,
    'chip-got': props.sticker.got,
    'chip-missing': !props.sticker.got,
    'chip-loading-state': loading.value,
    'chip-bounce': bouncing.value,
  };
});

// Slight tilt per idx to mimic a real sticker album feel
const chipStyle = computed(() => {
  const n = props.idx ?? 0;
  const rot = ((n * 3) % 7) - 3; // range -3..+3 degrees, deterministic
  return {
    '--tilt': `${rot * 0.4}deg`,
  };
});

async function onClick() {
  if (loading.value) return;
  loading.value = true;
  try {
    const updated = await toggleSticker(props.sticker.id);
    updateSticker(updated);
    bouncing.value = true;
    setTimeout(() => { bouncing.value = false; }, 350);
  } catch (err) {
    console.error('Toggle failed', err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* ── Base chip ── */
.chip {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  transform: rotate(var(--tilt, 0deg));
  transition:
    transform .18s cubic-bezier(.34,1.56,.64,1),
    box-shadow .18s ease,
    opacity .18s ease;
}
.chip:hover {
  transform: rotate(var(--tilt, 0deg)) scale(1.08) translateY(-3px);
  z-index: 2;
}
.chip:active { transform: rotate(var(--tilt, 0deg)) scale(.96); }
.chip-bounce  { animation: bounce .35s cubic-bezier(.34,1.56,.64,1); }
@keyframes bounce {
  0%,100% { transform: rotate(var(--tilt, 0deg)) scale(1); }
  50%      { transform: rotate(var(--tilt, 0deg)) scale(1.2); }
}

/* ── Number label ── */
.chip-number {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -.5px;
  line-height: 1;
  z-index: 1;
}

/* ── Check mark ── */
.chip-check {
  position: absolute;
  top: 6px;
  right: 7px;
  font-size: .7rem;
  font-weight: 900;
  opacity: .9;
  z-index: 2;
}

/* ── Holographic shimmer ── */
.holo {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    125deg,
    transparent 20%,
    rgba(255,255,255,.14) 40%,
    rgba(255,255,255,.05) 60%,
    transparent 80%
  );
  background-size: 200% 200%;
  animation: holo-sweep 3s linear infinite;
  pointer-events: none;
  z-index: 1;
}
@keyframes holo-sweep {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* ── Loading spinner ── */
.chip-loading {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}
.chip-loading::after {
  content: '';
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════
   MISSING chips (dark, muted, dashed)
══════════════════════════════════════ */
.chip-missing {
  background: rgba(255,255,255,.04);
  border: 1.5px dashed rgba(255,255,255,.12);
  box-shadow: none;
}
.chip-missing .chip-number { color: rgba(203,213,225,.3); }
.chip-missing:hover {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.2);
  box-shadow: 0 6px 20px rgba(0,0,0,.3);
}
.chip-missing .chip-number { font-size: .9rem; }

/* ══════════════════════════════════════
   GOT — REGULAR  (Gold/Amber)
══════════════════════════════════════ */
.chip-regular.chip-got {
  background: linear-gradient(145deg, #78350f, #b45309, #d97706, #fbbf24);
  box-shadow: 0 4px 18px rgba(251,191,36,.5), inset 0 1px 0 rgba(255,255,255,.2);
  border: 1px solid rgba(251,191,36,.4);
}
.chip-regular.chip-got .chip-number { color: #fffbeb; text-shadow: 0 1px 4px rgba(120,53,15,.6); }
.chip-regular.chip-got .chip-check  { color: #fef3c7; }
.chip-regular.chip-got:hover { box-shadow: 0 8px 28px rgba(251,191,36,.65); }

/* ══════════════════════════════════════
   GOT — ESPECIAL  (Pink/Fuchsia)
══════════════════════════════════════ */
.chip-especial.chip-got {
  background: linear-gradient(145deg, #701a75, #a21caf, #c026d3, #f0abfc);
  box-shadow: 0 4px 18px rgba(240,171,252,.5), inset 0 1px 0 rgba(255,255,255,.2);
  border: 1px solid rgba(240,171,252,.35);
}
.chip-especial.chip-got .chip-number { color: #fdf4ff; text-shadow: 0 1px 4px rgba(112,26,117,.7); }
.chip-especial.chip-got .chip-check  { color: #fae8ff; }
.chip-especial.chip-got:hover { box-shadow: 0 8px 28px rgba(240,171,252,.65); }

/* ══════════════════════════════════════
   GOT — TROQUELADO  (Cyan/Teal)
══════════════════════════════════════ */
.chip-troquelado.chip-got {
  background: linear-gradient(145deg, #164e63, #0e7490, #06b6d4, #67e8f9);
  box-shadow: 0 4px 18px rgba(103,232,249,.5), inset 0 1px 0 rgba(255,255,255,.2);
  border: 1px solid rgba(103,232,249,.35);
}
.chip-troquelado.chip-got .chip-number { color: #ecfeff; text-shadow: 0 1px 4px rgba(22,78,99,.7); }
.chip-troquelado.chip-got .chip-check  { color: #cffafe; }
.chip-troquelado.chip-got:hover { box-shadow: 0 8px 28px rgba(103,232,249,.65); }
</style>
