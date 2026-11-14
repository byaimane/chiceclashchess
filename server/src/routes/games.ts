import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.get('/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const games = await prisma.game.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        whitePlayer: { select: { id: true, username: true } },
        blackPlayer: { select: { id: true, username: true } },
      },
    });

    res.json({ games });
  } catch (err) {
    console.error('Match history error:', err);
    res.status(500).json({ error: 'Failed to load match history.' });
  }
});

export default router;
