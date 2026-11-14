import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { ADMIN_EMAIL } from '../lib/seedAdmin.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user: {
  id: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  wins: number;
  losses: number;
  draws: number;
  xp: number;
  points: number;
  level: number;
  walletCents: number;
  preferredThemeSlug: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    xp: user.xp,
    points: user.points,
    level: user.level,
    walletCents: user.walletCents,
    preferredThemeSlug: user.preferredThemeSlug,
    createdAt: user.createdAt,
  };
}

router.post('/signup', async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!USERNAME_REGEX.test(username)) {
      res.status(400).json({
        error: 'Username must be 3-20 characters (letters, numbers, underscores only).',
      });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      const conflictField = existing.email === email ? 'Email' : 'Username';
      res.status(409).json({ error: `${conflictField} is already taken.` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = email === ADMIN_EMAIL ? 'ADMIN' : 'USER';
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role },
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = String(req.body?.identifier ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/username and password are required.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'This account has been suspended by an administrator.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account suspended.' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

export default router;
