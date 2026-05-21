"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
router.get('/stickers', async (_req, res) => {
    try {
        const sql = `
      SELECT * FROM stickers
      ORDER BY category,
        CASE WHEN category = 'REGULAR' THEN (number::int) ELSE NULL END,
        number
    `;
        const result = await (0, db_1.query)(sql);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/stickers/:id/toggle', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
        return res.status(400).json({ error: 'Invalid id' });
    try {
        const result = await (0, db_1.query)('UPDATE stickers SET got = NOT got WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: 'Sticker not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/summary', async (_req, res) => {
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
        const result = await (0, db_1.query)(sql);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/missing', async (_req, res) => {
    try {
        const sql = `
      SELECT * FROM stickers
      WHERE NOT got
      ORDER BY category,
        CASE WHEN category = 'REGULAR' THEN (number::int) ELSE NULL END,
        number
    `;
        const result = await (0, db_1.query)(sql);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
