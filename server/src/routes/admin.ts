import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { calculateLevel } from '../lib/progression.js';
import { ADMIN_EMAIL } from '../lib/seedAdmin.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { gameManager } from '../services/gameManager.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', async (_req, res) => {
  try {
    const [totalUsers, bannedUsers, totalGames, completedGames, pendingPayouts] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isBanned: true } }),
        prisma.game.count(),
        prisma.game.count({ where: { status: 'COMPLETED' } }),
        prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
      ]);

    res.json({
      totalUsers,
      bannedUsers,
      totalGames,
      completedGames,
      pendingPayouts,
      activeRooms: gameManager.listRooms().length,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        wins: true,
        losses: true,
        draws: true,
        xp: true,
        points: true,
        level: true,
        walletCents: true,
        createdAt: true,
      },
    });
    res.json({ users });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

router.patch('/users/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = String(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const data: {
      role?: string;
      isBanned?: boolean;
      wins?: number;
      losses?: number;
      draws?: number;
      points?: number;
      xp?: number;
      level?: number;
    } = {};

    if (typeof req.body?.isBanned === 'boolean') {
      if (target.email === ADMIN_EMAIL && req.body.isBanned) {
        res.status(400).json({ error: 'Cannot ban the primary admin account.' });
        return;
      }
      data.isBanned = req.body.isBanned;
    }

    if (req.body?.role === 'USER' || req.body?.role === 'ADMIN') {
      if (target.email === ADMIN_EMAIL && req.body.role !== 'ADMIN') {
        res.status(400).json({ error: 'Cannot demote the primary admin account.' });
        return;
      }
      data.role = req.body.role;
    }

    for (const stat of ['wins', 'losses', 'draws', 'points', 'xp'] as const) {
      if (req.body?.[stat] !== undefined) {
        const val = Number(req.body[stat]);
        if (!Number.isInteger(val) || val < 0) {
          res.status(400).json({ error: `${stat} must be a non-negative integer.` });
          return;
        }
        data[stat] = val;
      }
    }

    if (data.xp !== undefined) {
      data.level = calculateLevel(data.xp);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        wins: true,
        losses: true,
        draws: true,
        xp: true,
        points: true,
        level: true,
        walletCents: true,
        createdAt: true,
      },
    });

    res.json({ user: updated });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.delete('/users/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = String(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (target.id === req.user?.userId || target.email === ADMIN_EMAIL) {
      res.status(400).json({ error: 'Cannot delete the active or primary admin account.' });
      return;
    }

    await prisma.$transaction([
      prisma.game.updateMany({
        where: { whitePlayerId: id },
        data: { whitePlayerId: null },
      }),
      prisma.game.updateMany({
        where: { blackPlayerId: id },
        data: { blackPlayerId: null },
      }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

router.get('/games', async (_req, res) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        whitePlayer: { select: { id: true, username: true } },
        blackPlayer: { select: { id: true, username: true } },
      },
    });
    res.json({ games });
  } catch (err) {
    console.error('Admin list games error:', err);
    res.status(500).json({ error: 'Failed to load games.' });
  }
});

router.delete('/games/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    await prisma.game.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete game error:', err);
    res.status(500).json({ error: 'Failed to delete game.' });
  }
});

router.get('/rooms', (_req, res) => {
  res.json({ rooms: gameManager.listRooms() });
});

router.delete('/rooms/:roomCode', (req, res) => {
  const roomCode = String(req.params.roomCode);
  const removed = gameManager.closeRoom(roomCode);
  res.json({ ok: removed });
});

router.get('/payouts', async (_req, res) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });
    res.json({ payouts });
  } catch (err) {
    console.error('Admin list payouts error:', err);
    res.status(500).json({ error: 'Failed to load payout requests.' });
  }
});

router.patch('/payouts/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const status = req.body?.status;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
      return;
    }

    const payout = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!payout) {
      res.status(404).json({ error: 'Payout request not found.' });
      return;
    }
    if (payout.status !== 'PENDING') {
      res.status(400).json({ error: 'Payout request has already been processed.' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextPayout = await tx.payoutRequest.update({
        where: { id },
        data: { status, processedAt: new Date() },
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      });

      if (status === 'APPROVED') {
        await tx.user.update({
          where: { id: payout.userId },
          data: { walletCents: { increment: payout.amountCents } },
        });
      } else {
        await tx.user.update({
          where: { id: payout.userId },
          data: { points: { increment: payout.pointsSpent } },
        });
      }

      return nextPayout;
    });

    res.json({ payout: updated });
  } catch (err) {
    console.error('Admin process payout error:', err);
    res.status(500).json({ error: 'Failed to process payout request.' });
  }
});

export default router;
