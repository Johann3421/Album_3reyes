export type Sticker = {
  id: number;
  number: string;
  category: string;
  got: boolean;
};

export type Summary = {
  category: string;
  total: number;
  got: number;
  missing: number;
};

// Use relative URLs in production (nginx proxies /api/* → backend).
// In Vite dev server the vite.config.ts proxy handles /api/* → localhost:3000.
const apiBase = '';

async function handleRes<T>(res: Response) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error: ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

// ─── Read ────────────────────────────────────────────────────────────────────
export async function getStickers(): Promise<Sticker[]> {
  const res = await fetch(`${apiBase}/api/stickers`);
  return handleRes<Sticker[]>(res);
}

export async function getSummary(): Promise<Summary[]> {
  const res = await fetch(`${apiBase}/api/summary`);
  return handleRes<Summary[]>(res);
}

export async function getMissing(): Promise<Sticker[]> {
  const res = await fetch(`${apiBase}/api/missing`);
  return handleRes<Sticker[]>(res);
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
export async function toggleSticker(id: number): Promise<Sticker> {
  const res = await fetch(`${apiBase}/api/stickers/${id}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleRes<Sticker>(res);
}

// ─── Create ──────────────────────────────────────────────────────────────────
export async function createSticker(number: string, category: string): Promise<Sticker> {
  const res = await fetch(`${apiBase}/api/stickers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, category }),
  });
  return handleRes<Sticker>(res);
}

// ─── Update ──────────────────────────────────────────────────────────────────
export async function editSticker(
  id: number,
  data: { number?: string; category?: string; got?: boolean },
): Promise<Sticker> {
  const res = await fetch(`${apiBase}/api/stickers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleRes<Sticker>(res);
}

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteSticker(id: number): Promise<void> {
  const res = await fetch(`${apiBase}/api/stickers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error: ${res.status} ${txt}`);
  }
}

export default { getStickers, toggleSticker, getSummary, getMissing, createSticker, editSticker, deleteSticker };


