import dotenv from 'dotenv';

dotenv.config();

const defaultOrigins = [
  'http://localhost:5173',
  'https://choiceclash.vercel.app',
  'https://choiceclash-codingkonets-projects.vercel.app',
];

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-chess-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: Array.from(new Set([...defaultOrigins, ...configuredOrigins])),
};
