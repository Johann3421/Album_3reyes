"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const stickers_1 = __importDefault(require("./routes/stickers"));
const db_1 = require("./db");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', stickers_1.default);
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
const shutdown = async () => {
    console.log('Shutting down server...');
    try {
        await db_1.pool.end();
    }
    catch (err) {
        console.error('Error closing DB pool', err);
    }
    server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
exports.default = app;
