"use strict";
/**
 * seed.ts
 * Script to create the stickers table and populate initial data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
dotenv_1.default.config();
async function run() {
    try {
        await db_1.pool.query(`
      CREATE TABLE IF NOT EXISTS stickers (
        id SERIAL PRIMARY KEY,
        number VARCHAR(10) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('REGULAR','ESPECIAL','TROQUELADO')),
        got BOOLEAN NOT NULL DEFAULT false,
        UNIQUE(number, category)
      )
    `);
        const insert = async (num, category, got) => {
            await db_1.pool.query('INSERT INTO stickers (number, category, got) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [num, category, got]);
        };
        const regularGotTrue = ['3', '7', '53', '61', '101', '107', '121', '131', '149', '150', '170', '171', '186', '211', '219', '223', '228', '240', '246', '288', '292', '322', '324', '334', '335', '339', '348', '352', '373', '376', '377', '388', '392', '398', '444', '455', '456', '460', '479', '483', '486', '510', '524', '534', '538', '562', '568', '571', '572', '573', '574', '576', '577', '578', '579', '584'];
        const regularGotFalse = ['9', '12', '13', '34', '40', '41', '45', '46', '48', '56', '59', '82', '85', '90', '91', '94', '102', '115', '177', '181', '182', '196', '199', '234', '263', '265', '267', '268', '273', '275', '276', '277', '313', '315', '317', '327', '340', '343', '372', '397', '417', '418', '429', '480', '488', '516', '518', '521', '529', '539'];
        const especialesGotTrue = ['E3', 'E4', 'E6', 'E21', 'E22', 'E25', 'E29', 'E33', 'E35', 'E37', 'E42', 'E43', 'E46', 'E50', 'E54', 'E55', 'E58', 'E62', 'E65', 'E66'];
        const especialesGotFalse = ['E39', 'E67'];
        const troqueladosGotTrue = ['T-10', 'T-19', 'T-35', 'T-38', 'T-41', 'T-43', 'T-45', 'T-46', 'T-47', 'T-48'];
        const troqueladosGotFalse = ['T-4', 'T-6', 'T-11', 'T-16', 'T-23', 'T-36', 'T-44'];
        for (const n of regularGotTrue)
            await insert(n, 'REGULAR', true);
        for (const n of regularGotFalse)
            await insert(n, 'REGULAR', false);
        for (const n of especialesGotTrue)
            await insert(n, 'ESPECIAL', true);
        for (const n of especialesGotFalse)
            await insert(n, 'ESPECIAL', false);
        for (const n of troqueladosGotTrue)
            await insert(n, 'TROQUELADO', true);
        for (const n of troqueladosGotFalse)
            await insert(n, 'TROQUELADO', false);
        const cnt = await db_1.pool.query('SELECT COUNT(*)::int AS count FROM stickers');
        console.log('Seed complete. Total stickers:', cnt.rows[0].count);
    }
    catch (err) {
        console.error('Seeding failed', err);
    }
    finally {
        await db_1.pool.end();
        process.exit(0);
    }
}
run();
