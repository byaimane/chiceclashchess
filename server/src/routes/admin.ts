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

// --- Arena Themes Management ---
router.get('/themes', async (_req, res) => {
  try {
    const themes = await prisma.arenaTheme.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ themes });
  } catch (err) {
    console.error('Admin themes error:', err);
    res.status(500).json({ error: 'Failed to load arena themes.' });
  }
});

router.post('/themes', async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const rawSlug = String(req.body?.slug ?? name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const description = String(req.body?.description ?? '').trim();
    const lightSquare = String(req.body?.lightSquare ?? '#EEEED2').trim();
    const darkSquare = String(req.body?.darkSquare ?? '#769656').trim();
    const boardBorder = String(req.body?.boardBorder ?? '#1C1917').trim();
    const arenaBg = String(req.body?.arenaBg ?? '#F6F3EC').trim();
    const accentColor = String(req.body?.accentColor ?? '#1B5E3A').trim();

    if (!name || !rawSlug) {
      res.status(400).json({ error: 'Theme name is required.' });
      return;
    }

    const existing = await prisma.arenaTheme.findUnique({ where: { slug: rawSlug } });
    if (existing) {
      res.status(409).json({ error: 'A theme with that slug already exists.' });
      return;
    }

    const theme = await prisma.arenaTheme.create({
      data: {
        slug: rawSlug,
        name,
        description,
        lightSquare,
        darkSquare,
        boardBorder,
        arenaBg,
        accentColor,
        isActive: true,
        isDefault: false,
      },
    });
    res.status(201).json({ theme });
  } catch (err) {
    console.error('Admin create theme error:', err);
    res.status(500).json({ error: 'Failed to create arena theme.' });
  }
});

router.patch('/themes/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const data: Record<string, unknown> = {};
    if (typeof req.body?.name === 'string') data.name = req.body.name.trim();
    if (typeof req.body?.description === 'string') data.description = req.body.description.trim();
    if (typeof req.body?.lightSquare === 'string') data.lightSquare = req.body.lightSquare.trim();
    if (typeof req.body?.darkSquare === 'string') data.darkSquare = req.body.darkSquare.trim();
    if (typeof req.body?.boardBorder === 'string') data.boardBorder = req.body.boardBorder.trim();
    if (typeof req.body?.arenaBg === 'string') data.arenaBg = req.body.arenaBg.trim();
    if (typeof req.body?.accentColor === 'string') data.accentColor = req.body.accentColor.trim();
    if (typeof req.body?.isActive === 'boolean') data.isActive = req.body.isActive;

    if (req.body?.isDefault === true) {
      await prisma.arenaTheme.updateMany({ data: { isDefault: false } });
      data.isDefault = true;
      data.isActive = true;
    }

    const theme = await prisma.arenaTheme.update({
      where: { id },
      data,
    });
    res.json({ theme });
  } catch (err) {
    console.error('Admin update theme error:', err);
    res.status(500).json({ error: 'Failed to update arena theme.' });
  }
});

router.delete('/themes/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const theme = await prisma.arenaTheme.findUnique({ where: { id } });
    if (!theme) {
      res.status(404).json({ error: 'Theme not found.' });
      return;
    }
    if (theme.isDefault) {
      res.status(400).json({ error: 'Cannot delete the default theme.' });
      return;
    }
    await prisma.arenaTheme.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete theme error:', err);
    res.status(500).json({ error: 'Failed to delete arena theme.' });
  }
});

// --- Integrated Plugins Management ---
router.get('/plugins', async (_req, res) => {
  try {
    const plugins = await prisma.plugin.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json({ plugins });
  } catch (err) {
    console.error('Admin plugins error:', err);
    res.status(500).json({ error: 'Failed to load plugins.' });
  }
});

router.post('/plugins', async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const rawSlug = String(req.body?.slug ?? name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const description = String(req.body?.description ?? '').trim();
    const category = String(req.body?.category ?? 'gameplay').trim();
    const version = String(req.body?.version ?? '1.0.0').trim();
    const enabled = req.body?.enabled !== false;
    const configJson = String(req.body?.configJson ?? '{}').trim() || '{}';

    if (!name || !rawSlug) {
      res.status(400).json({ error: 'Plugin name is required.' });
      return;
    }

    try {
      JSON.parse(configJson);
    } catch {
      res.status(400).json({ error: 'Plugin configuration must be valid JSON.' });
      return;
    }

    const existing = await prisma.plugin.findUnique({ where: { slug: rawSlug } });
    if (existing) {
      res.status(409).json({ error: 'A plugin with that slug already exists.' });
      return;
    }

    const plugin = await prisma.plugin.create({
      data: {
        slug: rawSlug,
        name,
        description,
        category,
        version,
        enabled,
        configJson,
      },
    });
    res.status(201).json({ plugin });
  } catch (err) {
    console.error('Admin create plugin error:', err);
    res.status(500).json({ error: 'Failed to create plugin.' });
  }
});

router.patch('/plugins/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const data: Record<string, unknown> = {};
    if (typeof req.body?.name === 'string') data.name = req.body.name.trim();
    if (typeof req.body?.description === 'string') data.description = req.body.description.trim();
    if (typeof req.body?.category === 'string') data.category = req.body.category.trim();
    if (typeof req.body?.version === 'string') data.version = req.body.version.trim();
    if (typeof req.body?.enabled === 'boolean') data.enabled = req.body.enabled;
    if (typeof req.body?.configJson === 'string') {
      try {
        JSON.parse(req.body.configJson);
      } catch {
        res.status(400).json({ error: 'Plugin configuration must be valid JSON.' });
        return;
      }
      data.configJson = req.body.configJson;
    }

    const plugin = await prisma.plugin.update({
      where: { id },
      data,
    });
    res.json({ plugin });
  } catch (err) {
    console.error('Admin update plugin error:', err);
    res.status(500).json({ error: 'Failed to update plugin.' });
  }
});

router.delete('/plugins/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    await prisma.plugin.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete plugin error:', err);
    res.status(500).json({ error: 'Failed to delete plugin.' });
  }
});

export default router;
