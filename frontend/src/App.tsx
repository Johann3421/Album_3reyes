import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import { getStickers, toggleSticker, type Sticker } from './api';

// ─── Palette ────────────────────────────────────────────────────────────────
const P = {
  bgBase:        '#FAFAF8',
  bgSurface:     '#F2F1ED',
  bgSunken:      '#E8E6DF',
  border:        '#D4D0C8',
  textPrimary:   '#1C1B18',
  textSecondary: '#6B6860',
  textHint:      '#A09C93',
  accent:        '#2D2D2A',
  accentText:    '#FAFAF8',
  missing:       '#C4B89A',
  found:         '#8BAF8B',
} as const;

type Filter = 'all' | 'missing' | 'doubles';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'Todas'        },
  { key: 'missing', label: 'Faltantes'    },
  { key: 'doubles', label: 'Tengo dobles' },
];

// ─── StickerCell ─────────────────────────────────────────────────────────────
function StickerCell({
  sticker,
  onToggle,
}: {
  sticker: Sticker;
  onToggle: (id: number) => void;
}) {
  const [animating, setAnimating] = useState(false);
  const { got } = sticker;

  function handleClick() {
    setAnimating(true);
    onToggle(sticker.id);
    setTimeout(() => setAnimating(false), 150);
  }

  const bg       = got ? 'rgba(139,175,139,0.22)' : 'rgba(196,184,154,0.28)';
  const bdColor  = got ? 'rgba(139,175,139,0.40)'  : 'rgba(196,184,154,0.45)';
  const numColor = got ? '#3A6A3A'                  : '#7A6440';

  return (
    <button
      onClick={handleClick}
      aria-label={`Figurita ${sticker.number} — ${got ? 'encontrada' : 'faltante'}`}
      style={{
        all: 'unset' as CSSProperties['all'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '1',
        minHeight: '44px',
        background: bg,
        border: `1px solid ${bdColor}`,
        borderRadius: '8px',
        cursor: 'pointer',
        position: 'relative',
        transform: animating ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 100ms ease, background 150ms ease, border-color 150ms ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Checkmark badge (found) */}
      {got && (
        <span
          style={{
            position: 'absolute',
            top: '3px',
            right: '5px',
            fontSize: '9px',
            fontWeight: 700,
            color: P.found,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ✓
        </span>
      )}

      {/* Number */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: numColor,
          fontVariantNumeric: 'tabular-nums',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        {sticker.number}
      </span>
    </button>
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: P.bgBase,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          border: `2px solid ${P.bgSunken}`,
          borderTopColor: P.accent,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: P.bgBase,
        gap: '10px',
        padding: '32px 24px',
        textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Neutral ! circle */}
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="22" cy="22" r="21" stroke={P.border} strokeWidth="1.5" />
        <line x1="22" y1="13" x2="22" y2="25" stroke={P.textSecondary} strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="30" r="1.5" fill={P.textSecondary} />
      </svg>

      <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: P.textPrimary }}>
        No se pudo cargar el álbum
      </p>
      <p style={{ margin: '0', fontSize: '13px', color: P.textSecondary }}>
        Revisa tu conexión e intenta de nuevo
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          background: P.accent,
          color: P.accentText,
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.01em',
          touchAction: 'manipulation',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [allStickers, setAllStickers] = useState<Sticker[]>([]);
  const [filter,      setFilter]      = useState<Filter>('all');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);

  // Fetch stickers from API
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getStickers();
      setAllStickers(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Toggle — optimistic update for instant UI feedback
  async function handleToggle(id: number) {
    setAllStickers(prev => prev.map(s => s.id === id ? { ...s, got: !s.got } : s));
    try {
      const updated = await toggleSticker(id);
      setAllStickers(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch {
      setAllStickers(prev => prev.map(s => s.id === id ? { ...s, got: !s.got } : s));
    }
  }

  // Derived state
  const total      = allStickers.length;
  const gotCount   = allStickers.filter(s => s.got).length;
  const missingCnt = total - gotCount;
  const progress   = total ? (gotCount / total) * 100 : 0;

  const visible = allStickers.filter(s => {
    const matchFilter =
      filter === 'missing' ? !s.got :
      filter === 'doubles' ?  s.got :
      true;
    const q = search.trim().toLowerCase();
    const matchSearch = q === '' || s.number.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const sectionLabel =
    filter === 'missing' ? 'Faltantes' :
    filter === 'doubles' ? 'Tengo dobles' :
    'Todas las figuritas';

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState onRetry={load} />;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: P.bgBase,
        minHeight: '100dvh',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
        color: P.textPrimary,
      }}
    >
      {/* Global CSS: keyframes, resets, placeholder color */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${P.bgBase}; -webkit-font-smoothing: antialiased; }
        input[type=search]::-webkit-search-cancel-button { display: none; }
        input::placeholder { color: ${P.textHint}; opacity: 1; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Header — sticky, 56px + 4px progress bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: P.bgBase,
          borderBottom: `1px solid ${P.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            padding: '0 16px',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 600, color: P.textPrimary, letterSpacing: '-0.01em' }}>
            Álbum de Figuritas
          </span>
          <span
            style={{
              fontSize: '13px',
              color: P.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {gotCount}\u202f/\u202f{total} figuritas
          </span>
        </div>

        {/* Progress micro-bar */}
        <div style={{ height: '4px', background: P.bgSunken, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: P.found,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      </header>

      {/* Filtros — sticky just below header */}
      <div
        style={{
          position: 'sticky',
          top: '60px',
          zIndex: 9,
          background: P.bgBase,
          borderBottom: `1px solid ${P.border}`,
          padding: '10px 16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
        } as CSSProperties}
      >
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              background: filter === f.key ? P.accent       : P.bgSurface,
              color:      filter === f.key ? P.accentText   : P.textSecondary,
              transition: 'background 150ms ease, color 150ms ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              letterSpacing: '0.01em',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: P.bgSunken,
            border: `1px solid ${P.border}`,
            borderRadius: '10px',
            padding: '10px 14px',
          }}
        >
          {/* Lupa SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke={P.textHint} strokeWidth="1.3" />
            <path d="M10 10L13.5 13.5" stroke={P.textHint} strokeWidth="1.3" strokeLinecap="round" />
          </svg>

          <input
            type="search"
            inputMode="text"
            placeholder="Buscar por número…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: P.textPrimary,
              fontFamily: "'DM Sans', sans-serif",
              caretColor: P.accent,
              minWidth: 0,
              outline: 'none',
            }}
          />

          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              style={{
                all: 'unset' as CSSProperties['all'],
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                color: P.textHint,
                display: 'flex',
                alignItems: 'center',
                touchAction: 'manipulation',
                padding: '2px 4px',
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Grid de figuritas */}
      <main style={{ padding: '4px 16px 80px' }}>

        {/* Label de sección */}
        {visible.length > 0 && (
          <p
            style={{
              margin: '4px 0 10px',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: P.textHint,
            }}
          >
            {sectionLabel}&ensp;·&ensp;{visible.length}
          </p>
        )}

        {visible.length === 0 ? (
          // Estado vacío
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 0',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '28px', opacity: 0.35 }}>
              {filter === 'missing' ? '🎉' : '🔍'}
            </span>
            <p style={{ margin: 0, fontSize: '14px', color: P.textSecondary }}>
              {filter === 'missing'
                ? '¡No te falta ninguna!'
                : 'Sin resultados para esta búsqueda.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}
          >
            {visible.map(s => (
              <StickerCell key={s.id} sticker={s} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </main>

      {/* Footer fijo */}
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: P.bgBase,
          borderTop: `1px solid ${P.border}`,
          zIndex: 8,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <span style={{ fontSize: '13px', color: P.textSecondary }}>
          Te faltan{' '}
          <strong style={{ color: P.textPrimary, fontWeight: 600 }}>
            {missingCnt}
          </strong>
          {' '}figuritas de {total}
        </span>
      </footer>
    </div>
  );
}
