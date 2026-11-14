import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { seedAdmin } from './lib/seedAdmin.js';
import { seedThemesAndPlugins } from './lib/seedThemesAndPlugins.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import configRoutes from './routes/config.js';
import gameRoutes from './routes/games.js';
import rewardsRoutes from './routes/rewards.js';
import { setupSocketServer } from './socket/index.js';

const app = express();

app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/admin', adminRoutes);

const httpServer = createServer(app);
setupSocketServer(httpServer);

async function start() {
  await seedAdmin();
  await seedThemesAndPlugins();
  httpServer.listen(env.port, () => {
    console.log(`ChoiceCLASH server running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
