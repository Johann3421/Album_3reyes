import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stickersRouter from './routes/stickers';
import { pool } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check — used by docker-compose healthcheck and Dokploy
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', stickersRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

const shutdown = async () => {
	console.log('Shutting down server...');
	try {
		await pool.end();
	} catch (err) {
		console.error('Error closing DB pool', err);
	}
	server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
