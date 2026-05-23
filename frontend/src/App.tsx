import React, { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import {
  getStickers, toggleSticker, createSticker, editSticker, deleteSticker,
  type Sticker,
} from './api';

// ─── Palette ─────────────────────────────────────────────────────────────────
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
  found:         '#8BAF8B',
  danger:        '#903030',
  dangerBg:      'rgba(144, 48, 48, 0.08)',
  dangerBorder:  'rgba(144, 48, 48, 0.30)',
} as const;

const CATEGORIES = ['REGULAR', 'ESPECIAL', 'TROQUELADO'] as const;
type Category = typeof CATEGORIES[number];
type Filter = 'all' | 'missing' | 'doubles';

const CAT_LABEL: Record<Category, string> = {
  REGULAR:    '🃏 Regular',
  ESPECIAL:   '✨ Especial',
  TROQUELADO: '🏆 Troquelado',
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'Todas'        },
  { key: 'missing', label: 'Faltantes'    },
  { key: 'doubles', label: 'Tengo dobles' },
];

// ─── StickerCell ─────────────────────────────────────────────────────────────
function StickerCell({
  sticker,
  editMode,
  onToggle,
  onEdit,
}: {
  sticker: Sticker;
  editMode: boolean;
  onToggle: (id: number) => void;
  onEdit: (s: Sticker) => void;
}) {
  const [animating, setAnimating] = useState(false);
  const { got } = sticker;

  function handleClick() {
    if (editMode) { onEdit(sticker); return; }
    setAnimating(true);
    onToggle(sticker.id);
    setTimeout(() => setAnimating(false), 150);
  }

  const bg       = got ? 'rgba(139,175,139,0.22)' : 'rgba(196,184,154,0.28)';
  const bdColor  = got ? 'rgba(139,175,139,0.40)' : 'rgba(196,184,154,0.45)';
  const numColor = got ? '#3A6A3A' : '#7A6440';

  return (
    <button
      onClick={handleClick}
      aria-label={`Figurita ${sticker.number}`}
      style={{
        all: 'unset' as CSSProperties['all'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '1',
        minHeight: '44px',
        background: editMode ? P.bgSurface : bg,
        border: `1px solid ${editMode ? P.border : bdColor}`,
        borderRadius: '8px',
        cursor: 'pointer',
        position: 'relative',
        transform: animating ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 100ms ease, background 150ms ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Checkmark badge (normal mode only) */}
      {got && !editMode && (
        <span style={{
          position: 'absolute', top: '3px', right: '5px',
          fontSize: '9px', fontWeight: 700, color: P.found, lineHeight: 1, userSelect: 'none',
        }}>✓</span>
      )}
      {/* Edit pencil badge (edit mode) */}
      {editMode && (
        <span style={{
          position: 'absolute', top: '3px', right: '5px',
          fontSize: '9px', color: P.textHint, lineHeight: 1, userSelect: 'none',
        }}>✏</span>
      )}
      <span style={{
        fontSize: '14px', fontWeight: 500,
        color: editMode ? P.textSecondary : numColor,
        fontVariantNumeric: 'tabular-nums', userSelect: 'none', lineHeight: 1,
      }}>
        {sticker.number}
      </span>
    </button>
  );
}

// ─── BottomSheet ─────────────────────────────────────────────────────────────
function BottomSheet({
  open, mode, sticker, onClose, onCreate, onEdit, onDelete,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  sticker?: Sticker;
  onClose: () => void;
  onCreate: (number: string, category: Category) => Promise<void>;
  onEdit: (number: string, category: Category) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [number,     setNumber]     = useState('');
  const [category,   setCategory]   = useState<Category>('REGULAR');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [apiError,   setApiError]   = useState('');
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && sticker) {
      setNumber(sticker.number);
      setCategory(sticker.category as Category);
    } else {
      setNumber('');
      setCategory('REGULAR');
    }
    setConfirmDel(false);
    setSaving(false);
    setDeleting(false);
    setApiError('');
    setTimeout(() => inputRef.current?.focus(), 320);
  }, [open, mode, sticker]);

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); }, []);

  async function handleSave() {
    const num = number.trim();
    if (!num) return;
    setSaving(true);
    setApiError('');
    try {
      if (mode === 'create') await onCreate(num, category);
      else await onEdit(num, category);
      onClose();
    } catch (err: any) {
      setApiError(err.message?.includes('409') ? 'Ya existe una figurita con ese número.' : 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDel) {
      setConfirmDel(true);
      confirmTimer.current = setTimeout(() => setConfirmDel(false), 3500);
      return;
    }
    clearTimeout(confirmTimer.current!);
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(28,27,24,0.45)',
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* Sheet panel */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: open ? 'translate(-50%, 0)' : 'translate(-50%, 105%)',
          width: '100%', maxWidth: '480px',
          background: P.bgBase,
          borderRadius: '20px 20px 0 0',
          borderTop: `1px solid ${P.border}`,
          zIndex: 50,
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.10)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', background: P.bgSunken, borderRadius: '999px' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 16px',
        }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: P.textPrimary }}>
            {mode === 'create' ? 'Añadir figurita' : `Editar · ${sticker?.number ?? ''}`}
          </span>
          <button
            onClick={onClose}
            style={{
              all: 'unset' as CSSProperties['all'], cursor: 'pointer',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', color: P.textHint, borderRadius: '50%',
              background: P.bgSurface, touchAction: 'manipulation',
            }}
          >×</button>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Number input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: P.textHint,
            }}>
              Número o código
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              placeholder="Ej: 42, E5, T12…"
              value={number}
              onChange={e => { setNumber(e.target.value); setApiError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              style={{
                border: `1.5px solid ${apiError ? P.dangerBorder : P.border}`,
                borderRadius: '10px',
                padding: '13px 14px',
                fontSize: '16px',
                fontWeight: 500,
                color: P.textPrimary,
                background: P.bgSunken,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                caretColor: P.accent,
                transition: 'border-color 150ms ease',
              }}
            />
            {apiError && (
              <span style={{ fontSize: '12px', color: P.danger }}>{apiError}</span>
            )}
          </div>

          {/* Category selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: P.textHint,
            }}>
              Categoría
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    all: 'unset' as CSSProperties['all'],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '11px 6px',
                    borderRadius: '10px',
                    border: `1.5px solid ${category === cat ? P.accent : P.border}`,
                    background: category === cat ? P.accent : P.bgSurface,
                    color: category === cat ? P.accentText : P.textSecondary,
                    fontSize: '12px', fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    textAlign: 'center',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {CAT_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {/* Delete button — only in edit mode */}
            {mode === 'edit' && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: confirmDel ? 1 : '0 0 auto',
                  padding: '13px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${confirmDel ? P.dangerBorder : P.border}`,
                  background: confirmDel ? P.dangerBg : 'transparent',
                  color: confirmDel ? P.danger : P.textSecondary,
                  fontSize: '14px', fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap',
                }}
              >
                {deleting ? '…' : confirmDel ? 'Confirmar eliminación' : '🗑 Eliminar'}
              </button>
            )}

            {/* Save / Add button */}
            <button
              onClick={handleSave}
              disabled={saving || !number.trim()}
              style={{
                flex: 1,
                padding: '13px 16px',
                borderRadius: '10px',
                border: 'none',
                background: !number.trim() ? P.bgSunken : P.accent,
                color: !number.trim() ? P.textHint : P.accentText,
                fontSize: '14px', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: number.trim() ? 'pointer' : 'default',
                transition: 'all 150ms ease',
                touchAction: 'manipulation',
                letterSpacing: '0.01em',
              }}
            >
              {saving ? 'Guardando…' : mode === 'create' ? '＋ Añadir' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: P.bgBase,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '28px', height: '28px',
        border: `2px solid ${P.bgSunken}`,
        borderTopColor: P.accent,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh', background: P.bgBase,
      gap: '10px', padding: '32px 24px', textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="21" stroke={P.border} strokeWidth="1.5" />
        <line x1="22" y1="13" x2="22" y2="25" stroke={P.textSecondary} strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="30" r="1.5" fill={P.textSecondary} />
      </svg>
      <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: P.textPrimary }}>
        No se pudo cargar el álbum
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: P.textSecondary }}>
        Revisa tu conexión e intenta de nuevo
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: '8px', padding: '10px 24px',
          background: P.accent, color: P.accentText,
          border: 'none', borderRadius: '10px',
          fontSize: '14px', fontWeight: 500,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
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
  const [editMode,    setEditMode]    = useState(false);
  const [sheet, setSheet] = useState<{
    open: boolean; mode: 'create' | 'edit'; sticker?: Sticker;
  }>({ open: false, mode: 'create' });

  // Fetch
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setAllStickers(await getStickers()); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Toggle — optimistic
  async function handleToggle(id: number) {
    setAllStickers(prev => prev.map(s => s.id === id ? { ...s, got: !s.got } : s));
    try {
      const updated = await toggleSticker(id);
      setAllStickers(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch {
      setAllStickers(prev => prev.map(s => s.id === id ? { ...s, got: !s.got } : s));
    }
  }

  // Sort helper — mirrors DB order
  function sortedInsert(list: Sticker[], s: Sticker): Sticker[] {
    const order = (x: Sticker) => {
      const catN = x.category === 'REGULAR' ? 0 : x.category === 'ESPECIAL' ? 1 : 2;
      const num  = x.category === 'REGULAR' ? parseInt(x.number, 10) || 0 : 0;
      return [catN, num, x.number] as [number, number, string];
    };
    return [...list, s].sort((a, b) => {
      const [ac, an, as_] = order(a);
      const [bc, bn, bs_] = order(b);
      return ac !== bc ? ac - bc : an !== bn ? an - bn : as_.localeCompare(bs_);
    });
  }

  // CRUD
  async function handleCreate(number: string, category: Category) {
    const created = await createSticker(number, category);
    setAllStickers(prev => sortedInsert(prev, created));
  }

  async function handleEdit(number: string, category: Category) {
    if (!sheet.sticker) return;
    const updated = await editSticker(sheet.sticker.id, { number, category });
    setAllStickers(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  async function handleDelete() {
    if (!sheet.sticker) return;
    await deleteSticker(sheet.sticker.id);
    setAllStickers(prev => prev.filter(s => s.id !== sheet.sticker!.id));
  }

  // Sheet helpers
  const openCreate = () => setSheet({ open: true, mode: 'create' });
  const openEdit   = (s: Sticker) => setSheet({ open: true, mode: 'edit', sticker: s });
  const closeSheet = () => setSheet(prev => ({ ...prev, open: false }));

  // Derived
  const total      = allStickers.length;
  const gotCount   = allStickers.filter(s => s.got).length;
  const missingCnt = total - gotCount;
  const progress   = total ? (gotCount / total) * 100 : 0;

  const visible = allStickers.filter(s => {
    const matchFilter =
      filter === 'missing' ? !s.got :
      filter === 'doubles' ?  s.got : true;
    const q = search.trim().toLowerCase();
    return matchFilter && (q === '' || s.number.toLowerCase().includes(q));
  });

  const sectionLabel =
    filter === 'missing' ? 'Faltantes' :
    filter === 'doubles' ? 'Tengo dobles' :
    'Todas las figuritas';

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState onRetry={load} />;

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: P.bgBase,
      minHeight: '100dvh',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      color: P.textPrimary,
    }}>
      {/* Global CSS */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${P.bgBase}; -webkit-font-smoothing: antialiased; }
        input[type=search]::-webkit-search-cancel-button { display: none; }
        input::placeholder { color: ${P.textHint}; opacity: 1; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Header — sticky */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: P.bgBase, borderBottom: `1px solid ${P.border}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '56px', padding: '0 16px',
        }}>
          {/* Title */}
          <span style={{ fontSize: '16px', fontWeight: 600, color: P.textPrimary, letterSpacing: '-0.01em' }}>
            Álbum de Figuritas
          </span>

          {/* Right side: edit toggle + counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setEditMode(m => !m)}
              title={editMode ? 'Salir de edición' : 'Editar figuritas'}
              style={{
                all: 'unset' as CSSProperties['all'],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '30px',
                padding: '0 10px',
                borderRadius: '999px',
                border: `1px solid ${editMode ? P.accent : P.border}`,
                background: editMode ? P.accent : P.bgSurface,
                color: editMode ? P.accentText : P.textSecondary,
                fontSize: '12px', fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{editMode ? '✓ Listo' : '✏ Editar'}</span>
            </button>
            <span style={{ fontSize: '13px', color: P.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
              {gotCount}\u202f/\u202f{total}
            </span>
          </div>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div style={{
            background: P.bgSurface,
            borderTop: `1px solid ${P.border}`,
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '12px', color: P.textSecondary }}>
              Toca una figurita para editarla o eliminarla
            </span>
            <button
              onClick={openCreate}
              style={{
                all: 'unset' as CSSProperties['all'],
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', fontWeight: 600, color: P.accent,
                cursor: 'pointer', padding: '4px 8px',
                touchAction: 'manipulation',
              }}
            >
              ＋ Añadir
            </button>
          </div>
        )}

        {/* Progress micro-bar */}
        <div style={{ height: '4px', background: P.bgSunken, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: P.found, transition: 'width 300ms ease' }} />
        </div>
      </header>

      {/* Filtros */}
      <div style={{
        position: 'sticky',
        top: editMode ? '105px' : '60px',
        zIndex: 9,
        background: P.bgBase,
        borderBottom: `1px solid ${P.border}`,
        padding: '10px 16px',
        display: 'flex', gap: '8px',
        overflowX: 'auto',
        transition: 'top 0.2s ease',
      } as CSSProperties}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: '999px',
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              background: filter === f.key ? P.accent : P.bgSurface,
              color:      filter === f.key ? P.accentText : P.textSecondary,
              transition: 'background 150ms ease, color 150ms ease',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: P.bgSunken, border: `1px solid ${P.border}`,
          borderRadius: '10px', padding: '10px 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="4.5" stroke={P.textHint} strokeWidth="1.3" />
            <path d="M10 10L13.5 13.5" stroke={P.textHint} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="search" inputMode="text" placeholder="Buscar por número…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: '14px', color: P.textPrimary,
              fontFamily: "'DM Sans', sans-serif",
              caretColor: P.accent, minWidth: 0, outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              all: 'unset' as CSSProperties['all'], cursor: 'pointer',
              fontSize: '18px', color: P.textHint, display: 'flex',
              alignItems: 'center', padding: '2px 4px', touchAction: 'manipulation',
            }}>×</button>
          )}
        </div>
      </div>

      {/* Grid */}
      <main style={{ padding: '4px 16px 100px' }}>
        {visible.length > 0 && (
          <p style={{
            margin: '4px 0 10px', fontSize: '11px', fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: P.textHint,
          }}>
            {sectionLabel}&ensp;·&ensp;{visible.length}
            {editMode && <span style={{ color: P.accent, marginLeft: '8px' }}>· Modo edición activo</span>}
          </p>
        )}

        {visible.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 0', gap: '8px', textAlign: 'center',
          }}>
            <span style={{ fontSize: '28px', opacity: 0.35 }}>
              {filter === 'missing' ? '🎉' : '🔍'}
            </span>
            <p style={{ margin: 0, fontSize: '14px', color: P.textSecondary }}>
              {filter === 'missing' ? '¡No te falta ninguna!' : 'Sin resultados.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {visible.map(s => (
              <StickerCell
                key={s.id}
                sticker={s}
                editMode={editMode}
                onToggle={handleToggle}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB — add sticker (always visible, below the footer) */}
      <button
        onClick={openCreate}
        title="Añadir figurita"
        style={{
          position: 'fixed', bottom: '76px', right: '50%',
          transform: 'translateX(calc(50% + 196px))', // right-aligned within maxWidth
          width: '48px', height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: P.accent,
          color: P.accentText,
          fontSize: '24px',
          fontWeight: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 2px 8px rgba(0,0,0,0.18)`,
          zIndex: 8,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
      >
        +
      </button>

      {/* Footer */}
      <footer style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: P.bgBase, borderTop: `1px solid ${P.border}`,
        zIndex: 8,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <span style={{ fontSize: '13px', color: P.textSecondary }}>
          Te faltan{' '}
          <strong style={{ color: P.textPrimary, fontWeight: 600 }}>{missingCnt}</strong>
          {' '}figuritas de {total}
        </span>
      </footer>

      {/* Bottom sheet for create / edit */}
      <BottomSheet
        open={sheet.open}
        mode={sheet.mode}
        sticker={sheet.sticker}
        onClose={closeSheet}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
