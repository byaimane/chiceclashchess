import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  MIN_REDEEM_POINTS,
  POINTS_PER_CENT,
  pointsToCents,
} from '../lib/progression.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(requireAuth);

router.get('/payouts', async (req: AuthenticatedRequest, res) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ payouts });
  } catch (err) {
    console.error('Fetch payouts error:', err);
    res.status(500).json({ error: 'Failed to load payout history.' });
  }
});

router.post('/redeem', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const pointsSpent = Number(req.body?.pointsSpent ?? 0);
    const payoutMethod = String(req.body?.payoutMethod ?? '').trim();
    const destination = String(req.body?.destination ?? '').trim();

    if (!Number.isInteger(pointsSpent) || pointsSpent < MIN_REDEEM_POINTS) {
      res.status(400).json({
        error: `Minimum cash-out is ${MIN_REDEEM_POINTS} points ($${(
          MIN_REDEEM_POINTS /
          POINTS_PER_CENT /
          100
        ).toFixed(2)}).`,
      });
      return;
    }

    if (pointsSpent % 100 !== 0) {
      res.status(400).json({ error: 'Points must be a multiple of 100.' });
      return;
    }

    if (!['PayPal', 'Bank Transfer', 'Gift Card'].includes(payoutMethod)) {
      res.status(400).json({ error: 'Please select a valid payout method.' });
      return;
    }

    if (destination.length < 3 || destination.length > 120) {
      res.status(400).json({ error: 'Please enter a valid payout destination.' });
      return;
    }

    const amountCents = pointsToCents(pointsSpent);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }
      if (user.points < pointsSpent) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: pointsSpent } },
      });

      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          pointsSpent,
          amountCents,
          payoutMethod,
          destination,
          status: 'PENDING',
        },
      });

      return { updatedUser, payout };
    });

    res.status(201).json({
      payout: result.payout,
      points: result.updatedUser.points,
      walletCents: result.updatedUser.walletCents,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_POINTS') {
      res.status(400).json({ error: 'You do not have enough points for this cash-out.' });
      return;
    }
    console.error('Redeem points error:', err);
    res.status(500).json({ error: 'Failed to submit cash-out request.' });
  }
});

export default router;
