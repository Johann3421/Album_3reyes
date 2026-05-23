import express, { Request, Response } from 'express';
import { query } from '../db';

const router = express.Router();

const VALID_CATEGORIES = ['REGULAR', 'ESPECIAL', 'TROQUELADO'] as const;

// ─── GET /stickers ────────────────────────────────────────────────────────────
router.get('/stickers', async (_req: Request, res: Response) => {
  try {
    const sql = `
      SELECT * FROM stickers
      ORDER BY category,
        CASE WHEN category = 'REGULAR' THEN (number::int) ELSE NULL END,
        number
    `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /stickers ───────────────────────────────────────────────────────────
router.post('/stickers', async (req: Request, res: Response) => {
  const { number, category, got = false } = req.body ?? {};
  if (!number || typeof number !== 'string' || !number.trim()) {
    return res.status(400).json({ error: 'number is required' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category must be REGULAR, ESPECIAL or TROQUELADO' });
  }
  try {
    const result = await query(
      'INSERT INTO stickers (number, category, got) VALUES ($1, $2, $3) RETURNING *',
      [number.trim(), category, Boolean(got)],
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Sticker already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /stickers/:id/toggle ────────────────────────────────────────────────
router.post('/stickers/:id/toggle', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const result = await query('UPDATE stickers SET got = NOT got WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sticker not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /stickers/:id ────────────────────────────────────────────────────────
router.put('/stickers/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { number, category, got } = req.body ?? {};
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (number !== undefined) {
    if (typeof number !== 'string' || !number.trim()) return res.status(400).json({ error: 'number must be a non-empty string' });
    fields.push(`number = $${idx++}`); values.push(number.trim());
  }
  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'invalid category' });
    fields.push(`category = $${idx++}`); values.push(category);
  }
  if (got !== undefined) {
    fields.push(`got = $${idx++}`); values.push(Boolean(got));
  }

  if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  values.push(id);
  try {
    const result = await query(
      `UPDATE stickers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sticker not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Sticker already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /stickers/:id ─────────────────────────────────────────────────────
router.delete('/stickers/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const result = await query('DELETE FROM stickers WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sticker not found' });
    res.json({ deleted: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /summary ─────────────────────────────────────────────────────────────
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const sql = `
      SELECT
        category,
        COUNT(*)::int AS total,
        SUM(CASE WHEN got THEN 1 ELSE 0 END)::int AS got,
        SUM(CASE WHEN NOT got THEN 1 ELSE 0 END)::int AS missing
      FROM stickers
      GROUP BY category
      ORDER BY category
    `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /missing ─────────────────────────────────────────────────────────────
router.get('/missing', async (_req: Request, res: Response) => {
  try {
    const sql = `
      SELECT * FROM stickers
      WHERE NOT got
      ORDER BY category,
        CASE WHEN category = 'REGULAR' THEN (number::int) ELSE NULL END,
        number
    `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

